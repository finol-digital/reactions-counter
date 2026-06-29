// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

// Plugin to stub out sqlite-cache-store with an empty implementation
const stubSqliteCacheStore = () => ({
  name: 'stub-sqlite-cache-store',
  resolveId(source) {
    // Stub out undici's sqlite-cache-store module which requires node:sqlite
    if (
      source.endsWith('/sqlite-cache-store.js') ||
      source.endsWith('/sqlite-cache-store')
    ) {
      return '\0sqlite-cache-store-stub'
    }
    // Also stub node:sqlite to avoid import errors
    if (source === 'node:sqlite') {
      return '\0node-sqlite-stub'
    }
    return null
  },
  load(id) {
    if (id === '\0sqlite-cache-store-stub') {
      // Return a stub implementation - SqliteCacheStore is not used in GitHub Actions
      return 'export default class SqliteCacheStore {}'
    }
    if (id === '\0node-sqlite-stub') {
      // Return a stub for node:sqlite that throws when accessed
      // This matches the behavior when the module is not available
      return `export const DatabaseSync = class DatabaseSync {
        constructor() {
          const err = new Error('node:sqlite is not available');
          err.code = 'ERR_UNKNOWN_BUILTIN_MODULE';
          throw err;
        }
      };`
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
    stubSqliteCacheStore(),
    typescript(),
    nodeResolve({ preferBuiltins: true }),
    commonjs()
  ]
}

export default config
