import { postsCount, selectedPosts } from '../posts';

describe( 'selectedPosts', () => {
    it( 'is clean IDs in order, like Posts::selected()', () => {
        expect(
            selectedPosts( {
                orderBy: 'include',
                include: [ 7, '3', 0, -2, 'x', 7, 9 ],
            } )
        ).toEqual( [ 7, 3, 9 ] );
    } );

    it( 'is empty outside selected mode', () => {
        expect( selectedPosts( { orderBy: 'date', include: [ 7 ] } ) ).toEqual(
            []
        );
        expect( selectedPosts( undefined ) ).toEqual( [] );
    } );
} );

describe( 'postsCount', () => {
    it( 'counts the selected posts, else the page size', () => {
        expect( postsCount( { orderBy: 'include', include: [ 1, 2 ] } ) ).toBe(
            2
        );
        expect( postsCount( { perPage: 6 } ) ).toBe( 6 );
        expect( postsCount( { perPage: null } ) ).toBe( 10 );
    } );
} );
