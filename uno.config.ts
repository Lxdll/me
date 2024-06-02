// uno.config.ts
import { defineConfig, transformerAttributifyJsx, presetAttributify, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify({}),
  ],
  transformers: [
    transformerAttributifyJsx({}),
  ]
})