import { stylesheet, supportOutput } from '../render';
import metadata from '../../spacing/support.json';
import fixtures from '../../../tests/fixtures/supports/spacing.json';

// Same cases as PHP's SpacingSupportTest.
describe( 'spacing support', () => {
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
} );
