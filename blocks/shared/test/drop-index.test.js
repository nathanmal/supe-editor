import { dropIndex } from '../drop-index';

describe( 'dropIndex', () => {
    // List [ A, B, C ].
    it( 'moves a row down below or above another', () => {
        expect( dropIndex( 0, 2, false ) ).toBe( 2 ); // A below C → B C A
        expect( dropIndex( 0, 2, true ) ).toBe( 1 ); // A above C → B A C
    } );

    it( 'moves a row up', () => {
        expect( dropIndex( 2, 0, true ) ).toBe( 0 ); // C above A → C A B
        expect( dropIndex( 2, 0, false ) ).toBe( 1 ); // C below A → A C B
    } );

    it( 'leaves a row in place when dropped next to itself', () => {
        expect( dropIndex( 1, 1, true ) ).toBe( 1 );
        expect( dropIndex( 1, 1, false ) ).toBe( 1 );
        expect( dropIndex( 1, 0, false ) ).toBe( 1 );
        expect( dropIndex( 1, 2, true ) ).toBe( 1 );
    } );
} );
