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

const config = {
  $color11: "#fff500",
} // Load your config file here

console.log("here is the server!")

connection.onCompletion((params) => {
  // Map the config values to CompletionItems
  const completionItems = Object.entries(config).map(([key, value]) => {
    const item = CompletionItem.create(key)
    item.kind = CompletionItemKind.Color // Use Text instead of Color
    item.documentation = value // Use the color value as documentation

    return item
  })

  return completionItems
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
