/**
 * Transition registry. A transition is one file and one registration here;
 * the editor builds its Transition panel from the same metadata.
 *
 * A transition is `{ directions, supportsDrag, pageOnly, animate }`:
 * - `directions`: the directions it can move in (empty: none to pick).
 * - `supportsDrag`: drag can scrub it (phase 6).
 * - `pageOnly`: with more than one slide in view it only moves whole pages.
 * - `animate( move )`: starts the animation; the engine waits `duration`,
 *   then puts every slide at rest. `move` holds `slides`, `before` and
 *   `after` (slot by slide), `shownBefore` / `shownAfter` (indexes in view),
 *   `duration`, `easing`, `place( slide, slot )` and `reflow()`.
 *
 * Portable: no WordPress imports.
 */
import fade from './fade';
import slide from './slide';

const registry = new Map();

/**
 * @param {string} name
 * @param {Object} transition
 */
export function registerTransition( name, transition ) {
    registry.set( name, {
        directions: [],
        supportsDrag: false,
        pageOnly: false,
        ...transition,
        name,
    } );
}

/**
 * @param {string} name
 * @return {Object} The transition, or `slide` for a name it doesn't know.
 */
export const getTransition = ( name ) =>
    registry.get( name ) ?? registry.get( 'slide' );

/** @return {Object[]} Every registered transition. */
export const getTransitions = () => [ ...registry.values() ];

registerTransition( 'slide', slide );
registerTransition( 'fade', fade );
