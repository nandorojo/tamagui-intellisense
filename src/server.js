const {
  TextDocuments,
  createConnection,
  ProposedFeatures,
  CompletionItem,
  CompletionItemKind,
} = require("vscode-languageserver/node")
const { TextDocument } = require("vscode-languageserver-textdocument")
const { TextDocumentSyncKind } = require("vscode-languageserver/node")
const color = require("color")
const htmlTags = require("html-tags")

const documents = new TextDocuments(TextDocument)

const connection = createConnection(ProposedFeatures.all)

/**
 * @type {ReturnType<typeof import('@tamagui/static').loadTamaguiSync>['tamaguiConfig']}
 */
let config

const getTamaguiConfig = (
  /**
   * @type {Parameters<typeof connection.onInitialize>[0]}
   */
  params
) => {
  if (!config) {
    const { loadTamaguiSync } = require("@tamagui/static")
    config = loadTamaguiSync({
      components: ["tamagui"],
      config: params.initializationOptions.configPath,
    }).tamaguiConfig
  }
  return config
}

connection.onInitialize((params) => {
  getTamaguiConfig(params)

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

connection.onCompletion((params) => {
  const tamaguiConfig = getTamaguiConfig(params)

  /**
   * @type {CompletionItem[]}
   */
  let autocompleteItems = []
  if (tamaguiConfig) {
    const { tokens, themes } = tamaguiConfig

    if (tokens) {
      autocompleteItems.push(
        ...Object.entries(tokens.color).map(([key, token]) => {
          const name = `$${key}`

          const item = CompletionItem.create(name)

          console.log("[token]", name, token)

          item.kind = CompletionItemKind.Color // Use Text instead of Color
          item.documentation = [
            color.hsl(token.val).hex(),
            ["AKA", token.val].join(" "),
          ].join("\n")

          return item
        })
      )
    }

    if (themes) {
      const [firstTheme] = Object.values(themes)
      if (firstTheme) {
        /** @type {{[colorKey: string]: { [themeName: string]: string }}} */
        const colorsFromOtherThemes = {}

        Object.entries(themes).forEach(([themeName, theme]) => {
          Object.entries(theme).forEach(([colorKey, { val }]) => {
            if (!colorsFromOtherThemes[colorKey]) {
              colorsFromOtherThemes[colorKey] = {}
            }
            colorsFromOtherThemes[colorKey][themeName] = val
          })
        })

        autocompleteItems.push(
          ...Object.entries(firstTheme).map(([key, theme]) => {
            const name = `$${key}`

            const allColors = Object.entries(colorsFromOtherThemes[key])

            const item = CompletionItem.create(name)

            console.log("[theme]", name, theme)

            item.kind = CompletionItemKind.Color // Use Text instead of Color
            item.documentation = {
              kind: "markdown",
              value: allColors
                .map(([themeName, hsl]) => {
                  return [
                    `![${themeName}](https://tamagui-intellisense.vercel.app//api/image-color?color=${hsl})`,
                    themeName,
                  ].join(" ")
                })
                .join("<br>"),
            }

            return item
          })
        )
      }
    }
  }

  return autocompleteItems
})

// onCompletionResolve handler
connection.onCompletionResolve((item) => {
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
