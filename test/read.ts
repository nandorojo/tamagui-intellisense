import { loadTamaguiSync } from "@tamagui/static"

const config = loadTamaguiSync({
  components: ["tamagui"],
  config: "./test/tamagui.config.ts",
})

console.log("[config]", config)
