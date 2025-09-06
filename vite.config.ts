import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import matter from 'gray-matter';
import fs from 'fs-extra';
import AutoImport from 'unplugin-auto-import/vite';
import Inspect from 'vite-plugin-inspect';
// import ReactMarkdownPlugin from 'vite-plugin-react-markdown';
import Pages from 'vite-plugin-pages';
import fg, { Pattern } from 'fast-glob';
// import MyPlugin from '@lxdll/vite-plugin-react-markdown';
import MarkdownItShiki from '@shikijs/markdown-it';
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from '@shikijs/transformers';
import { rendererRich, transformerTwoslash } from '@shikijs/twoslash';
import anchor from 'markdown-it-anchor';
import GitHubAlerts from 'markdown-it-github-alerts';
import LinkAttributes from 'markdown-it-link-attributes';
import MarkdownItMagicLink from 'markdown-it-magic-link';
// @ts-expect-error missing types
import TOC from 'markdown-it-table-of-contents';
import { slugify } from './src/scripts/slugify';
import TailwindCssPlugin from '@tailwindcss/vite';
import Markdown from 'vite-plugin-markdown-react';

type Imports = Record<string, ['default', string][]>;
export const getAutoImports = async (pattern: Pattern[]): Promise<Imports> => {
  const files = await fg(pattern, { absolute: false });

  const map = new Map<string, ['default', string][]>([]);

  for (const file of files) {
    const pathWithoutExt = file.replace(/\.(tsx|jsx)$/, '');
    const importPath = `@/${pathWithoutExt.replace(/^src\//, '')}`;
    const fileName = pathWithoutExt.split('/').pop();
    if (fileName) {
      map.set(importPath, [['default', fileName]]);
    }
  }

  return Object.fromEntries(map);
};

/** @type {import 'vite'.UserConfig} */
export default defineConfig(async () => {
  const imports = await getAutoImports(['src/components/**/*.tsx']);

  return {
    base: './',
    plugins: [
      react(),
      svgr(),
      Pages({
        dirs: [{ dir: 'src/pages', baseRoute: '' }],
        extensions: ['tsx', 'md'],
        extendRoute(route) {
          const { element } = route;
          if (!element) return;

          const p = path.join(__dirname, element);
          if (p.endsWith('.md')) {
            const { data } = matter(fs.readFileSync(p, 'utf-8'));

            return {
              ...route,
              frontmatter: data,
            };
          }

          return route;
        },
      }),
      Markdown({
        wrapperComponent: 'Wrapper',
        wrapperClasses: 'prose m-auto slide-enter-content',
        async markdownItSetup(md) {
          md.use(
            await MarkdownItShiki({
              themes: {
                dark: 'vitesse-dark',
                light: 'vitesse-light',
              },
              defaultColor: false,
              cssVariablePrefix: '--s-',
              transformers: [
                transformerTwoslash({
                  explicitTrigger: true,
                  renderer: rendererRich(),
                }),
                transformerNotationDiff(),
                transformerNotationHighlight(),
                transformerNotationWordHighlight(),
              ],
            })
          );

          md.use(anchor, {
            slugify,
            permalink: anchor.permalink.linkInsideHeader({
              symbol: '#',
              renderAttrs: () => ({
                'aria-hidden': 'true',
                className: 'header-anchor',
              }),
            }),
          });

          md.use(LinkAttributes, {
            matcher: (link: string) => /^https?:\/\//.test(link),
            attrs: {
              target: '_blank',
              rel: 'noopener',
            },
          });

          md.use(TOC, {
            includeLevel: [1, 2, 3, 4],
            slugify,
            // containerHeaderHtml:
            //   '<div class="table-of-contents-anchor"></div>',
          });

          md.use(MarkdownItMagicLink, {
            linksMap: {
              NuxtLabs: {
                link: 'https://nuxtlabs.com',
                imageUrl: 'https://nuxtlabs.com/nuxt.png',
              },
              Vitest: 'https://github.com/vitest-dev/vitest',
              Slidev: 'https://github.com/slidevjs/slidev',
              VueUse: 'https://github.com/vueuse/vueuse',
              UnoCSS: 'https://github.com/unocss/unocss',
              Elk: 'https://github.com/elk-zone/elk',
              'Type Challenges':
                'https://github.com/type-challenges/type-challenges',
              Vue: 'https://github.com/vuejs/core',
              Nuxt: 'https://github.com/nuxt/nuxt',
              Vite: 'https://github.com/vitejs/vite',
              Shiki: 'https://github.com/shikijs/shiki',
              Twoslash: 'https://github.com/twoslashes/twoslash',
              'ESLint Stylistic':
                'https://github.com/eslint-stylistic/eslint-stylistic',
              Unplugin: 'https://github.com/unplugin',
              'Nuxt DevTools': 'https://github.com/nuxt/devtools',
              'Vite PWA': 'https://github.com/vite-pwa',
              'i18n Ally': 'https://github.com/lokalise/i18n-ally',
              ESLint: 'https://github.com/eslint/eslint',
              Astro: 'https://github.com/withastro/astro',
              TwoSlash: 'https://github.com/twoslashes/twoslash',
              'Anthony Fu Collective': {
                link: 'https://opencollective.com/antfu',
                imageUrl: 'https://github.com/antfu-collective.png',
              },
              Netlify: {
                link: 'https://netlify.com',
                imageUrl: 'https://github.com/netlify.png',
              },
              Stackblitz: {
                link: 'https://stackblitz.com',
                imageUrl: 'https://github.com/stackblitz.png',
              },
              Vercel: {
                link: 'https://vercel.com',
                imageUrl: 'https://github.com/vercel.png',
              },
            },
            imageOverrides: [
              ['https://github.com/vuejs/core', 'https://vuejs.org/logo.svg'],
              [
                'https://github.com/nuxt/nuxt',
                'https://nuxt.com/assets/design-kit/icon-green.svg',
              ],
              ['https://github.com/vitejs/vite', 'https://vitejs.dev/logo.svg'],
              ['https://github.com/sponsors', 'https://github.com/github.png'],
              [
                'https://github.com/sponsors/antfu',
                'https://github.com/github.png',
              ],
              ['https://nuxtlabs.com', 'https://github.com/nuxtlabs.png'],
              [/opencollective\.com\/vite/, 'https://github.com/vitejs.png'],
              [/opencollective\.com\/elk/, 'https://github.com/elk-zone.png'],
            ],
          });

          md.use(GitHubAlerts);
        },
      }),
      AutoImport({
        include: [/\.[tj]sx?$/, /\.md$/],
        imports: [imports],
        dts: true,
      }),
      TailwindCssPlugin(),
      Inspect(),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
