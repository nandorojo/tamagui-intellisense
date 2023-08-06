import * as vscode from "vscode"
import { client } from "./client"

export function activate(context: vscode.ExtensionContext) {
  client.start()
  context.subscriptions.push(client)
}

export function deactivate() {
  return client?.stop()
}
