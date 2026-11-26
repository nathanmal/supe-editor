import fixtures from '../../../tests/fixtures/responsive-variables.json';
import { stylesheet } from '../render';
import { inlineStyle, variableStyles } from '../variables';

describe( 'variableStyles', () => {
    it.each( fixtures.styles.map( ( item ) => [ item.label, item ] ) )(
        '%s',
        ( label, { name, type, values, expected } ) => {
            expect( variableStyles( name, type, values ) ).toEqual( expected );
        }
    );

    it( 'skips invalid names', () => {
        expect( variableStyles( 'x;y', 'int', { desktop: 1 } ) ).toEqual( {} );
    } );
} );

describe( 'stylesheet with variables', () => {
    it.each( fixtures.stylesheet.map( ( item ) => [ item.label, item ] ) )(
        '%s',
        ( label, { breakpoints, variables, expected } ) => {
            expect( stylesheet( [], breakpoints, variables ) ).toBe( expected );
        }
    );
} );

describe( 'inlineStyle', () => {
    it( 'joins declarations like StyleGenerator::inline()', () => {
        expect( inlineStyle( { '--a': '1', '--b': 'auto' } ) ).toBe(
            '--a:1;--b:auto'
        );
    } );
} );
