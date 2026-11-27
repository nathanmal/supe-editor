/**
 * The fader's timing, as Blocks\Fader::timing() validates it: milliseconds
 * each image shows and the fade takes.
 *
 * Portable: no WordPress imports.
 */
export const DURATION = [ 1000, 60000 ];
export const FADE = [ 100, 10000 ];
export const DEFAULTS = Object.freeze( { duration: 5000, fade: 1500 } );

/**
 * @param {*}        value
 * @param {number[]} range    [ min, max ].
 * @param {number}   fallback
 * @return {number} Whole milliseconds within range.
 */
function milliseconds( value, [ min, max ], fallback ) {
    const number =
        typeof value === 'string' && value.trim() !== ''
            ? Number( value.trim() )
            : value;

    if ( typeof number !== 'number' || ! Number.isFinite( number ) ) {
        return fallback;
    }

    return Math.max( min, Math.min( max, Math.round( number ) ) );
}

/**
 * @param {Object} attributes The fader's attributes.
 * @return {{duration: number, fade: number}} Milliseconds.
 */
export const timing = ( attributes ) => ( {
    duration: milliseconds( attributes.duration, DURATION, DEFAULTS.duration ),
    fade: milliseconds( attributes.fade, FADE, DEFAULTS.fade ),
} );
