/**
 * Extends the @wordpress/scripts webpack config with entry points that aren't
 * blocks. Blocks keep their own pipeline (`--webpack-src-dir=blocks
 * --blocks-manifest` in package.json), which only discovers directories with
 * a block.json; everything listed in EXTRA_ENTRIES is built alongside them,
 * each with its own index.asset.php. blocks-manifest.php is generated from
 * blocks/ only, so these entries don't affect BlockRegistrar.
 */
const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const EXTRA_ENTRIES = {
    // Editor modifications → build/editor/index.js (Services\EditorAssets).
    'editor/index': path.resolve( __dirname, 'editor/index.js' ),
    // Header behavior front end → build/header-behavior/view.{js,css}
    // (Services\HeaderBehavior; enqueued only where the header uses it).
    'header-behavior/view': path.resolve(
        __dirname,
        'editor/header-behavior/view.js'
    ),
};

module.exports = {
    ...defaultConfig,
    entry: () => ( { ...defaultConfig.entry(), ...EXTRA_ENTRIES } ),
};
