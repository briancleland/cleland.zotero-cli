/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
  "use strict";

  var fs = require("fs");
  var sql = require("sql.js");

  /**
   * @private
   * Handler function for the simple.getMemory command.
   * @param {boolean} total If true, return total memory; if false, return free memory only.
   * @return {number} The amount of memory.
   */
  function cmdGetTables(path) {
    var filebuffer = fs.readFileSync(path);
    var db = new sql.Database(filebuffer);
    var collections = db.exec("SELECT *  FROM collections")[0];
    var items = db.exec("SELECT *  FROM items")[0];
    var itemNotes = db.exec("SELECT *  FROM itemNotes")[0];
    var itemTypes = db.exec("SELECT *  FROM itemTypes")[0];
    var fulltextItems = db.exec("SELECT *  FROM fulltextItems")[0];
    var itemData = db.exec("SELECT *  FROM itemData")[0];
    var fields = db.exec("SELECT *  FROM fields")[0];
    var itemDataValues = db.exec("SELECT *  FROM itemDataValues")[0];
    var collectionItems = db.exec("SELECT *  FROM collectionItems")[0];
    return {
      collections: collections,
      items: items,
      itemNotes: itemNotes,
      itemTypes: itemTypes,
      fulltextItems: fulltextItems,
      itemData: itemData,
      fields: fields,
      itemDataValues: itemDataValues,
      collectionItems: collectionItems
    };
  }

  /**
   * Initializes the test domain with several test commands.
   * @param {DomainManager} domainManager The DomainManager for the server
   */
  function init(domainManager) {
    if (!domainManager.hasDomain("zotero")) {
      domainManager.registerDomain("zotero", {
        major: 0,
        minor: 1
      });
    }
    domainManager.registerCommand(
      "zotero", // domain name
      "getTables", // command name
      cmdGetTables, // command handler function
      false, // this command is synchronous in Node
      "Gets the zotero db contents using fs.readFileSync", [{
        name: "path", // parameters
        type: "string",
        description: "Full path to the file"
      }], [{
        name: "contents", // return values
        type: "data",
        description: "zotero data"
      }]
    );
  }

  exports.init = init;

}());