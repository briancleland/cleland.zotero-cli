define(function (require, exports, module) {

  var
    ProjectManager = brackets.getModule("project/ProjectManager"),
    FileSystem = brackets.getModule("filesystem/FileSystem");

  var $tree;
  var path = ProjectManager.getInitialProjectPath();
  var file = FileSystem.getFileForPath(path + ".treedata");


  ///////////////////////////////////////////////////////////////////////////////////


  function saveTree() {
    file.write(treeJson());
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function treeJson() {
    var treeData = $tree.tree('toJson');
    if (treeData) {
      return treeData;
    } else {
      return [];
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function nest(collections) {
    var hash = {};
    var root = [];
    for (var i = 0; i < collections.length; i++) {
      var collection = collections[i];
      hash[collection.key] = {
        label: collection.data.name,
        key: collection.key,
        parent: collection.data.parentCollection,
        children: []
      };
    }
    for (var i = 0; i < collections.length; i++) {
      var collection = hash[collections[i].key];
      var parent = hash[collection.parent];
      if (parent) {
        parent.children.push(collection);
      } else {
        root.push(collection);
      }
    }
    return root;
  }

  function getCollections() {
    $.ajax({
        url: "https://api.zotero.org/users/1342965/collections?format=json&key=ZNMqTWWiBTfmYIiO04SGoYci&limit=100&v=3",
        cache: false,
        statusCode: {
          408: function () {
            alert("timed out!");
          }
        }
      })
      .done(function (collections) {
        var treeData = nest(collections);
        $("#zot-tree").tree({
          data: treeData
        });
      });
  }

  ///////////////////////////////////////////////////////////////////////////////////

  function init() {
    $tree = $("#zot-tree");
    require("lib/jqTreeContextMenu");
    getCollections();
    $("#add-node-button").click(function () {
      addGroup()
    });
    // Save the tree when a node is moved
    $tree.bind(
      'tree.move',
      function (event) {
        // move first, _then_ save
        event.preventDefault();
        event.move_info.do_move();
        saveTree();
      }
    );
    // Find snippets when tag node is clicked
    $tree.bind(
      'tree.click',
      function (event) {
        if (event.node.type == "tag") {
          _find.snippets(event.node.name.split(" ")[0]);
        }
      }
    );
    // Init the contextmenu
    $tree.jqTreeContextMenu($('#contextMenu'), {
      "edit": function (node) {
        rename(node);
        saveTree();
      },
      "delete": function (node) {
        if (confirm('Are you sure you want to delete this node?')) {
          $tree.tree('removeNode', node);
          saveTree();
        }
      }
    });
  };

  exports.init = init;

});