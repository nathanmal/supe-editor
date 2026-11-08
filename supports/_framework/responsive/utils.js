/**
 * Helpers for responsive values: objects keyed by viewport, where desktop is
 * the base and tablet/mobile hold only what they override.
 *
 *   { desktop: { top: '2rem' }, mobile: { top: '1rem' } }
 */

/** Viewports in cascade order, matching PHP's Supe\Editor\Responsive\Viewport. */
export const VIEWPORTS = [ 'desktop', 'tablet', 'mobile' ];

function isPlainObject( value ) {
    return (
        typeof value === 'object' && value !== null && ! Array.isArray( value )
    );
}

export function isEmptyValue( value ) {
    if ( value === undefined || value === null || value === '' ) {
        return true;
    }

    return (
        isPlainObject( value ) && Object.values( value ).every( isEmptyValue )
    );
}

/**
 * Copy of an object value without its empty keys.
 *
 * @param {Object} value
 * @return {Object} Pruned copy.
 */
function prune( value ) {
    return Object.fromEntries(
        Object.entries( value ).filter(
            ( [ , item ] ) => ! isEmptyValue( item )
        )
    );
}

export function hasOwnValue( value, viewport ) {
    return ! isEmptyValue( value?.[ viewport ] );
}

/**
 * The value a viewport inherits from the larger viewports — what applies
 * there when it has no value of its own.
 *
 * With `perKey`, object values cascade key by key, matching how per-side CSS
 * cascades (desktop `{ top, left }` + tablet `{ top }` → tablet still has
 * desktop's `left`). Leave it off for values whose keys belong together,
 * like a height `{ mode, value }`.
 *
 * @param {Object|undefined} value
 * @param {string}           viewport
 * @param {Object}           [options]
 * @param {boolean}          [options.perKey=false]
 * @return {*} The inherited value, or undefined.
 */
export function inheritedValue( value, viewport, { perKey = false } = {} ) {
    const larger = VIEWPORTS.slice( 0, VIEWPORTS.indexOf( viewport ) );

    return larger.reduce( ( inherited, name ) => {
        const next = value?.[ name ];

        if ( isEmptyValue( next ) ) {
            return inherited;
        }

        if ( perKey && isPlainObject( next ) ) {
            return {
                ...( isPlainObject( inherited ) ? inherited : {} ),
                ...prune( next ),
            };
        }

        return isPlainObject( next ) ? prune( next ) : next;
    }, undefined );
}

/**
 * Responsive value with one viewport replaced. Empty values remove the
 * viewport, and a value left with no viewports becomes undefined so the
 * attribute isn't saved at all.
 *
 * @param {Object|undefined} value
 * @param {string}           viewport
 * @param {*}                next
 * @return {Object|undefined} Updated value.
 */
export function setViewportValue( value, viewport, next ) {
    const updated = { ...( value ?? {} ) };

    if ( isEmptyValue( next ) ) {
        delete updated[ viewport ];
    } else {
        updated[ viewport ] = isPlainObject( next ) ? prune( next ) : next;
    }

    return Object.keys( updated ).length ? updated : undefined;
}
