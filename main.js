/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window, Mustache */

define(function (require, exports, module) {
  'use strict';

  var
    CommandManager = brackets.getModule("command/CommandManager"),
    EditorManager = brackets.getModule("editor/EditorManager"),
    DocumentManager = brackets.getModule("document/DocumentManager"),
    KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
    ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
    PanelManager = brackets.getModule("view/PanelManager"),
    Menus = brackets.getModule("command/Menus"),
    AppInit = brackets.getModule("utils/AppInit"),
    NativeApp = brackets.getModule("utils/NativeApp"),
    FileSystem = brackets.getModule("filesystem/FileSystem"),
    NodeDomain = brackets.getModule("utils/NodeDomain");

  var DO_ZOT = "zoter-cli.run";
  var panelHtml = require("text!html/panel.html");
  var panel;

  //  var simpleDomain = new NodeDomain("simple", ExtensionUtils.getModulePath(module, "node/SimpleDomain"));
  var zoteroDomain = new NodeDomain("zotero", ExtensionUtils.getModulePath(module, "node/ZoteroDomain"));

  require("lib/qdaSimpleMode");
  require("lib/jqtree/tree.jquery");
  var SQLjs = require('lib/sql/sql');
  var _tree = require("lib/tree");

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function _zotPanel() {
    if (panel.isVisible()) {
      panel.hide();
    } else {
      panel.show();
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function collections2tree(collections) {
    var root = [];
    console.log(collections);
    for (var id in collections) {
      if (collections.hasOwnProperty(id)) {
        var collection = collections[id];
        var parent = collections[collection.parentCollectionID];
        if (parent) {
          parent.children.push(collection);
          console.log("children");
          console.log(parent.children);
          console.log("parent");
          console.log(parent);
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
    //    var keyField;
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
      hash[id].children = [];
    }
    return hash;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  // Helper function that runs the fs.getFile command and logs the result to the console
  function getZotInfo() {
    var path = "/Users/briancleland/Downloads/zotero.sqlite"
    zoteroDomain.exec("getData", path)
      .done(function (zotInfo) {
        console.log("FILE READ FROM NODE!!");
        console.log(zotInfo);
        var collectionsHash = table2hash(zotInfo.collections);
        console.log(collectionsHash);
        console.log(collections2tree(collectionsHash));
      }).fail(function (err) {
        console.error("FILE READ FAILED!!", err);
      });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  CommandManager.register("Connect to Zotero", DO_ZOT, _zotPanel);

  AppInit.appReady(function () {
    var viewMenu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    viewMenu.addMenuItem(DO_ZOT);
    ExtensionUtils.loadStyleSheet(module, "css/zot-cli.css");
    ExtensionUtils.loadStyleSheet(module, "lib/jqtree/jqtree.css");
    ExtensionUtils.loadStyleSheet(module, "css/font-awesome/css/font-awesome.min.css");
    panel = PanelManager.createBottomPanel(DO_ZOT, $(panelHtml), 300);
    $("#zotero-panel-close").click(function () {
      panel.hide();
    });
    // Init jqtree
    _tree.init();
    // Log memory when extension is loaded
    //    logMemory();
    getZotInfo();
  });

});