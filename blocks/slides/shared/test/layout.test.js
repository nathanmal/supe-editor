import fixtures from '../../../../tests/fixtures/slides-layout.json';
import { layoutOutput, perViewAt, viewRange } from '../layout';

describe( 'layoutOutput', () => {
    it.each( fixtures.cases.map( ( item ) => [ item.label, item ] ) )(
        '%s',
        ( label, { attributes, expected } ) => {
            const output = layoutOutput( attributes );

            expect( output.classes ).toEqual( expected.classes );
            // Same keys in the same order as the PHP output.
            expect( Object.entries( output.styles ) ).toEqual(
                Object.entries( expected.styles )
            );
        }
    );
} );

describe( 'perViewAt', () => {
    const perView = { desktop: 4, mobile: 1 };

    it( 'cascades from the larger viewports', () => {
        expect( perViewAt( perView, 'desktop' ) ).toBe( 4 );
        expect( perViewAt( perView, 'tablet' ) ).toBe( 4 );
        expect( perViewAt( perView, 'mobile' ) ).toBe( 1 );
    } );

    it( 'skips invalid values and defaults to 1', () => {
        expect( perViewAt( { desktop: 20, tablet: '3' }, 'desktop' ) ).toBe(
            1
        );
        expect( perViewAt( { desktop: 20, tablet: '3' }, 'mobile' ) ).toBe( 3 );
        expect( perViewAt( undefined, 'tablet' ) ).toBe( 1 );
    } );
} );

describe( 'viewRange', () => {
    it( 'starts at the slide and stays full at the end', () => {
        expect( viewRange( 5, 0, 3 ) ).toEqual( [ 0, 2 ] );
        expect( viewRange( 5, 1, 3 ) ).toEqual( [ 1, 3 ] );
        expect( viewRange( 5, 4, 3 ) ).toEqual( [ 2, 4 ] );
    } );

    it( 'stays put while the view still includes the slide', () => {
        expect( viewRange( 6, 2, 3, 1 ) ).toEqual( [ 1, 3 ] );
        expect( viewRange( 6, 3, 3, 1 ) ).toEqual( [ 1, 3 ] );
        expect( viewRange( 6, 4, 3, 1 ) ).toEqual( [ 3, 5 ] );
        expect( viewRange( 6, 0, 3, 1 ) ).toEqual( [ 0, 2 ] );
    } );

    it( 'shows every slide when there are fewer than the columns', () => {
        expect( viewRange( 2, 1, 3 ) ).toEqual( [ 0, 1 ] );
        expect( viewRange( 4, 2, 1 ) ).toEqual( [ 2, 2 ] );
    } );
} );
