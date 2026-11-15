/**
 * Extends the @wordpress/scripts webpack config with entry points that aren't
 * blocks. Blocks keep their own pipeline (`--webpack-src-dir=blocks
 * --blocks-manifest` in package.json), which only discovers directories with
 * a block.json; the entries below are found by convention and built alongside
 * them, each with its own .asset.php. blocks-manifest.php is generated from
 * blocks/ only, so these entries don't affect BlockRegistrar.
 *
 * Conventions (an entry exists only once its source file does):
 *   components/index.js   → components/index   shared components (SharedComponents)
 *   editor/index.js       → editor/index       editor modifications + UI styles (EditorAssets)
 *   editor/canvas.scss    → editor/canvas      styles inside the editor canvas (EditorAssets)
 *   editor/{name}/view.js → {name}/view        a feature's front end (its own service)
 *   supports/index.js     → supports/index     block supports (responsive supports phase 2)
 */
const fs = require( 'fs' );
const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

const COMPONENTS = {
    request: '@supe-editor/components',
    global: [ 'supeEditor', 'components' ],
    handle: 'supe-editor-components',
};

const fromRoot = ( file ) => path.resolve( __dirname, file );

function conventionEntries() {
    const entries = {};
    const add = ( name, file, options = {} ) => {
        if ( fs.existsSync( fromRoot( file ) ) ) {
            entries[ name ] = { import: fromRoot( file ), ...options };
        }
    };

    add( 'components/index', 'components/index.js', {
        library: { name: COMPONENTS.global, type: 'window' },
    } );
    add( 'editor/index', 'editor/index.js' );
    add( 'editor/canvas', 'editor/canvas.scss' );
    add( 'supports/index', 'supports/index.js' );

    for ( const dir of fs.readdirSync( fromRoot( 'editor' ), {
        withFileTypes: true,
    } ) ) {
        if ( dir.isDirectory() ) {
            add( `${ dir.name }/view`, `editor/${ dir.name }/view.js` );
        }
    }

    return entries;
}

module.exports = {
    ...defaultConfig,
    entry: () => ( { ...defaultConfig.entry(), ...conventionEntries() } ),
    output: {
        ...defaultConfig.output,
        // Entries are a function, so webpack can't see the components
        // library type up front.
        enabledLibraryTypes: [ 'window' ],
    },
    plugins: [
        ...defaultConfig.plugins.filter(
            ( plugin ) =>
                ! ( plugin instanceof DependencyExtractionWebpackPlugin )
        ),
        new DependencyExtractionWebpackPlugin( {
            requestToExternal: ( request ) =>
                request === COMPONENTS.request ? COMPONENTS.global : undefined,
            requestToHandle: ( request ) =>
                request === COMPONENTS.request ? COMPONENTS.handle : undefined,
        } ),
    ],
};
