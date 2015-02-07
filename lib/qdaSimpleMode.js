var qdaSimpleMode = {
  
  // The start state contains the rules that are intially used
  start: [
    // The regex matches the token, the token property contains the type
    {
      regex: /"(?:[^\\]|\\.)*?"/,
      token: "string"
      },
    {
      regex: /^-\s/,
      token: "unordered-list"
      },
    {
      regex: /\*\*(?:[^\\]|\\.)*?\*\*/,
      token: "strong"
      },
    {
      regex: /\*(?:[^\\]|\\.)*?\*/,
      token: "em"
      },
    {
      regex: /~(?:[^\\]|\\.)*?~/,
      token: "strikethrough"
      },
    {
      regex: /(\((?:[^\(])*?\s\d\d\d\d[a-z]*\))|\[\d+\]/,
      token: "citation"
      },
    {
      regex: /\/\/.*/,
      token: "comment"
      },
    {
      regex: /#\w+/,
      token: "hashtag"
      },
    {
      regex: /###\s.*/,
      token: "header-3"
      },
    {
      regex: /##\s.*/,
      token: "header-2"
      },
    {
      regex: /#\s.*/,
      token: "header-1"
      },
    {
      regex: /---+/,
      token: "hr"
      },
    {
      regex: /Figure\s\d+/,
      token: "figure-title"
      },
    {
      regex: /Table\s\d+/,
      token: "table-title"
      },
    {
      regex: /[\{\[\(]/,
      indent: true
      },
    {
      regex: /[\}\]\)]/,
      dedent: true
      }
  ]
}