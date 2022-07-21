// RedwoodJS's babel config.
//
// IMPORTANT: This babel config is for the framework,
// so all the `@redwoodjs/` packages (i.e. everything in ./packages/).
// This is NOT for redwood apps. You can find that babel config in...
// `./packages/internal/src/build/babel/common.ts`.
//
// We use the recommended babel-config strategy for monorepos:
// - a `babel.config.js` file (this one) in the root directory
// - per-project `.babelrc.js` files.
// See https://babeljs.io/docs/en/config-files#monorepos.

// IMPORTANT: It's recommended to specify the version of core-js used up to the minor version,
// like core-js: '3.6'. Just specifying the major version won't inject modules added in minor releases.
// See https://github.com/zloirock/core-js/blob/master/README.md#babelpreset-env.
const path = require('path')
const packageJSON = require(path.join(__dirname, 'package.json'))
const CORE_JS_VERSION = packageJSON.devDependencies['core-js-pure']
  .split('.')
  .slice(0, 2)
  .join('.')

// FIXME: This interface seems to be a little outdated.
/** @type {import('@babel/core').TransformOptions} */
module.exports = {
  // IMPORTANT: `targets` is defined here, at the top level,
  // so that it applies globally.
  // It used to be defined below in `@babel/preset-env`,
  // but that's not how they want to do things anymore.
  // See https://github.com/babel/rfcs/blob/main/rfcs/0002-top-level-targets.md.
  targets: {
    node: '14.20',
  },
  // This replaces the loose config on @babel/preset-env.
  // See: https://github.com/babel/rfcs/blob/main/rfcs/0003-top-level-assumptions.md.
  assumptions: {
    // See https://babeljs.io/docs/en/assumptions#enumerablemodulemeta.
    enumerableModuleMeta: true,
  },
  // Presets are collections of plugins.
  // Without these, babel does nothing.
  presets: [
    [
      '@babel/preset-env',
      // Some proposals are done (stage 4) and even implemented in some browsers,
      // but aren't in the official spec yet (cause it hasn't been published).
      // This lets us use them.
      {
        shippedProposals: true,
      },
    ],
    '@babel/preset-react',
    '@babel/typescript',
  ],
  plugins: [
    // NOTE: The order of these two plugins doesn't matter.
    // See https://github.com/babel/babel-polyfills/issues/88#issuecomment-1094616051.
    //
    // This plugin is an optimization; to dedupe babel-specific helpers.
    // See https://babeljs.io/docs/en/babel-plugin-transform-runtime.
    //
    // NOTE: This has nothing to do with polyfilling anymore.
    // `babel-plugin-polyfill-corejs3` handles that.
    [
      '@babel/plugin-transform-runtime',
      {
        version: packageJSON.devDependencies['@babel/runtime'],
      },
    ],
    // For polyfilling.
    // This is how it'll be done in Babel 8.
    // Actually, when using useBuiltIns in @babel/preset-env, this is how it works already.
    // See https://github.com/babel/rfcs/blob/main/rfcs/0001-rethink-polyfilling-story.md.
    [
      'babel-plugin-polyfill-corejs3',
      {
        // IMPORTANT: so we don't pollute the global scope.
        method: 'usage-pure',
        shippedProposals: true,
        version: CORE_JS_VERSION,
      },
    ],
  ],
  overrides: [
    // ** STRUCTURE PACKAGE **
    {
      test: ['./packages/structure'],
      plugins: [
        [
          // https://github.com/tc39/proposal-decorators
          '@babel/plugin-proposal-decorators',
          {
            legacy: true,
          },
        ],
      ],
    },
    // ** WEB PACKAGES **
    {
      test: [
        './packages/auth/',
        './packages/router',
        './packages/forms/',
        './packages/web/',
      ],
      // Run `npx browserslist "defaults, not IE 11, not IE_Mob 11"`
      // to see a list of target browsers.
      targets: {
        browsers: ['defaults', 'not IE 11', 'not IE_Mob 11'],
      },
      plugins: [
        [
          'babel-plugin-auto-import',
          {
            declarations: [
              {
                // import { React } from 'react'
                default: 'React',
                path: 'react',
              },
              {
                // import { PropTypes } from 'prop-types'
                default: 'PropTypes',
                path: 'prop-types',
              },
            ],
          },
        ],
      ],
    },
  ],
  // Ignore test directories when we're not testing.
  ignore:
    process.env.NODE_ENV === 'test'
      ? []
      : [/\.test\.(js|ts)/, '**/__tests__', '**/__mocks__', '**/__snapshots__'],
}

// Want to understand every line of this config?
//
// - Read the docs https://babeljs.io/docs/en/
// - Browse this curated list of GitHub resources
//   - https://github.com/babel/babel-polyfills
//   - https://github.com/babel/babel-polyfills/blob/main/docs/migration.md
//   - https://github.com/babel/babel-polyfills/issues/88
// - Run and debug
// - Look at what gets output (all the dist directories)
