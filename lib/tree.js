define(function (require, exports, module) {

  var
    ProjectManager = brackets.getModule("project/ProjectManager"),
    FileSystem = brackets.getModule("filesystem/FileSystem");

  var $tree;
  var path = ProjectManager.getInitialProjectPath();

  ///////////////////////////////////////////////////////////////////////////////////

  function saveItem(node) {
    console.log(path + node.name);
    var itemDir = FileSystem.getDirectoryForPath(path + "downloads/" + node.name);
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
            statusCode: {
              408: function () {
                alert("timed out!");
              }
            }
          })
          .done(function (data) {
            console.log(data)
            var file = FileSystem.getFileForPath(path + "downloads/" + node.name + "/" + child.name);
            file.write(data.content);
          });
      }
      if (child.type == "note") {
        var file = FileSystem.getFileForPath(path + "downloads/" + node.name + "/" + child.name);
        file.write(child.noteContent);
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
        statusCode: {
          408: function () {
            alert("timed out!");
          }
        }
      })
      .done(function (data) {
        console.log(data);
        var treeData = convertItems(data);
        $("#zot-items .tree").tree("loadData", treeData);
      });
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function convertCollections(data) {
    var hash = {};
    var root = [];
    for (var i = 0; i < data.length; i++) {
      var collection = data[i];
      hash[collection.key] = {
        label: collection.data.name,
        key: collection.key,
        parent: collection.data.parentCollection,
        children: []
      };
    }
    for (var i = 0; i < data.length; i++) {
      var collection = hash[data[i].key];
      var parent = hash[collection.parent];
      if (parent) {
        parent.children.push(collection);
      } else {
        root.push(collection);
      }
    }
    return root;
  }

  ///////////////////////////////////////////////////////////////////////////////////


  function getCollections() {
    $.ajax({
        url: "https://api.zotero.org/users/1342965/collections?format=json&key=ZNMqTWWiBTfmYIiO04SGoYci&limit=100&v=3",
        cache: false,
        statusCode: {
          408: function () {
            if (confirm("Request timed out - try again?")) {
              getCollections();
            };
          }
        }
      })
      .done(function (data) {
        var treeData = convertCollections(data);
        $("#zot-tree").tree({
          data: treeData,
          onCreateLi: function (node, $li) {
            $li.find('.jqtree-title').prepend('<i class="fa fa-folder"></i>');
          }
        });
      });
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function init() {
    $tree = $("#zot-tree");
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
    getCollections();
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

  exports.init = init;

});