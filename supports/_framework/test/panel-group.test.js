import { panelGroup } from '../panel-group';

describe( 'panelGroup', () => {
    it( 'puts panels in the Styles tab by default', () => {
        expect( panelGroup( true ) ).toBe( 'styles' );
        expect( panelGroup( {} ) ).toBe( 'styles' );
        expect( panelGroup( { tab: 'styles' } ) ).toBe( 'styles' );
        expect( panelGroup( { tab: 'other' } ) ).toBe( 'styles' );
    } );

    it( 'puts panels in the Settings tab when the block asks', () => {
        expect( panelGroup( { tab: 'settings' } ) ).toBe( 'default' );
    } );
} );
