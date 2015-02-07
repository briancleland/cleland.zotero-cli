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
    NativeApp = brackets.getModule("utils/NativeApp");

  var DO_ZOT = "zoter-cli.run";

  var panelHtml = require("text!html/panel.html");
  var panel;

  require("lib/qdaSimpleMode");
  require("lib/jqtree/tree.jquery");
  var _tree = require("lib/tree");

  function _zotPanel() {
    if (panel.isVisible()) {
      panel.hide();
    } else {
      panel.show();
    }
  }

  CommandManager.register("Connect to Zotero", DO_ZOT, _zotPanel);

  AppInit.appReady(function () {
    var viewMenu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    viewMenu.addMenuItem(DO_ZOT);
    ExtensionUtils.loadStyleSheet(module, "css/zot-cli.css");
    ExtensionUtils.loadStyleSheet(module, "lib/jqtree/jqtree.css");
    panel = PanelManager.createBottomPanel(DO_ZOT, $(panelHtml), 300);
    $("#zotero-panel-close").click(function () {
      panel.hide();
    });
    // Init jqtree
    _tree.init();
  });

});