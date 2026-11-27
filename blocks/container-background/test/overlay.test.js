import fixtures from '../../../tests/fixtures/container-background.json';
import { fromStored, overlay, toStored } from '../overlay';

// Same cases as PHP's ContainerBackgroundTest.
describe( 'overlay', () => {
    it.each( fixtures.overlay.map( ( item ) => [ item.label, item ] ) )(
        '%s',
        ( label, { attributes, expected } ) => {
            expect( overlay( attributes ) ).toEqual( expected );
        }
    );
} );

describe( 'preset references', () => {
    const colors = [ { slug: 'contrast', color: '#111111' } ];

    it( 'stores a theme color as a preset reference', () => {
        expect( toStored( '#111111', colors, 'color' ) ).toBe(
            'var:preset|color|contrast'
        );
        expect( toStored( '#222222', colors, 'color' ) ).toBe( '#222222' );
        expect( toStored( undefined, colors, 'color' ) ).toBeUndefined();
    } );

    it( 'shows a preset reference as its value', () => {
        expect(
            fromStored( 'var:preset|color|contrast', colors, 'color' )
        ).toBe( '#111111' );
        expect( fromStored( '#222222', colors, 'color' ) ).toBe( '#222222' );
        expect(
            fromStored( 'var:preset|color|gone', colors, 'color' )
        ).toBeUndefined();
    } );
} );
