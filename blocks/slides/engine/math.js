/**
 * Index math for the engine. The slider's state is `start`, the first slide
 * in view. Every slide keeps its place in the DOM and is moved to a *slot*
 * (0 = first column/row of the view, negative = before it, ≥ perView = after
 * it), so looping needs no cloned slides: it's slot arithmetic.
 *
 * Pure: no DOM.
 */

/**
 * @param {number} value
 * @param {number} count
 * @return {number} `value` modulo `count`, never negative.
 */
export const mod = ( value, count ) => ( ( value % count ) + count ) % count;

/**
 * Whether there's anywhere to go: more slides than fit in a view.
 *
 * @param {number} count
 * @param {number} perView
 * @return {boolean} Navigable.
 */
export const navigable = ( count, perView ) => count > perView;

/**
 * @param {number} count
 * @param {number} perView
 * @return {number} The last start that still fills the view (without loop).
 */
export const maxStart = ( count, perView ) => Math.max( 0, count - perView );

/**
 * How many slides one step moves.
 *
 * @param {string}  step     `slide` or `page`.
 * @param {number}  perView
 * @param {boolean} pageOnly The transition only moves by page (fade).
 * @return {number} Slides per step.
 */
export const stepSize = ( step, perView, pageOnly = false ) =>
    step === 'page' || pageOnly ? perView : 1;

/**
 * A start kept in range: wrapped with loop, clamped without.
 *
 * @param {number}  start
 * @param {Object}  state
 * @param {number}  state.count
 * @param {number}  state.perView
 * @param {boolean} state.loop
 * @return {number} The start.
 */
export function normalize( start, { count, perView, loop } ) {
    if ( count === 0 ) {
        return 0;
    }

    return loop
        ? mod( start, count )
        : Math.max( 0, Math.min( start, maxStart( count, perView ) ) );
}

/**
 * The start a step away.
 *
 * @param {number}  start
 * @param {number}  steps         Positive forward, negative back.
 * @param {Object}  state         { count, perView, loop, size } (size from
 *                                stepSize).
 * @param {Object}  [opts]
 * @param {boolean} [opts.rewind] Without loop, going past the end returns to
 *                                the start (autoplay) and vice versa.
 * @return {number} The new start (the same one when there's nowhere to go).
 */
export function advance( start, steps, state, { rewind = false } = {} ) {
    const { count, perView, loop, size } = state;

    if ( ! navigable( count, perView ) ) {
        return start;
    }
    if ( ! loop && rewind ) {
        const last = maxStart( count, perView );

        if ( steps > 0 && start >= last ) {
            return 0;
        }
        if ( steps < 0 && start <= 0 ) {
            return last;
        }
    }

    return normalize( start + steps * size, state );
}

/**
 * Signed distance from one start to another: the shorter way round with
 * loop (forward on a tie).
 *
 * @param {number}  from
 * @param {number}  to
 * @param {Object}  state
 * @param {number}  state.count
 * @param {boolean} state.loop
 * @return {number} Slides to travel; negative is backward.
 */
export function distance( from, to, { count, loop } ) {
    if ( ! loop ) {
        return to - from;
    }

    const forward = mod( to - from, count );
    const backward = mod( from - to, count );

    return forward <= backward ? forward : -backward;
}

/**
 * Each slide's slot at rest. With loop the slides before the view wait
 * after it, so either neighbour can come in.
 *
 * @param {number}  count
 * @param {number}  start
 * @param {boolean} loop
 * @return {number[]} Slot by slide index.
 */
export function restSlots( count, start, loop ) {
    return Array.from( { length: count }, ( _, index ) =>
        loop ? mod( index - start, count ) : index - start
    );
}

/**
 * Each slide's slot before and after a move of `delta` slides from `from`.
 * Every slide moves by the same amount, so the ones leaving and the ones
 * arriving travel together; with loop the slides arriving from the start
 * side are lined up there first. (A move longer than `count - perView`
 * can't be continuous without clones — the engine settles it at the end.)
 *
 * @param {number}  count
 * @param {number}  from  The start before the move.
 * @param {number}  delta From distance().
 * @param {boolean} loop
 * @return {{before: number[], after: number[]}} Slots by slide index.
 */
export function moveSlots( count, from, delta, loop ) {
    const lead = loop && delta < 0 ? -delta : 0;
    const before = Array.from( { length: count }, ( _, index ) =>
        loop ? mod( index - from + lead, count ) - lead : index - from
    );

    return { before, after: before.map( ( slot ) => slot - delta ) };
}

/**
 * @param {number[]} slots
 * @param {number}   perView
 * @return {number[]} Indexes of the slides in view.
 */
export const inView = ( slots, perView ) =>
    slots.reduce(
        ( shown, slot, index ) =>
            slot >= 0 && slot < perView ? [ ...shown, index ] : shown,
        []
    );

/**
 * Where each indicator takes the view: one per step from the first slide,
 * plus (without loop) the last full view if the steps skip it.
 *
 * @param {number}  count
 * @param {number}  perView
 * @param {number}  size    Slides per step (stepSize()).
 * @param {boolean} loop
 * @return {number[]} Starts, one per indicator (one when nothing moves).
 */
export function indicatorStarts( count, perView, size, loop ) {
    if ( ! navigable( count, perView ) ) {
        return [ 0 ];
    }

    const last = loop ? count - 1 : maxStart( count, perView );
    const starts = [];

    for ( let start = 0; start <= last; start += size ) {
        starts.push( start );
    }
    if ( ! loop && starts[ starts.length - 1 ] !== last ) {
        starts.push( last );
    }

    return starts;
}

/**
 * The indicator for a start: its own, or (a looped page step landing
 * between pages) the one before it.
 *
 * @param {number[]} starts From indicatorStarts().
 * @param {number}   start
 * @return {number} Indicator index.
 */
export function currentIndicator( starts, start ) {
    const exact = starts.indexOf( start );

    return exact >= 0
        ? exact
        : Math.max( 0, starts.filter( ( item ) => item < start ).length - 1 );
}
