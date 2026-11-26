import {
    getTransition,
    getTransitions,
    registerTransition,
} from '../transitions';

describe( 'transition registry', () => {
    it( 'has slide and fade', () => {
        expect( getTransitions().map( ( { name } ) => name ) ).toEqual( [
            'slide',
            'fade',
        ] );
        expect( getTransition( 'slide' ).supportsDrag ).toBe( true );
        expect( getTransition( 'fade' ) ).toMatchObject( {
            directions: [],
            pageOnly: true,
            supportsDrag: false,
        } );
    } );

    it( 'falls back to slide for an unknown name', () => {
        expect( getTransition( 'zoom' ).name ).toBe( 'slide' );
    } );

    it( 'registers new transitions with defaults', () => {
        registerTransition( 'zoom', { animate: () => {} } );

        expect( getTransition( 'zoom' ) ).toMatchObject( {
            name: 'zoom',
            directions: [],
            pageOnly: false,
            supportsDrag: false,
        } );
    } );
} );
