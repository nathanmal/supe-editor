import {
    hasOwnValue,
    inheritedValue,
    isEmptyValue,
    setViewportValue,
} from '../utils';

describe( 'isEmptyValue', () => {
    it( 'treats nullish, empty strings, and objects of empty values as empty', () => {
        expect( isEmptyValue( undefined ) ).toBe( true );
        expect( isEmptyValue( '' ) ).toBe( true );
        expect( isEmptyValue( { top: undefined, left: '' } ) ).toBe( true );
        expect( isEmptyValue( 0 ) ).toBe( false );
        expect( isEmptyValue( { top: '1rem' } ) ).toBe( false );
    } );
} );

describe( 'inheritedValue', () => {
    const value = {
        desktop: { top: '2rem', left: '1rem' },
        tablet: { top: '1rem' },
    };

    it( 'inherits nothing on desktop', () => {
        expect( inheritedValue( value, 'desktop' ) ).toBeUndefined();
    } );

    it( 'inherits the nearest larger viewport whole by default', () => {
        expect( inheritedValue( value, 'mobile' ) ).toEqual( { top: '1rem' } );
    } );

    it( 'cascades key by key with perKey', () => {
        expect( inheritedValue( value, 'mobile', { perKey: true } ) ).toEqual( {
            top: '1rem',
            left: '1rem',
        } );
    } );

    it( 'skips empty viewports', () => {
        expect( inheritedValue( { desktop: 3, tablet: '' }, 'mobile' ) ).toBe(
            3
        );
    } );
} );

describe( 'setViewportValue', () => {
    it( 'sets a viewport without touching the others', () => {
        expect( setViewportValue( { desktop: 3 }, 'mobile', 1 ) ).toEqual( {
            desktop: 3,
            mobile: 1,
        } );
    } );

    it( 'prunes empty keys from object values', () => {
        expect(
            setViewportValue( undefined, 'tablet', { top: '1rem', left: '' } )
        ).toEqual( {
            tablet: { top: '1rem' },
        } );
    } );

    it( 'removes a viewport set to an empty value', () => {
        expect(
            setViewportValue( { desktop: 3, mobile: 1 }, 'mobile', undefined )
        ).toEqual( { desktop: 3 } );
    } );

    it( 'returns undefined once no viewports are left', () => {
        expect(
            setViewportValue( { tablet: { top: '1rem' } }, 'tablet', {
                top: '',
            } )
        ).toBeUndefined();
    } );
} );

describe( 'hasOwnValue', () => {
    it( 'is true only for viewports with a non-empty value', () => {
        const value = { desktop: 0, tablet: { top: '' } };

        expect( hasOwnValue( value, 'desktop' ) ).toBe( true );
        expect( hasOwnValue( value, 'tablet' ) ).toBe( false );
        expect( hasOwnValue( value, 'mobile' ) ).toBe( false );
    } );
} );
