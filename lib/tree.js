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

  function annotatePdfContent(itemPath, pdfName, content) {
    var annotationsFile = FileSystem.getFileForPath(itemPath + "/annotations.md");
    if (annotationsFile) {
      var annotatedPdf = FileSystem.getFileForPath(itemPath + "/" + pdfName + "(annotated).md");
      annotationsFile.read(function (err, text) {
        if (annotation) {
          var annotations = text.match(/".*"/g);
          for (var i = 0; i < annotations.length; i++) {
            var annotation = annotations[i].replace(/"/g, "");
            var re = new RegExp("(" + annotation + ")", "g");
            content = content.replace(re, "*" + annotation + "* #zotero");
          }
          annotatedPdf.write(content, function (err, stats) {
            console.log(err);
          });
        }
      });
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function saveCollection(node) {
    for (var i = 0; i < node.items.length; i++) {
      var item = node.items[i];
      item.name = item.label;
      saveItem(item);
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function saveItem(node) {
    var itemPath = path + "downloads/" + node.name;
    var itemDir = FileSystem.getDirectoryForPath(itemPath);
    itemDir.create();
    var children = node.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.mimeType == "application/pdf") {
        var pdfName = child.title;
        console.log(node.name, child, child.label, pdfName);
        var filePath = "/Users/briancleland/Library/Application Support/Zotero/Profiles/de2339k3.default/zotero/storage/" + child.key + "/.zotero-ft-cache";
        var sourceFile = FileSystem.getFileForPath(filePath);
        sourceFile.read(function (err, text) {
          var targetFile = FileSystem.getFileForPath(itemPath + "/" + pdfName + " (full text).md");
          targetFile.write(text);
          annotatePdfContent(itemPath, pdfName, text);
        });
      }
      if (child.type == "note") {
        if (child.label) {
          child.name = child.label
        }
        console.log("LABEL: " + child.name.substring(0, 21));
        if (child.name.substring(0, 21) == "Extracted Annotations") {
          var file = FileSystem.getFileForPath(itemPath + "/annotations.md");
          file.write(toMarkdown(child.content));
        }
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
        console.log(node);
        if (node.mimeType == "application/pdf") {
          $li.find('.jqtree-title').prepend('<i class="fa fa-file-pdf-o"></i>');
        } else if (node.type == "attachment") {
          $li.find('.jqtree-title').prepend('<i class="fa fa-paperclip"></i>');
        } else if (node.type == "note") {
          $li.find('.jqtree-title').prepend('<i class="fa fa-pencil"></i>');
        } else {
          $li.find('.jqtree-title').prepend('[' + node.rating + '] '); // add rating
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
    $collectionsTree.jqTreeContextMenu($('#zot-collections .contextMenu'), {
      "save": function (node) {
        saveCollection(node);
      }
    });
    // Init the contextmenu
    $itemsTree.jqTreeContextMenu($('#zot-items .contextMenu'), {
      "save": function (node) {
        saveItem(node);
      }
    });
  };

  ///////////////////////////////////////////////////////////////////////////////////

  exports.init = init;

});