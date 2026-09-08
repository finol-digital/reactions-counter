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
  // Suppress warnings that originate from third-party code in node_modules.
  // - THIS_IS_UNDEFINED: TypeScript's `__awaiter` helper in CommonJS deps
  //   (e.g. @actions/core) references top-level `this`, which is legal in CJS.
  // - CIRCULAR_DEPENDENCY: @actions/core <-> oidc-utils is intentional upstream.
  onwarn(warning, warn) {
    const id = warning.id ?? warning.loc?.file ?? ''
    const fromDeps =
      id.includes('node_modules') ||
      warning.ids?.every((i) => i.includes('node_modules')) === true

    if (
      fromDeps &&
      (warning.code === 'THIS_IS_UNDEFINED' ||
        warning.code === 'CIRCULAR_DEPENDENCY')
    )
      return

    warn(warning)
  },
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
