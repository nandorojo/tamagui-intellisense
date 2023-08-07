import {
  LanguageClient,
  TransportKind,
  CloseAction,
  ErrorAction,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node"
import * as vscode from "vscode"
import * as path from "path"

let serverOptions: ServerOptions = {
  run: {
    module: path.resolve(__dirname, "./server"),
    transport: TransportKind.ipc,
  },
  debug: {
    module: path.resolve(__dirname, "./server"),
    transport: TransportKind.ipc,
    options: { execArgv: ["--nolazy", "--inspect=6009"] },
  },
}

let clientOptions: LanguageClientOptions = {
  documentSelector: [
    { scheme: "file", language: "typescript" },
    { scheme: "file", language: "typescriptreact" },
  ],
  synchronize: {
    // TODO let users customize this
    // TODO ignore any files that are git-ignored like node_modules
    fileEvents: vscode.workspace.createFileSystemWatcher("**/*.{ts,tsx}"),
    configurationSection: "nandorojo-tamagui", // The configuration section the server wants to listen for
  },

  initializationOptions: {
    ...vscode.workspace.getConfiguration("nandorojo-tamagui"), // Pass the config to the server

    capabilities: {
      completion: {
        dynamicRegistration: false,
        completionItem: {
          snippetSupport: true,
        },
      },
    },
  },
  errorHandler: {
    error: () => {
      return {
        action: ErrorAction.Continue,
      }
    },
    closed: async () => {
      return {
        action: CloseAction.DoNotRestart,
      }
    },
  },
}

export const client = new LanguageClient(
  "nandorojo-tamagui",
  "Tamagui Intellisense",
  serverOptions,
  clientOptions
)
