/**
 * JS port of Supe\Editor\Blocks\Slides\Config: the slider's behavior from
 * its attributes, validated and filled with defaults. The editor uses it for
 * its controls and canvas classes, the engine to read `data-supe-slides`.
 * Both run tests/fixtures/slides-config.json.
 *
 * Portable: no WordPress imports.
 */

export const STEPS = [ 'slide', 'page' ];
export const DIRECTIONS = [ 'left', 'right', 'up', 'down' ];
export const EASINGS = [
    'ease',
    'linear',
    'ease-in',
    'ease-out',
    'ease-in-out',
];

/** [ min, max ] milliseconds. */
export const DELAY = [ 1000, 60000 ];
export const DURATION = [ 0, 5000 ];

export const DEFAULTS = Object.freeze( {
    loop: false,
    step: 'slide',
    keyboard: true,
    autoplay: Object.freeze( {
        enabled: false,
        delay: 5000,
        pauseOnHover: true,
    } ),
    transition: Object.freeze( {
        name: 'slide',
        direction: 'left',
        duration: 500,
        easing: 'ease',
    } ),
} );

const isObject = ( value ) =>
    typeof value === 'object' && value !== null && ! Array.isArray( value );

const bool = ( value, fallback ) =>
    typeof value === 'boolean' ? value : fallback;

const oneOf = ( value, allowed, fallback ) =>
    allowed.includes( value ) ? value : fallback;

/**
 * A whole number of milliseconds within [ min, max ], like PHP's
 * Config::milliseconds().
 *
 * @param {*}        value
 * @param {number[]} range    [ min, max ].
 * @param {number}   fallback For anything that isn't a number.
 * @return {number} Milliseconds.
 */
function milliseconds( value, [ min, max ], fallback ) {
    let number = value;

    if ( typeof value === 'string' && value.trim() !== '' ) {
        number = Number( value.trim() );
    }
    if ( typeof number !== 'number' || ! Number.isFinite( number ) ) {
        return fallback;
    }

    // PHP's round() rounds halves away from zero; these are never negative.
    return Math.max( min, Math.min( max, Math.round( number ) ) );
}

/**
 * @param {Object} attributes The slider's attributes.
 * @return {Object} The config, every key present.
 */
export function configFrom( attributes ) {
    const autoplay = isObject( attributes.autoplay ) ? attributes.autoplay : {};
    const transition = isObject( attributes.transition )
        ? attributes.transition
        : {};
    const { name } = transition;

    return {
        loop: bool( attributes.loop, DEFAULTS.loop ),
        step: oneOf( attributes.step, STEPS, DEFAULTS.step ),
        keyboard: bool( attributes.keyboard, DEFAULTS.keyboard ),
        autoplay: {
            enabled: bool( autoplay.enabled, DEFAULTS.autoplay.enabled ),
            delay: milliseconds(
                autoplay.delay,
                DELAY,
                DEFAULTS.autoplay.delay
            ),
            pauseOnHover: bool(
                autoplay.pauseOnHover,
                DEFAULTS.autoplay.pauseOnHover
            ),
        },
        transition: {
            name:
                typeof name === 'string' && /^[a-z][a-z0-9-]*$/.test( name )
                    ? name
                    : DEFAULTS.transition.name,
            direction: oneOf(
                transition.direction,
                DIRECTIONS,
                DEFAULTS.transition.direction
            ),
            duration: milliseconds(
                transition.duration,
                DURATION,
                DEFAULTS.transition.duration
            ),
            easing: oneOf(
                transition.easing,
                EASINGS,
                DEFAULTS.transition.easing
            ),
        },
    };
}

/**
 * Root classes for the direction's layout, like Config::classes().
 *
 * @param {Object} config From configFrom().
 * @return {string[]} `is-vertical` and/or `is-reversed`.
 */
export function configClasses( config ) {
    const { direction } = config.transition;

    return [
        ( direction === 'up' || direction === 'down' ) && 'is-vertical',
        ( direction === 'right' || direction === 'down' ) && 'is-reversed',
    ].filter( Boolean );
}
