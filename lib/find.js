define(function (require, exports, module) {

  var
    CommandManager = brackets.getModule("command/CommandManager"),
    Commands = brackets.getModule("command/Commands"),
    EditorManager = brackets.getModule("editor/EditorManager"),
    ProjectManager = brackets.getModule("project/ProjectManager"),
    FindInFiles = brackets.getModule("search/FindInFiles");

  var scope = ProjectManager.getProjectRoot();
  var _tree = require("lib/tree");

  function openFile(path, ch, line) {
    CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {
      fullPath: path
    });
    var editor = EditorManager.getCurrentFullEditor();
    editor.setCursorPos({
      line: line,
      ch: ch
    })
    editor.centerOnCursor();
  }

  function snippets(tagName) {
    var queryInfo = {
      query: "\\*([^\\*]*)\\*\\s+(#\\w+\\s+)*(" + tagName + ")\\s",
      caseSensitive: false,
      isRegexp: true
    };
    FindInFiles.doSearchInScope(queryInfo, scope).then(function (results) {
      var output = "";
      for (var path in results) {
        var filename = path.split("/").pop();
        if (results.hasOwnProperty(path)) {
          output += "<div class='filename'>" + filename + "</div>";
          var matches = results[path]["matches"];
          for (var i = 0; i < matches.length; i++) {
            var ch = matches[i]["start"]["ch"];
            var line = matches[i]["start"]["line"] + 1;
            var text = matches[i]["result"][1];
            output += "<div class='snippet-text' ";
            output += "data-path='" + path + "' ";
            output += "data-ch='" + ch + "' ";
            output += "data-line='" + line + "'>";
            output += "<span class='line-number'>" + line + ":</span> " + text + "</div>";
          }
        }
      }
      $("#snippets").html(output);
      $(".snippet-text").click(function () {
        $(".snippet-text").removeClass("selected");
        $(this).addClass("selected");
        var path = $(this).data("path");
        var ch = $(this).data("ch");
        var line = $(this).data("line");
        openFile(path, ch, line);
      })
    }, function (err) {
      console.log(err);
    });
  }

  function hashtags() {
    var queryInfo = {
      //        query: "\\s(#\\w+)",
      query: "\\*([^\\*]*)\\*((\\s+#\\w+)+)",
      // NEED TO MAKE SURE GETTING ALL TAGS, NOT JUST FIRST ONE
      caseSensitive: false,
      isRegexp: true
    };
    FindInFiles.doSearchInScope(queryInfo, scope).then(function (results) {
      var tagCounts = {};
      for (var filename in results) { // for each file
        if (results.hasOwnProperty(filename)) {
          var matches = results[filename]["matches"];
          for (var i = 0; i < matches.length; i++) { // for each match
            var tagNames = matches[i]["result"][2].match(/\S+/g);
            for (var j = 0; j < tagNames.length; j++) { // for each tagName
              var tagName = tagNames[j];
              if (tagCounts.hasOwnProperty(tagName)) {
                tagCounts[tagName] = tagCounts[tagName] + 1;
              } else {
                tagCounts[tagName] = 1;
              }
            }
          }
        }
      }
      _tree.updateTags(tagCounts);
    }, function (err) {
      console.log(err);
    });
  }

  exports.snippets = snippets;
  exports.hashtags = hashtags;

});