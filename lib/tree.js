define(function (require, exports, module) {

  var
    ProjectManager = brackets.getModule("project/ProjectManager"),
    FileSystem = brackets.getModule("filesystem/FileSystem"),
    ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
    NodeDomain = brackets.getModule("utils/NodeDomain");

  require("lib/to_markdown/to_markdown");
  require("lib/jqtree/tree.jquery");

  var zoteroDomain = new NodeDomain("zotero", ExtensionUtils.getModulePath(module, "../node/ZoteroDomain"));

  var $collectionsTree, $itemsTree;
  var zot; // holds zotero tables
  var path = ProjectManager.getInitialProjectPath();
  
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

  function init(collectionsData) {
    $collectionsTree = $("#zot-collections .tree");
    $itemsTree = $("#zot-items .tree");
    require("lib/jqTreeContextMenu");
    $collectionsTree.tree({
      data: collectionsData,
      onCreateLi: function (node, $li) {
        $li.find('.jqtree-title').prepend('<i class="fa fa-folder"></i>');
      }
    });
    $itemsTree.tree({
      onCreateLi: function (node, $li) {
        if (node.type == "attachment" && node.mimeType == "application/pdf") {
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
    // Find snippets when tag node is clicked
    $collectionsTree.bind(
      'tree.click',
      function (event) {
        $itemsTree.tree("loadData", event.node.items);
      }
    );
    // Init the contextmenu
    $itemsTree.jqTreeContextMenu($('#zotero-panel #contextMenu'), {
      "save": function (node) {
        saveItem(node);
      }
    });
  };

  ///////////////////////////////////////////////////////////////////////////////////

  exports.init = init;

});