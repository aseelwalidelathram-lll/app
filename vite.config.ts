import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this repo from /<repo>/, so the build needs that prefix.
// Locally there is no prefix — `npm run dev` stays at the root, as expected.
const base = process.env.PAGES_BASE ?? '/'

/** Files copied verbatim from public/ that the app should still work without a network. */
const PUBLIC_PRECACHE = [
  'manifest.webmanifest',
  'favicon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
]

/**
 * Emits dist/sw.js from sw.template.js with the real asset list baked in.
 * Vite fingerprints filenames, so the precache list can only be known here —
 * and without it the first visit caches nothing and the app is not offline-safe.
 */
function serviceWorker(): Plugin {
  return {
    name: 'lumen-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).map((f) => base + f)
      const precache = [base, ...assets, ...PUBLIC_PRECACHE.map((f) => base + f)]

      // Cache name changes whenever the shell changes, which is what evicts the
      // previous version's files on activate.
      const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12)

      // replaceAll, not replace: these tokens are also named in the template's
      // header comment, and replace() would substitute that first mention.
      const source = readFileSync(new URL('./sw.template.js', import.meta.url), 'utf8')
        .replaceAll('__VERSION__', version)
        .replaceAll('__BASE__', base)
        .replaceAll('__PRECACHE__', JSON.stringify(precache, null, 2))

      if (source.includes('__PRECACHE__') || source.includes('__BASE__')) {
        this.error('service worker template still has unfilled placeholders')
      }

      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

/*
 * A build stamp the app can show. Without one, "is this the latest version?"
 * can only be answered by squinting at the UI and guessing.
 */
const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'local'
  }
})()

// https://vite.dev/config/
export default defineConfig({
  base,
  define: {
    __BUILD_COMMIT__: JSON.stringify(commit),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react(), serviceWorker()],
})
