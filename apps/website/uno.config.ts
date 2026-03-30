import { presetWind3 } from '@unocss/preset-wind3';
import {
  defineConfig,
  presetIcons,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  presets: [
    presetWind3(),
    presetIcons({
      scale: 1.2,
      unit: 'em',
      warn: true,
    }),
    presetWebFonts({
      fonts: {
        sans: 'Inter',
      },
      provider: 'bunny',
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
