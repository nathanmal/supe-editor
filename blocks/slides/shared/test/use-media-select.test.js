import { oncePerSelection } from '../use-media-select';

describe( 'oncePerSelection', () => {
    beforeEach( () => jest.useFakeTimers() );
    afterEach( () => jest.useRealTimers() );

    it( 'drops a repeat of the same selection in the same tick', () => {
        const onSelect = jest.fn();
        const select = oncePerSelection( onSelect );

        select( [ { id: 1 }, { id: 2 } ] );
        select( [ { id: 1 }, { id: 2 } ] );

        expect( onSelect ).toHaveBeenCalledTimes( 1 );
    } );

    it( 'passes a different selection, and the same one after the tick', () => {
        const onSelect = jest.fn();
        const select = oncePerSelection( onSelect );

        select( { id: 1 } );
        select( { id: 2 } );
        jest.runAllTimers();
        select( { id: 2 } );

        expect( onSelect ).toHaveBeenCalledTimes( 3 );
    } );
} );
