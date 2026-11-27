/**
 * JS port of PHP's Supe\Editor\Supports\Responsive\ValueSanitizer: turns
 * stored responsive values into CSS-safe strings, or null when a value isn't
 * allowed. Both are tested against tests/fixtures/value-sanitizer.json and
 * must stay identical.
 *
 * Portable: no WordPress imports, so headless front ends can use it as-is.
 */

const MAX_LENGTH = 64;
const NUMBER = '(?:\\d+(?:\\.\\d+)?|\\.\\d+)';

/** Units a spacing value may use — the units core's spacing control offers. */
const SPACING_UNITS = 'px|em|rem|%|vh|vw';

const PRESET = /^var:preset\|spacing\|([a-z0-9-]+)$/;
const RESOLVED_PRESET = /^var\(--wp--preset--spacing--([a-z0-9-]+)\)$/;
const INTEGER = /^[+-]?(?:0|[1-9]\d*)$/;

/**
 * Sanitize by type name, or by an options object whose `type` key names it
 * (`{ type: 'int', min: 1, max: 12 }`).
 *
 * Types: spacing, margin (spacing plus negatives and `auto`), length, ratio,
 * int, keyword (one of the option's `values`).
 *
 * @param {*}             value
 * @param {string|Object} type
 * @return {string|null} CSS-safe value, or null.
 */
export function sanitize( value, type ) {
    const options = typeof type === 'object' && type !== null ? type : { type };

    switch ( options.type ) {
        case 'spacing':
            return spacing( value );
        case 'margin':
            return spacing( value, { allowNegative: true, allowAuto: true } );
        case 'length':
            return length( value );
        case 'ratio':
            return ratio( value );
        case 'int':
            return int(
                value,
                options.min ?? 0,
                options.max ?? Number.MAX_SAFE_INTEGER
            );
        case 'keyword':
            return keyword(
                value,
                Array.isArray( options.values ) ? options.values : []
            );
        default:
            return null;
    }
}

/**
 * A theme spacing preset (`var:preset|spacing|40`, or its already-resolved
 * `var(--wp--preset--spacing--40)` form), `0`, or a number in px, em, rem,
 * %, vh or vw.
 *
 * @param {*}       raw
 * @param {Object}  [options]
 * @param {boolean} [options.allowNegative=false]
 * @param {boolean} [options.allowAuto=false]
 * @return {string|null} CSS-safe value, or null.
 */
export function spacing(
    raw,
    { allowNegative = false, allowAuto = false } = {}
) {
    const value = normalize( raw );

    if ( value === null ) {
        return null;
    }

    const preset = value.match( PRESET ) ?? value.match( RESOLVED_PRESET );

    if ( preset ) {
        return `var(--wp--preset--spacing--${ preset[ 1 ] })`;
    }

    if ( allowAuto && value === 'auto' ) {
        return 'auto';
    }

    const sign = allowNegative ? '-?' : '';

    if ( new RegExp( `^${ sign }0$` ).test( value ) ) {
        return '0';
    }

    return new RegExp( `^${ sign }${ NUMBER }(?:${ SPACING_UNITS })$` ).test(
        value
    )
        ? value
        : null;
}

/**
 * `auto`, `0`, or a non-negative number in px, % or vh.
 *
 * @param {*} raw
 * @return {string|null} CSS-safe value, or null.
 */
export function length( raw ) {
    const value = normalize( raw );

    if ( value === null ) {
        return null;
    }

    if ( value === 'auto' || value === '0' ) {
        return value;
    }

    return new RegExp( `^${ NUMBER }(?:px|%|vh)$` ).test( value )
        ? value
        : null;
}

/**
 * `auto`, a `width/height` pair, or a single number — every number positive.
 * Pairs are returned in CSS `aspect-ratio` form (`16 / 9`).
 *
 * @param {*} raw
 * @return {string|null} CSS-safe value, or null.
 */
export function ratio( raw ) {
    const value = normalize( raw );

    if ( value === null ) {
        return null;
    }

    if ( value === 'auto' ) {
        return 'auto';
    }

    const pair = value.match(
        new RegExp( `^(${ NUMBER })\\s*\\/\\s*(${ NUMBER })$` )
    );

    if ( pair ) {
        return parseFloat( pair[ 1 ] ) > 0 && parseFloat( pair[ 2 ] ) > 0
            ? `${ pair[ 1 ] } / ${ pair[ 2 ] }`
            : null;
    }

    if ( new RegExp( `^${ NUMBER }$` ).test( value ) ) {
        return parseFloat( value ) > 0 ? value : null;
    }

    return null;
}

/**
 * A whole number within [min, max], as a string.
 *
 * @param {*}      raw
 * @param {number} [min=0]
 * @param {number} [max=Number.MAX_SAFE_INTEGER]
 * @return {string|null} The integer as a string, or null.
 */
export function int( raw, min = 0, max = Number.MAX_SAFE_INTEGER ) {
    let number = null;

    if ( typeof raw === 'number' && Number.isInteger( raw ) ) {
        number = raw;
    } else if ( typeof raw === 'string' && INTEGER.test( raw.trim() ) ) {
        number = parseInt( raw.trim(), 10 );
    }

    if ( number === null || number < min || number > max ) {
        return null;
    }

    // `-0` → '0', as PHP prints it.
    return String( number === 0 ? 0 : number );
}

/**
 * One of the allowed keywords (e.g. `column` for flex-direction), or null.
 * Only lowercase `[a-z-]` keywords can be allowed, so whatever comes back is
 * safe in CSS.
 *
 * @param {*}     raw
 * @param {Array} values Allowed keywords.
 * @return {string|null} The keyword, or null.
 */
export function keyword( raw, values ) {
    const value = normalize( raw );

    if ( value === null || ! /^[a-z-]+$/.test( value ) ) {
        return null;
    }

    return values.includes( value ) ? value : null;
}

/**
 * Trimmed, lowercased string form of a scalar value; null for anything
 * empty, oversized, or non-scalar.
 *
 * @param {*} raw
 * @return {string|null} Normalized value, or null.
 */
function normalize( raw ) {
    const value = typeof raw === 'number' ? String( raw ) : raw;

    if ( typeof value !== 'string' ) {
        return null;
    }

    const normalized = value.trim().toLowerCase();

    if ( normalized === '' || normalized.length > MAX_LENGTH ) {
        return null;
    }

    return normalized;
}
