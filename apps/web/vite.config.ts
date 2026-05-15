import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves the site under /<repo-name>/. Override via VITE_BASE_PATH
// (the deploy workflow injects this so prod builds use the correct asset paths,
// while local dev keeps `/`).
const base = process.env.VITE_BASE_PATH ?? '/';

// Vite leaves absolute `url(/foo)` in CSS untouched at build time, so when the
// site is hosted under a non-root base (e.g. /robware/) the @font-face URLs in
// fonts.css would resolve against the wrong origin path. Rebase /fonts/ to the
// configured base so the public-dir fonts load under GitHub Pages.
function rebaseFontUrls(targetBase: string): Plugin {
  if (targetBase === '/') return { name: 'rebase-font-urls:noop' };
  const normalized = targetBase.endsWith('/') ? targetBase : `${targetBase}/`;
  return {
    name: 'rebase-font-urls',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset' || !asset.fileName.endsWith('.css')) continue;
        const source =
          typeof asset.source === 'string'
            ? asset.source
            : Buffer.from(asset.source).toString('utf8');
        asset.source = source.replaceAll('url(/fonts/', `url(${normalized}fonts/`);
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), rebaseFontUrls(base)],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
