import {
    advance,
    currentIndicator,
    indicatorStarts,
    distance,
    inView,
    maxStart,
    mod,
    moveSlots,
    navigable,
    normalize,
    restSlots,
    stepSize,
} from '../math';

const state = ( overrides ) => ( {
    count: 5,
    perView: 1,
    loop: false,
    size: 1,
    ...overrides,
} );

describe( 'basics', () => {
    it( 'wraps without going negative', () => {
        expect( mod( -1, 5 ) ).toBe( 4 );
        expect( mod( 7, 5 ) ).toBe( 2 );
    } );

    it( 'needs more slides than fit in a view', () => {
        expect( navigable( 3, 3 ) ).toBe( false );
        expect( navigable( 4, 3 ) ).toBe( true );
        expect( maxStart( 5, 2 ) ).toBe( 3 );
        expect( maxStart( 2, 3 ) ).toBe( 0 );
    } );

    it( 'steps by slide or by page; page-only transitions force pages', () => {
        expect( stepSize( 'slide', 3 ) ).toBe( 1 );
        expect( stepSize( 'page', 3 ) ).toBe( 3 );
        expect( stepSize( 'slide', 3, true ) ).toBe( 3 );
    } );

    it( 'keeps starts in range', () => {
        expect( normalize( 7, state( { loop: true } ) ) ).toBe( 2 );
        expect( normalize( 7, state( { perView: 2 } ) ) ).toBe( 3 );
        expect( normalize( -2, state() ) ).toBe( 0 );
        expect( normalize( 3, state( { count: 0 } ) ) ).toBe( 0 );
    } );
} );

describe( 'advance', () => {
    it( 'stops at the ends without loop', () => {
        expect( advance( 4, 1, state() ) ).toBe( 4 );
        expect( advance( 0, -1, state() ) ).toBe( 0 );
    } );

    it( 'wraps with loop', () => {
        expect( advance( 4, 1, state( { loop: true } ) ) ).toBe( 0 );
        expect( advance( 0, -1, state( { loop: true } ) ) ).toBe( 4 );
    } );

    it( 'pages, filling the last view', () => {
        const paged = state( { perView: 2, size: 2 } );

        expect( advance( 0, 1, paged ) ).toBe( 2 );
        expect( advance( 2, 1, paged ) ).toBe( 3 );
        expect( advance( 3, -1, paged ) ).toBe( 1 );
        expect( advance( 1, -1, paged ) ).toBe( 0 );
    } );

    it( 'rewinds at the ends when asked (autoplay)', () => {
        expect( advance( 4, 1, state(), { rewind: true } ) ).toBe( 0 );
        expect( advance( 0, -1, state(), { rewind: true } ) ).toBe( 4 );
        expect( advance( 1, 1, state(), { rewind: true } ) ).toBe( 2 );
    } );

    it( 'stays put when everything fits', () => {
        expect( advance( 0, 1, state( { count: 2, perView: 2 } ) ) ).toBe( 0 );
    } );
} );

describe( 'distance', () => {
    it( 'is direct without loop', () => {
        expect( distance( 4, 1, state() ) ).toBe( -3 );
    } );

    it( 'goes the shorter way with loop, forward on a tie', () => {
        expect( distance( 4, 0, state( { loop: true } ) ) ).toBe( 1 );
        expect( distance( 0, 4, state( { loop: true } ) ) ).toBe( -1 );
        expect( distance( 0, 2, state( { count: 4, loop: true } ) ) ).toBe( 2 );
    } );
} );

describe( 'slots', () => {
    it( 'line up from the start at rest', () => {
        expect( restSlots( 4, 1, false ) ).toEqual( [ -1, 0, 1, 2 ] );
        expect( restSlots( 4, 1, true ) ).toEqual( [ 3, 0, 1, 2 ] );
    } );

    it( 'move together, forward', () => {
        expect( moveSlots( 4, 3, 1, true ) ).toEqual( {
            before: [ 1, 2, 3, 0 ],
            after: [ 0, 1, 2, -1 ],
        } );
    } );

    it( 'bring slides in from the start side going back with loop', () => {
        // From 0 back to 3: slide 3 waits just before the view.
        expect( moveSlots( 4, 0, -1, true ) ).toEqual( {
            before: [ 0, 1, 2, -1 ],
            after: [ 1, 2, 3, 0 ],
        } );
    } );

    it( 'shift by the distance without loop', () => {
        expect( moveSlots( 3, 0, 2, false ) ).toEqual( {
            before: [ 0, 1, 2 ],
            after: [ -2, -1, 0 ],
        } );
    } );

    it( 'tell which slides are in view', () => {
        expect( inView( [ 3, 0, 1, 2 ], 2 ) ).toEqual( [ 1, 2 ] );
    } );
} );

describe( 'indicators', () => {
    it( 'one per slide that can start a view', () => {
        expect( indicatorStarts( 5, 2, 1, false ) ).toEqual( [ 0, 1, 2, 3 ] );
        expect( indicatorStarts( 5, 2, 1, true ) ).toEqual( [ 0, 1, 2, 3, 4 ] );
    } );

    it( 'one per page, ending on the last full view without loop', () => {
        expect( indicatorStarts( 5, 2, 2, false ) ).toEqual( [ 0, 2, 3 ] );
        expect( indicatorStarts( 6, 2, 2, false ) ).toEqual( [ 0, 2, 4 ] );
        expect( indicatorStarts( 5, 2, 2, true ) ).toEqual( [ 0, 2, 4 ] );
    } );

    it( 'just one when everything fits', () => {
        expect( indicatorStarts( 3, 3, 1, true ) ).toEqual( [ 0 ] );
    } );

    it( 'marks the current one, or the one before a start between pages', () => {
        expect( currentIndicator( [ 0, 2, 4 ], 2 ) ).toBe( 1 );
        expect( currentIndicator( [ 0, 2, 4 ], 3 ) ).toBe( 1 );
        expect( currentIndicator( [ 0, 2, 4 ], 1 ) ).toBe( 0 );
    } );
} );
