/**
 * JS port of Supe\Editor\Blocks\Slides\Layout: what the slider's perView /
 * gap / height / heightTarget attributes render to on its root. The editor
 * previews with it; headless front ends can render with it. Both run
 * tests/fixtures/slides-layout.json.
 *
 * Portable: no WordPress imports.
 */
import { sanitize } from '../../../supports/_framework/sanitize';
import { variableStyles } from '../../../supports/_framework/variables';

export const PER_VIEW = 'supe-slides-per-view';
export const GAP = 'supe-slides-gap';
export const HEIGHT = 'supe-slides-h';
export const RATIO = 'supe-slides-ar';

/** Variable name → ValueSanitizer type, as registered in PHP. */
export const VARIABLES = {
    [ PER_VIEW ]: { type: 'int', min: 1, max: 12 },
    [ GAP ]: 'spacing',
    [ HEIGHT ]: 'length',
    [ RATIO ]: 'ratio',
};

/** Height modes that are a number in that unit. */
export const HEIGHT_UNITS = [ 'px', '%', 'vh' ];

const VIEWPORTS = [ 'desktop', 'tablet', 'mobile' ];

const isObject = ( value ) =>
    typeof value === 'object' && value !== null && ! Array.isArray( value );

/**
 * Like PHP's is_int/is_float/is_numeric checks in Layout::isNumber().
 *
 * @param {*} value
 * @return {boolean} Whether it's a number or a numeric string.
 */
const isNumber = ( value ) =>
    ( typeof value === 'number' && Number.isFinite( value ) ) ||
    ( typeof value === 'string' &&
        value.trim() !== '' &&
        Number.isFinite( Number( value.trim() ) ) );

/**
 * One viewport's height setting as [ height, aspect-ratio ] CSS, or null.
 *
 * @param {*} setting `{ mode, value }`.
 * @return {?string[]} The pair, the unused one `auto`.
 */
export function heightPair( setting ) {
    if ( ! isObject( setting ) ) {
        return null;
    }

    const { mode, value } = setting;

    if ( mode === 'auto' ) {
        return [ 'auto', 'auto' ];
    }

    if ( mode === 'ratio' ) {
        const ratio = sanitize( value, 'ratio' );

        return ratio === null || ratio === 'auto' ? null : [ 'auto', ratio ];
    }

    if ( HEIGHT_UNITS.includes( mode ) && isNumber( value ) ) {
        const length = sanitize(
            `${ String( value ).trim() }${ mode }`,
            'length'
        );

        return length === null ? null : [ length, 'auto' ];
    }

    return null;
}

/**
 * A gap of zero as `0px`, like Layout::gapValue(): the gap is multiplied
 * inside the slide width's `calc()`, where a unitless `0` (what core's
 * spacing control stores) makes `100% - 0` invalid.
 *
 * @param {*} value
 * @return {*} The value, or `0px` for zero.
 */
export function gapValue( value ) {
    const trimmed = typeof value === 'string' ? value.trim() : value;

    return trimmed === 0 || trimmed === '0' ? '0px' : value;
}

/**
 * Each variable's per-viewport values.
 *
 * @param {Object} attributes
 * @return {Object<string, Object>} By variable name.
 */
export function layoutValues( attributes ) {
    const values = {
        [ PER_VIEW ]: isObject( attributes.perView ) ? attributes.perView : {},
        [ GAP ]: isObject( attributes.gap )
            ? Object.fromEntries(
                  Object.entries( attributes.gap ).map(
                      ( [ viewport, value ] ) => [ viewport, gapValue( value ) ]
                  )
              )
            : {},
        [ HEIGHT ]: {},
        [ RATIO ]: {},
    };
    const height = isObject( attributes.height ) ? attributes.height : {};

    for ( const viewport of VIEWPORTS ) {
        const pair = heightPair( height[ viewport ] );

        if ( pair ) {
            [ values[ HEIGHT ][ viewport ], values[ RATIO ][ viewport ] ] =
                pair;
        }
    }

    return values;
}

/**
 * Classes and inline variables for the slider's root.
 *
 * @param {Object} attributes
 * @return {{classes: string[], styles: Object<string, string>}} Output.
 */
export function layoutOutput( attributes ) {
    const styles = {};

    for ( const [ name, values ] of Object.entries(
        layoutValues( attributes )
    ) ) {
        Object.assign(
            styles,
            variableStyles( name, VARIABLES[ name ], values )
        );
    }

    return {
        classes:
            attributes.heightTarget === 'slide' ? [ 'is-height-slide' ] : [],
        styles,
    };
}

/**
 * Slides per view at a viewport: its own valid value, else the nearest
 * larger viewport's, else 1 — what `--supe-slides-per-view` resolves to there.
 *
 * @param {Object|undefined} perView  Keyed by viewport.
 * @param {string}           viewport
 * @return {number} Columns.
 */
export function perViewAt( perView, viewport ) {
    const cascade = VIEWPORTS.slice( 0, VIEWPORTS.indexOf( viewport ) + 1 );

    return cascade.reduce( ( columns, name ) => {
        const css = sanitize(
            isObject( perView ) ? perView[ name ] ?? null : null,
            VARIABLES[ PER_VIEW ]
        );

        return css === null ? columns : Number( css );
    }, 1 );
}

/**
 * The slides a view shows: `columns` slides including `index`. The view
 * stays where it was (`previousFirst`) while that still includes `index`,
 * so reordering or picking a slide already in view doesn't move it;
 * otherwise it starts at `index`. Shifted back so the last view is full.
 *
 * @param {number}  count           Number of slides.
 * @param {number}  index           The slide the view must include.
 * @param {number}  columns         Slides per view.
 * @param {?number} [previousFirst] Where the view started before.
 * @return {number[]} [ first, last ] indexes, inclusive.
 */
export function viewRange( count, index, columns, previousFirst = null ) {
    const keep =
        previousFirst !== null &&
        index >= previousFirst &&
        index < previousFirst + columns;
    const first = Math.max(
        0,
        Math.min( keep ? previousFirst : index, count - columns )
    );

    return [ first, Math.min( count, first + columns ) - 1 ];
}
