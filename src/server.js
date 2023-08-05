const {
  TextDocuments,
  createConnection,
  ProposedFeatures,
  CompletionItem,
  CompletionItemKind,
} = require("vscode-languageserver/node")
const { TextDocument } = require("vscode-languageserver-textdocument")
const { TextDocumentSyncKind } = require("vscode-languageserver/node")

const documents = new TextDocuments(TextDocument)

const connection = createConnection(ProposedFeatures.all)

connection.onInitialize((params) => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ["$"],
      },
    },
  }
})

const config = {} // Load your config file here

console.log("here is the server!")

connection.onCompletion((params) => {
  const textDocument = params.textDocument
  const position = params.position

  const doc = documents.get(textDocument.uri)
  if (!doc) return null

  const line = doc.getText().split("\n")[position.line]
  const match = line.match(/\$[a-zA-Z0-9]*$/)

  console.log("[onCompletion]", {
    line,
    match,
    position,
    params,
  })

  if (match) {
    const prefix = match[0].substring(1) // Remove the dollar sign

    // Filter the config values based on the prefix
    const filteredItems = Object.entries(config).filter(([key]) =>
      key.startsWith(prefix)
    )

    // Map the filtered items to CompletionItems
    const completionItems = filteredItems.map(([key, value]) => {
      const item = CompletionItem.create(key)
      item.kind = CompletionItemKind.Text // Use Text instead of Color
      item.detail = `Color: ${value}` // Provide the color value in the detail
      return item
    })

    return completionItems
  }

  return null
})

// onCompletionResolve handler
connection.onCompletionResolve((item) => {
  console.log("[onCompletionResolve]", item)
  const key = item.label
  const value = config[key]

  if (value) {
    // Add the color value in the detail
    item.detail = `Color: ${value}`
  }

  return item
})

documents.listen(connection)
connection.listen()
