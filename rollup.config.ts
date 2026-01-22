// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

// Plugin to exclude sqlite-cache-store
const excludeSqliteCacheStore = () => ({
  name: 'exclude-sqlite-cache-store',
  resolveId(source) {
    // Exclude undici's sqlite-cache-store module which requires node:sqlite
    if (
      source.endsWith('/sqlite-cache-store.js') ||
      source.endsWith('/sqlite-cache-store')
    ) {
      return { id: source, external: true, moduleSideEffects: false }
    }
    return null
  }
})

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    excludeSqliteCacheStore(),
    typescript(),
    nodeResolve({ preferBuiltins: true }),
    commonjs()
  ],
  external: ['node:sqlite']
}

export default config
