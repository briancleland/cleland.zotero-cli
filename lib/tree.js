define(function (require, exports, module) {

  var
    ProjectManager = brackets.getModule("project/ProjectManager"),
    FileSystem = brackets.getModule("filesystem/FileSystem"),
    ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
    NodeDomain = brackets.getModule("utils/NodeDomain");

  require("lib/to_markdown/to_markdown");

  var zoteroDomain = new NodeDomain("zotero", ExtensionUtils.getModulePath(module, "../node/ZoteroDomain"));

  var $tree;
  var path = ProjectManager.getInitialProjectPath();
  var timeoutAlert = {
    408: function () {
      alert("timed out!");
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function collections2tree(collections) {
    var root = [];
    collections = table2hash(collections);
    for (var id in collections) {
      if (collections.hasOwnProperty(id)) {
        var collection = collections[id];
        collection.label = collection.collectionName;
        var parent = collections[collection.parentCollectionID];
        if (parent) {
          if (!parent.children) {
            parent.children = []
          }
          parent.children.push(collection);
        } else {
          root.push(collection);
        }
      }
    }
    return root;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function table2hash(table) {
    var hash = {};
    var columns = table.columns;
    var rows = table.values;
    for (var i = 0; i < rows.length; i++) { // for each row
      var row = table.values[i];
      var id = row[0];
      hash[id] = {}
      for (var j = 0; j < columns.length; j++) { // for each column
        var columnName = columns[j];
        hash[id][columnName] = row[j]
      }
    }
    return hash;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  // Helper function that runs the fs.getFile command and logs the result to the console
  function getZotInfo() {
    var path = "/Users/briancleland/Library/Application Support/Zotero/Profiles/de2339k3.default/zotero/zotero.sqlite.bak"
    zoteroDomain.exec("getTables", path)
      .done(function (zotInfo) {
        console.log("FILE READ FROM NODE!!");
        console.log(zotInfo);

        var treeData = collections2tree(zotInfo.collections);
        console.log(treeData);
        $("#zot-collections .tree").tree({
          data: treeData,
          onCreateLi: function (node, $li) {
            $li.find('.jqtree-title').prepend('<i class="fa fa-folder"></i>');
          }
        });

      }).fail(function (err) {
        console.error("FILE READ FAILED!!", err);
      });
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function annotatePdfContent(itemPath, filename, content) {
    var annotationsFile = FileSystem.getFileForPath(itemPath + "/annotations.md");
    var annotatedPdf = FileSystem.getFileForPath(itemPath + "/" + filename + "(annotated).md");
    annotationsFile.read(function (err, text) {
      console.log(text);
      var annotations = text.match(/".*"/g);
      console.log(annotations);
      for (var i = 0; i < annotations.length; i++) {
        var annotation = annotations[i].replace(/"/g, "");
        console.log(annotation);
        var re = new RegExp("(" + annotation + ")", "g");
        content = content.replace(re, "*" + annotation + "* #zotero");
      }
      annotatedPdf.write(content, function (err, stats) {
        console.log(err);
      });
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function saveItem(node) {
    console.log(path + node.name);
    var itemPath = path + "downloads/" + node.name;
    var itemDir = FileSystem.getDirectoryForPath(itemPath);
    itemDir.create();
    var children = node.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      console.log(child);
      if (child.type == "attachment" && child.contentType == "application/pdf") {
        console.log("getting pdf content");
        $.ajax({
            url: "https://api.zotero.org/users/1342965/items/" + child.key + "/fulltext?format=json&key=ZNMqTWWiBTfmYIiO04SGoYci&limit=100&v=3",
            cache: false,
            statusCode: timeoutAlert
          })
          .done(function (data) {
            var file = FileSystem.getFileForPath(itemPath + "/" + child.name);
            file.write(data.content);
            annotatePdfContent(itemPath, file.name, data.content);
          });
      }
      if (child.type == "note") {
        console.log("creating note...");
        console.log(child);
        var file = FileSystem.getFileForPath(itemPath + "/annotations.md");
        file.write(toMarkdown(child.noteContent));
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function convertItems(data) {
    var hash = {};
    var root = [];
    for (var i = 0; i < data.length; i++) {
      var item = data[i]
      if (item.data.itemType != "note") {
        var title = item.data.title;
      } else {
        var title = $(item.data.note).text();
      }
      hash[item.key] = {
        label: title,
        key: item.key,
        type: item.data.itemType,
        noteContent: item.data.note,
        contentType: item.data.contentType,
        parent: item.data.parentItem,
        children: []
      };
    }
    for (var i = 0; i < data.length; i++) {
      var item = hash[data[i].key];
      var parent = hash[item.parent];
      if (parent) {
        parent.children.push(item);
      } else {
        root.push(item);
      }
    }
    return root;
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function getItems(collectionKey) {
    $.ajax({
        url: "https://api.zotero.org/users/1342965/collections/" + collectionKey + "/items?format=json&key=ZNMqTWWiBTfmYIiO04SGoYci&limit=100&v=3",
        cache: false,
        statusCode: timeoutAlert
      })
      .done(function (data) {
        console.log(data);
        var treeData = convertItems(data);
        $("#zot-items .tree").tree("loadData", treeData);
      });
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function init() {
    $tree = $("#zot-collections .tree");
    require("lib/jqTreeContextMenu");
    $("#zot-items .tree").tree({
      onCreateLi: function (node, $li) {
        if (node.type == "attachment" && node.contentType == "application/pdf") {
          $li.find('.jqtree-title').prepend('<i class="fa fa-file-pdf-o"></i>');
        } else if (node.type == "attachment") {
          $li.find('.jqtree-title').prepend('<i class="fa fa-paperclip"></i>');
        } else if (node.type == "note") {
          $li.find('.jqtree-title').prepend('<i class="fa fa-pencil"></i>');
        } else {
          $li.find('.jqtree-title').prepend('<i class="fa fa-file-o"></i>');
        }
      }
    });
    $("#add-node-button").click(function () {
      addGroup()
    });
    // Find snippets when tag node is clicked
    $tree.bind(
      'tree.click',
      function (event) {
        getItems(event.node.key);
      }
    );
    // Init the contextmenu
    $("#zot-items .tree").jqTreeContextMenu($('#zotero-panel #contextMenu'), {
      "save": function (node) {
        saveItem(node);
      }
    });
  };

  getZotInfo();

  exports.init = init;

});