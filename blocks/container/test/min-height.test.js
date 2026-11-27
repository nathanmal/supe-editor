import { DEFAULT_MIN_HEIGHT, withDefaultMinHeight } from '../min-height';

describe( 'withDefaultMinHeight', () => {
    it( 'adds a desktop min height when none is set', () => {
        expect( withDefaultMinHeight( undefined ) ).toEqual( {
            dimensions: { v: 1, minHeight: { desktop: DEFAULT_MIN_HEIGHT } },
        } );
    } );

    it( 'keeps the other supports', () => {
        const spacing = { v: 1, padding: { desktop: { top: '1rem' } } };

        expect( withDefaultMinHeight( { spacing } ) ).toEqual( {
            spacing,
            dimensions: { v: 1, minHeight: { desktop: DEFAULT_MIN_HEIGHT } },
        } );
    } );

    it( 'treats empty values as unset', () => {
        expect(
            withDefaultMinHeight( {
                dimensions: { v: 1, minHeight: { desktop: '' } },
            } ).dimensions.minHeight
        ).toEqual( { desktop: DEFAULT_MIN_HEIGHT } );
    } );

    it.each( [ 'desktop', 'tablet', 'mobile' ] )(
        'leaves a min height set on %s alone',
        ( viewport ) => {
            expect(
                withDefaultMinHeight( {
                    dimensions: { v: 1, minHeight: { [ viewport ]: '60vh' } },
                } )
            ).toBeNull();
        }
    );
} );
