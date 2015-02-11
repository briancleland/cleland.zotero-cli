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
  var fsDomain = new NodeDomain("fs", ExtensionUtils.getModulePath(module, "node/FsDomain"));

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

  // Helper function that runs the simple.getMemory command and logs the result to the console
  //  function logMemory() {
  //    simpleDomain.exec("getMemory", false)
  //      .done(function (memory) {
  //        console.log(
  //          "[brackets-simple-node] Memory: %d bytes free",
  //          memory
  //        );
  //      }).fail(function (err) {
  //        console.error("[brackets-simple-node] failed to run simple.getMemory", err);
  //      });
  //  }

  ////////////////////////////////////////////////////////////////////////////////////////////////


  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  // Helper function that runs the fs.getFile command and logs the result to the console
  function logFile() {
    var path = "/Users/briancleland/Downloads/zotero.sqlite"
    fsDomain.exec("getFile", path)
      .done(function (res) {
        //        console.log(ab2str(data));
        // var res = db.exec("SELECT * FROM table1");
        //        console.log(res);
        console.log("FILE READ FROM NODE!!");
        console.log(res);
//        var db = new SQL.Database(res.filebuffer);
//        var info = db.exec("SELECT * FROM collections");
//        console.log(info);
      }).fail(function (err) {
        console.error("FILE READ FAILED!!", err);
      });
  }

  // Helper function that runs the fs.getFile command and logs the result to the console
  function logFile2() {
    var path = "/Users/briancleland/Downloads/briantest"
    var file = FileSystem.getFileForPath(path);
    file.read(function (err, string) {
      console.log(err);
      console.log(string);
      //      var ab = str2ab(string);
      //      var db = new SQL.Database(ab);   
      //      var res = db.exec("SELECT name FROM sqlite_master");
      //      console.log(res);
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
    logFile();
  });

});