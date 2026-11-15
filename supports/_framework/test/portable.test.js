import { readFileSync } from 'fs';
import { join } from 'path';

// These modules are shared with headless front ends, which have no
// WordPress packages to import.
const PORTABLE = [ 'sanitize.js', 'upgrade.js', 'render.js' ];

describe( 'portable modules', () => {
    it.each( PORTABLE )( '%s imports nothing from WordPress', ( file ) => {
        const source = readFileSync( join( __dirname, '..', file ), 'utf8' );

        expect( source ).not.toMatch( /from\s+['"]@wordpress\// );
    } );
} );
