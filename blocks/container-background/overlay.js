/**
 * The overlay's declarations — the editor's mirror of PHP's
 * Supe\Editor\Blocks\ContainerBackground::overlay(). Both run
 * tests/fixtures/container-background.json.
 */

export const DEFAULT_OPACITY = 50;

const PRESET = /^var:preset\|(color|gradient)\|([a-z0-9-]+)$/;
const COLOR =
    /^(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([0-9.,%\s/-]+\)|transparent)$/i;
const GRADIENT =
    /^(?:repeating-)?(?:linear|radial|conic)-gradient\([a-z0-9#%.,()\s/-]+\)$/i;

/**
 * @param {Object} attributes Block attributes.
 * @return {?Object<string, string>} CSS declarations, or null without a color or gradient.
 */
export function overlay( attributes ) {
    const gradient = paint( attributes.overlayGradient, 'gradient' );
    const color =
        gradient === null ? paint( attributes.overlayColor, 'color' ) : null;

    if ( gradient === null && color === null ) {
        return null;
    }

    return {
        [ gradient === null ? 'background-color' : 'background-image' ]:
            gradient ?? color,
        opacity: opacity( attributes.overlayOpacity ),
    };
}

/**
 * @param {*} value 0–100.
 * @return {string} CSS opacity, e.g. `0.5`.
 */
export function opacity( value ) {
    const percent =
        typeof value === 'number' && Number.isFinite( value )
            ? Math.round( value )
            : DEFAULT_OPACITY;

    return String( Math.max( 0, Math.min( 100, percent ) ) / 100 );
}

/**
 * Preset reference for a value picked from the theme's colors / gradients,
 * else the value itself.
 *
 * @param {string|undefined}   value
 * @param {Array}              presets `{ slug, color }` or `{ slug, gradient }` items.
 * @param {'color'|'gradient'} kind
 * @return {string|undefined} What to store.
 */
export function toStored( value, presets, kind ) {
    const preset = value
        ? presets.find( ( item ) => item[ kind ] === value )
        : undefined;

    return preset ? `var:preset|${ kind }|${ preset.slug }` : value;
}

/**
 * The value to show in a color / gradient picker for a stored value.
 *
 * @param {string|undefined}   stored
 * @param {Array}              presets
 * @param {'color'|'gradient'} kind
 * @return {string|undefined} A CSS value.
 */
export function fromStored( stored, presets, kind ) {
    const match = typeof stored === 'string' ? stored.match( PRESET ) : null;

    if ( ! match ) {
        return stored;
    }

    return presets.find( ( item ) => item.slug === match[ 2 ] )?.[ kind ];
}

function paint( raw, kind ) {
    if ( typeof raw !== 'string' || raw.length > 512 ) {
        return null;
    }

    const value = raw.trim();
    const preset = value.match( PRESET );

    if ( preset ) {
        return preset[ 1 ] === kind
            ? `var(--wp--preset--${ kind }--${ preset[ 2 ] })`
            : null;
    }

    if ( value.toLowerCase().includes( 'url' ) ) {
        return null;
    }

    return ( kind === 'color' ? COLOR : GRADIENT ).test( value ) ? value : null;
}
