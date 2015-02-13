define(function (require, exports, module) {

  var
    ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
    NodeDomain = brackets.getModule("utils/NodeDomain");

  var zoteroDomain = new NodeDomain("zotero", ExtensionUtils.getModulePath(module, "../node/ZoteroDomain"));

  var $collectionsTree, $itemsTree;
  var zot, collections, items, fields, values, types, attachments, topLevelCollections;
  var _tree = require("lib/tree");

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function addType(item) {
    // get type for this item
    var itemType = zot.itemTypes.values.filter(function (row) {
      return row[0] == item.itemTypeID;
    });
    item.type = itemType[0][1];
    if (item.type == "attachment") {
      item.mimeType = attachments[item.itemID].mimeType;
    }
    return item
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function addFields(item) {
    // get fields for this item
    var itemFields = zot.itemData.values.filter(function (row) {
      return row[0] == item.itemID;
    });
    // add fields to item
    for (var i = 0; i < itemFields.length; i++) {
      var fieldId = itemFields[i][1];
      var valueId = itemFields[i][2];
      var fieldName = fields[fieldId].fieldName;
      var value = values[valueId].value;
      item[fieldName] = value;
    }
    return item;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function addAttachments(item) {
    // get attachments for this item
    var itemAttachments = zot.itemAttachments.values.filter(function (row) {
      return row[1] == item.itemID
    });
    // add attachments to this item
    if (itemAttachments.length > 0) {
      item.children = [];
      for (var i = 0; i < itemAttachments.length; i++) {
        var attachmentId = itemAttachments[i][0];
        var attachment = items[attachmentId];
        item.children.push(attachment);
      }
    }
    return item;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function addItemsToCollections() {
    for (var id in collections) {
      if (collections.hasOwnProperty(id)) {
        // get items for this collection
        var collectionItems = zot.collectionItems.values.filter(function (row) {
          return row[0] == id;
        });
        // add items to collections
        if (collectionItems.length > 0) {
          collections[id].items = [];
          for (var i = 0; i < collectionItems.length; i++) {
            var itemId = collectionItems[i][1];
            var item = items[itemId];
            collections[id].items.push(item);
          }
        }
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function nestCollections() {
    topLevelCollections = [];
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
          topLevelCollections.push(collection);
        }
      }
    }
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

  function combineItemTables() {
    // add fields, type and label to each item
    for (var id in items) {
      if (items.hasOwnProperty(id)) {
        var item = items[id];
        item = addFields(item);
        item = addType(item);
        item.label = item.title;
      }
    }
    // add attachments to each item
    for (var id in items) {
      if (items.hasOwnProperty(id)) {
        var item = items[id];
        item = addAttachments(item);
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  function getData() {
    var path = "/Users/briancleland/Library/Application Support/Zotero/Profiles/de2339k3.default/zotero/zotero.sqlite.bak"
    zoteroDomain.exec("getTables", path)
      .done(function (tables) {
        console.log("FILE READ FROM NODE!");
        console.log(tables);
        zot = tables;
        // create hashes
        collections = table2hash(zot.collections);
        items = table2hash(zot.items);
        fields = table2hash(zot.fields);
        values = table2hash(zot.itemDataValues);
        types = table2hash(zot.itemTypes);
        attachments = table2hash(zot.itemAttachments);
        // build nested json 
        combineItemTables();
        addItemsToCollections();
        nestCollections();
        console.log(topLevelCollections);
        _tree.init(topLevelCollections);
      })
      .fail(function (err) {
        console.error("FILE READ FAILED!!", err);
      });
  }

  ///////////////////////////////////////////////////////////////////////////////////

  exports.getData = getData;

});