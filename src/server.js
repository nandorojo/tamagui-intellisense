const {
  TextDocuments,
  createConnection,
  ProposedFeatures,
  CompletionItem,
  CompletionItemKind,
} = require("vscode-languageserver/node")
const { TextDocument } = require("vscode-languageserver-textdocument")
const { TextDocumentSyncKind } = require("vscode-languageserver/node")
const path = require("path")
const { existsSync, readFileSync } = require("fs")

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
  console.log()
  if (config) {
    console.log("⚡️ Using cached config")
    console.log()
    return config
  }
  const dirPath = params.initializationOptions.configPath || "apps/next"
  let configPath = path.resolve(
    params.initializationOptions.workspaceRoot,
    dirPath,
    ...(dirPath.endsWith(".json") ? [] : [".tamagui/tamagui.config.json"])
  )
  try {
    /**
     * @type {import("tamagui").TamaguiInternalConfig}
     */
    if (existsSync(configPath)) {
      config = require(configPath).tamaguiConfig
    }
    console.log("👁️ Getting tamagui config...", Boolean(config))
  } catch (e) {
    console.log("[getTamaguiConfig] error:", e?.message)
  }
  if (!config) {
    console.log(
      "failed to read tamagui config from ",
      params.initializationOptions?.configPath
    )
    console.log()
    console.log("workspace root", params.initializationOptions.workspaceRoot)
    console.log()
    console.log(
      "absolute file path:",
      path.resolve(process.cwd(), params.initializationOptions.configPath)
    )
    console.log()
    const exists = existsSync(configPath)
    console.log("does config file exist?", exists ? "✅ yes" : "👎 no")
    console.log()
    if (exists) {
      console.log(
        "file contents:",
        readFileSync(configPath, "utf8").split(0, 20)
      )
    }
  } else {
    console.log("✅ Loaded config:", params.initializationOptions.configPath)
  }
  return config
}

const getCompletionItems = (params) => {
  const tamaguiConfig = getTamaguiConfig(params)
  if (!tamaguiConfig) {
    console.log("no tamagui config, skipping completion")
    return []
  }
  /**
   * @type {CompletionItem[]}
   */
  let autocompleteItems = []
  if (tamaguiConfig) {
    const { tokens, themes } = tamaguiConfig

    if (themes) {
      const [firstTheme] = Object.values(themes)
      if (firstTheme) {
        /** @type {{[colorKey: string]: { [themeName: string]: string }}} */
        const colorsFromOtherThemes = {}

        Object.entries(themes).forEach(([themeName, theme]) => {
          Object.entries(theme).forEach(([colorKey, val]) => {
            if (!colorsFromOtherThemes[colorKey]) {
              colorsFromOtherThemes[colorKey] = {}
            }
            colorsFromOtherThemes[colorKey][themeName] = val
          })
        })

        // sort each color by # of underscores per theme, ascending
        Object.entries(colorsFromOtherThemes).forEach(([colorKey, theme]) => {
          const sortedTheme = Object.entries(theme).sort(
            ([themeNameA], [themeNameB]) => {
              const countUnderscores = (str) => str.split("_").length - 1
              return countUnderscores(themeNameA) - countUnderscores(themeNameB)
            }
          )
          colorsFromOtherThemes[colorKey] = Object.fromEntries(sortedTheme)
        })

        console.log("[colors-from]", colorsFromOtherThemes)

        Object.entries(firstTheme).forEach(([key, theme]) => {
          const name = `$${key}`

          const allColors = Object.entries(colorsFromOtherThemes[key])

          const item = CompletionItem.create(name)

          item.kind = CompletionItemKind.Color // Use Text instead of Color
          let markdown = `| Theme | Color |
| --- | --- |`
          allColors.forEach(([themeName, hsl]) => {
            // ignore components like dark_Button
            const ignorePattern = /_[A-Z]/

            if (ignorePattern.test(themeName)) {
              return
            }

            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><rect x="1" y="1" width="22" height="22" fill="${hsl}" rx="4" /></svg>`
            const image = `![Image](data:image/svg+xml;base64,${btoa(svg)})`
            markdown += `\n| ${themeName.replace(/_/g, " ")} | ${image} |`
          })
          item.documentation = {
            kind: "markdown",
            value: markdown,
          }

          autocompleteItems.push(item)
        })
      }
    }

    if (tokens) {
      Object.entries(tokens.color).forEach(([key, token]) => {
        const name = `$${key}`

        const item = CompletionItem.create(name)

        item.kind = CompletionItemKind.Color // Use Text instead of Color
        item.documentation = token.val

        const hasCapitalizedThemeNameInKey = Object.keys(themes).some(
          (themeName) => {
            const capitalize = (str) =>
              str.charAt(0).toUpperCase() + str.slice(1)
            return key.includes(capitalize(themeName))
          }
        )

        if (!hasCapitalizedThemeNameInKey) {
          autocompleteItems.push(item)
        }
      })

      // all numerical tokens
      const numericalTokenKeys = Array.from(
        new Set([
          ...Object.keys(tokens.radius || {}),
          ...Object.keys(tokens.space || {}),
          ...Object.keys(tokens.size || {}),
          ...Object.keys(tokens.zIndex || {}),
        ])
      ).sort((a, b) => {
        return a.localeCompare(b)
      })

      numericalTokenKeys.forEach((key) => {
        const name = `$${key}`

        const item = CompletionItem.create(name)

        item.kind = CompletionItemKind.Field

        const px = (val) => (typeof val == "number" ? `${val}px` : val || "")

        const space = px(tokens.space?.[key]?.val)
        const size = px(tokens.size?.[key]?.val)
        const radius = px(tokens.radius?.[key]?.val)
        const zIndex = px(tokens.zIndex?.[key]?.val)

        const columns = [
          { name: "space", value: space },
          { name: "size", value: size },
          { name: "radius", value: radius },
          { name: "zIndex", value: zIndex },
        ].filter(({ value }) => value)

        const headers = columns.map(({ name }) => name)
        const values = columns.map(({ value }) => value)

        const markdown = `| ${headers.join(" | ")} |
| ${headers.map((s) => "---").join(" | ")} |
| ${values.join(" | ")} |`

        item.documentation = {
          kind: "markdown",
          value: markdown,
        }

        autocompleteItems.push(item)
      })
    }
  }

  return autocompleteItems
}

let completionItems = []

connection.onInitialize((params) => {
  const config = getTamaguiConfig(params)
  completionItems = getCompletionItems(params)

  console.log("[onInitialize]", {
    configPath: params.initializationOptions.configPath,
    autocompleteItemsLoaded: completionItems.length,
  })

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
  const has$InTheLine = (() => {
    const textDocument = params.textDocument
    const position = params.position
    const doc = documents.get(textDocument.uri)
    if (!doc) return false

    const line = doc.getText().split("\n")[position.line]
    const lineBeforePosition = line.substring(0, position.character)

    return lineBeforePosition.includes("$")
  })()
  console.log("has$InTheLine?", has$InTheLine)
  console.log()
  if (!has$InTheLine) {
    return null
  }
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
