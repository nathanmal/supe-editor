import { supportVersion, upgrade } from '../upgrade';

// Mirrors PHP's AbstractSupportTest: a version 3 support whose migrations
// rename `size` to `width` (1 → 2) and add `unit` (2 → 3).
const metadata = { name: 'fake', version: 3 };
const migrations = {
    1: ( value ) => ( { width: value.size ?? 0 } ),
    2: ( value ) => ( { ...value, unit: 'px' } ),
};

describe( 'upgrade', () => {
    it( 'keeps a value at the current version', () => {
        expect( upgrade( metadata, { size: 1, v: 3 }, migrations ) ).toEqual( {
            size: 1,
            v: 3,
        } );
    } );

    it( 'runs every migration from the stored version', () => {
        expect( upgrade( metadata, { size: 4, v: 1 }, migrations ) ).toEqual( {
            width: 4,
            unit: 'px',
            v: 3,
        } );
    } );

    it( 'treats a value without a version as version 1', () => {
        expect( upgrade( metadata, { size: 4 }, migrations ) ).toEqual( {
            width: 4,
            unit: 'px',
            v: 3,
        } );
    } );

    it( 'gives null for unreadable versions', () => {
        expect( upgrade( metadata, { v: 4 }, migrations ) ).toBeNull();
        expect( upgrade( metadata, { v: 0 }, migrations ) ).toBeNull();
        expect( upgrade( metadata, { v: '1' }, migrations ) ).toBeNull();
    } );

    it( 'gives null when a migration is missing', () => {
        expect(
            upgrade( metadata, { v: 1 }, { 2: ( value ) => value } )
        ).toBeNull();
    } );
} );

describe( 'supportVersion', () => {
    it( 'defaults to 1', () => {
        expect( supportVersion( { name: 'fake' } ) ).toBe( 1 );
        expect( supportVersion( { version: 0 } ) ).toBe( 1 );
        expect( supportVersion( metadata ) ).toBe( 3 );
    } );
} );
