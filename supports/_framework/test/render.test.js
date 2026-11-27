import { stylesheet, supportOutput } from '../render';
import spacing from '../../spacing/support.json';
import layout from '../../layout/support.json';
import dimensions from '../../dimensions/support.json';
import spacingFixtures from '../../../tests/fixtures/supports/spacing.json';
import layoutFixtures from '../../../tests/fixtures/supports/layout.json';
import dimensionsFixtures from '../../../tests/fixtures/supports/dimensions.json';

// Same cases as PHP's SupportFixturesTest.
describe.each( [
    [ 'spacing', spacing, spacingFixtures ],
    [ 'layout', layout, layoutFixtures ],
    [ 'dimensions', dimensions, dimensionsFixtures ],
] )( '%s support', ( name, metadata, fixtures ) => {
    it.each( fixtures.render.map( ( item ) => [ item.label, item ] ) )(
        'renders: %s',
        ( label, { value, expected } ) => {
            expect( supportOutput( metadata, value ) ).toEqual( expected );
        }
    );

    it.each( fixtures.stylesheet.map( ( item ) => [ item.label, item ] ) )(
        'builds the stylesheet: %s',
        ( label, { breakpoints, css } ) => {
            expect( stylesheet( [ metadata ], breakpoints ) ).toBe( css );
        }
    );

    it( 'replaces the core features in its fixture', () => {
        expect( metadata.replaces ).toEqual( fixtures.replaces );
    } );
} );
