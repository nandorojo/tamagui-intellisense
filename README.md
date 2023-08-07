# 👨🏻‍🍳

**coming soon**




https://github.com/nandorojo/tamagui-intellisense/assets/13172299/90e5faef-df4a-49d9-a647-3f1b2406bda0





## Setup

After installing the extension, add `.vscode/settings.json` in your repo with the following:

```json
{
  "@nandorojo/tamagui-intellisense.configPath": "./path-to/tamagui.config.ts"
}
```

Replace that with the relative path to your tamagui config file from the root of your repo. Defaults to `./tamagui.config.ts`.

## Contribute

```
yarn
```

Then see the [./vsc-extension-quickstart.md](./vsc-extension-quickstart.md) for how to run the extension in VSCode. Below is essentially what you'll do.

Start the dev server in VSCode by Pressing `F5` (or `fn` + `F5` on Mac). It should open a new window for testing. In that window, you should create a folder (let's say `test-folder`) with a tamagui config in it.

- `test-folder/tamagui.config.ts`

```ts
import { shorthands } from "@tamagui/shorthands";
import { themes, tokens } from "@tamagui/themes";
import { createFont, createTamagui } from "tamagui";

export default createTamagui({
  themes,
  tokens,
  shorthands,
})
```

- `test-folder/test.ts`

```ts
declare function styled(a: any, obj: { bg?: string }): any
const View = 1

styled(View, {
  bg: "$",
})
```

And try the autocomplete there.

### Development

When you make changes in `src/server.js`, you have to click the little green refresh at the top of your main VSCode window to see them update in the test window.

This could probably be fixed with a watch script but I haven't done it. The reason: Webpack bundles everything in `dist` in one file, but we're referencing the `server.js` file in `client.ts` which won't get resolved post-build if we use TS. So we have to restart the server to see changes.

In your test window, put a `tamagui.config.ts` in the root to make it simple.

<!-- # @nandorojo/tamagui-intellisense README

This is the README for your extension "@nandorojo/tamagui-intellisense". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: Enable/disable this extension.
- `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!** -->
