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

const getCompletionItems = (params) => {
  const tamaguiConfig = getTamaguiConfig(params)
  /**
   * @type {CompletionItem[]}
   */
  let autocompleteItems = []
  if (tamaguiConfig) {
    const { tokens, themes } = tamaguiConfig

    // if (tokens) {
    //   autocompleteItems.push(
    //     ...Object.entries(tokens.color).map(([key, token]) => {
    //       const name = `$${key}`

    //       const item = CompletionItem.create(name)

    //       console.log("[token]", name, token)

    //       item.kind = CompletionItemKind.Color // Use Text instead of Color
    //       item.documentation = [
    //         color.hsl(token.val).hex(),
    //         ["AKA", token.val].join(" "),
    //       ].join("\n")

    //       return item
    //     })
    //   )
    // }

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

            item.kind = CompletionItemKind.Color // Use Text instead of Color
            item.documentation = {
              kind: "markdown",
              value: allColors
                .map(([themeName, hsl]) => {
                  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><rect x="1" y="1" width="22" height="22" fill="${hsl}" rx="4" /></svg>`

                  // ignore components like dark_Button
                  const ignorePatterh = /_[A-Z]/

                  if (ignorePatterh.test(themeName)) {
                    return ``
                  }

                  return `![Image](data:image/svg+xml;base64,${btoa(
                    svg
                  )}) **${themeName.replace(/_/g, " ")}**`
                })
                // TODO single loop to improve perf
                .filter(Boolean)
                .join("\n<br>"),
            }

            console.log("[theme]", item.documentation.value)

            return item
          })
        )
      }
    }
  }

  return autocompleteItems
}

let completionItems = []

connection.onInitialize((params) => {
  getTamaguiConfig(params)

  completionItems = getCompletionItems(params)

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
  return completionItems
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
