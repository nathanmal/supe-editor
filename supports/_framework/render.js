/**
 * JS port of AbstractResponsiveSupport (render(), rules()) and
 * StyleGenerator's stylesheet for supports: what a stored support value
 * renders to, and the shared media-query CSS. The editor uses it to preview
 * values on the canvas; headless front ends use it to render blocks the way
 * WordPress does. Tested against tests/fixtures/supports/*.json, the same
 * cases as the PHP.
 *
 * Portable: no WordPress imports, so headless front ends can use it as-is.
 *
 * Generated names: `supe-{var}{side}` for desktop, `-t` / `-m` suffixes for
 * tablet / mobile, e.g. `has-supe-pt-m` + `--supe-pt-m: 1rem`.
 * Rules are `!important` so a block's own value wins like an inline style.
 */
import { sanitize } from './sanitize';
import { upgrade } from './upgrade';
import { variableRules } from './variables';

/** Viewports in cascade order, with their name suffixes. */
const VIEWPORTS = [
    [ 'desktop', 'd' ],
    [ 'tablet', 't' ],
    [ 'mobile', 'm' ],
];

const SIDES = { top: 't', right: 'r', bottom: 'b', left: 'l' };

const EMPTY = Object.freeze( { classes: [], styles: {} } );

/**
 * Classes and inline styles for a stored value of any known version:
 * upgraded to the current shape first, then rendered. Values that can't be
 * upgraded render nothing.
 *
 * @param {Object} metadata     Decoded support.json.
 * @param {Object} value        Stored `supe.{name}` value.
 * @param {Object} [migrations] See upgrade().
 * @return {{classes: string[], styles: Object<string, string>}} Output.
 */
export function supportOutput( metadata, value, migrations = {} ) {
    const upgraded = upgrade( metadata, value, migrations );

    return upgraded === null ? EMPTY : renderSupport( metadata, upgraded );
}

/**
 * Classes and inline styles for a value already in the current shape.
 *
 * @param {Object} metadata Decoded support.json.
 * @param {Object} value
 * @return {{classes: string[], styles: Object<string, string>}} Output.
 */
export function renderSupport( metadata, value ) {
    const classes = [];
    const styles = {};

    for ( const [ property, config ] of properties( metadata ) ) {
        const byViewport = value?.[ property ];

        if ( ! isObject( byViewport ) ) {
            continue;
        }

        for ( const [ viewport, suffix ] of VIEWPORTS ) {
            const viewportValue = byViewport[ viewport ];

            for ( const [ key, side ] of targets( config ) ) {
                let raw = null;

                if ( key === '' ) {
                    raw = viewportValue;
                } else if ( isObject( viewportValue ) ) {
                    raw = viewportValue[ key ];
                }

                const css = sanitize( raw, config.type );

                if ( css === null ) {
                    continue;
                }

                const name = generatedName( config, side, suffix );

                classes.push( `has-${ name }` );
                styles[ `--${ name }` ] = css;
            }
        }
    }

    return { classes, styles };
}

/**
 * Stylesheet rules shared by every block using a support, keyed by viewport.
 *
 * @param {Object} metadata Decoded support.json.
 * @return {Object<string, string[]>} Rules per viewport.
 */
export function supportRules( metadata ) {
    const rules = Object.fromEntries(
        VIEWPORTS.map( ( [ viewport ] ) => [ viewport, [] ] )
    );

    for ( const [ , config ] of properties( metadata ) ) {
        for ( const [ key, side ] of targets( config ) ) {
            const cssProperty =
                key === '' ? config.css : `${ config.css }-${ key }`;

            for ( const [ viewport, suffix ] of VIEWPORTS ) {
                const name = generatedName( config, side, suffix );

                rules[ viewport ].push(
                    `.has-${ name }{${ cssProperty }:var(--${ name })!important}`
                );
            }
        }
    }

    return rules;
}

/**
 * The shared stylesheet: supports' rules, then responsive variables' rules
 * (like StyleGenerator::css()); desktop rules as-is, tablet and mobile
 * rules inside `max-width` media queries.
 *
 * @param {Object[]} supports    Decoded support.json of each support, in load order.
 * @param {Object}   breakpoints `{ tablet, mobile }` max widths in px.
 * @param {Object}   [variables] Responsive variables by name: `{ selector, type }`,
 *                               in registration order (see variables.js).
 * @return {string} CSS.
 */
export function stylesheet( supports, breakpoints, variables = {} ) {
    const rules = Object.fromEntries(
        VIEWPORTS.map( ( [ viewport ] ) => [ viewport, [] ] )
    );

    for ( const metadata of supports ) {
        for ( const [ viewport, viewportRules ] of Object.entries(
            supportRules( metadata )
        ) ) {
            rules[ viewport ].push( ...viewportRules );
        }
    }

    for ( const [ viewport, viewportRules ] of Object.entries(
        variableRules( variables )
    ) ) {
        rules[ viewport ].push( ...viewportRules );
    }

    return VIEWPORTS.map( ( [ viewport ] ) => {
        if ( ! rules[ viewport ].length ) {
            return '';
        }

        const block = rules[ viewport ].join( '' );

        return viewport === 'desktop'
            ? block
            : `@media (max-width:${ Math.trunc(
                  Number( breakpoints[ viewport ] )
              ) }px){${ block }}`;
    } ).join( '' );
}

/**
 * The support's properties with their metadata validated. `css` and `var`
 * end up verbatim in generated CSS, so anything unexpected is skipped.
 *
 * @param {Object} metadata
 * @return {Array} [ property, { css, var, sides, type } ] pairs.
 */
function properties( metadata ) {
    const entries = isObject( metadata?.properties )
        ? Object.entries( metadata.properties )
        : [];

    return entries
        .filter(
            ( [ , config ] ) =>
                isObject( config ) &&
                /^[a-z-]+$/.test( String( config.css ?? '' ) ) &&
                /^[a-z0-9]+$/.test( String( config.var ?? '' ) )
        )
        .map( ( [ property, config ] ) => [
            property,
            {
                css: config.css,
                var: config.var,
                sides: Boolean( config.sides ),
                type: String( config.type ?? 'spacing' ),
            },
        ] );
}

/**
 * Value keys to read for a property, with their name suffix: each side for
 * sided properties, or the value itself (empty key) otherwise.
 *
 * @param {Object} config
 * @return {Array} [ key, side ] pairs.
 */
function targets( config ) {
    return config.sides ? Object.entries( SIDES ) : [ [ '', '' ] ];
}

function generatedName( config, side, suffix ) {
    const name = `supe-${ config.var }${ side }`;

    return suffix === 'd' ? name : `${ name }-${ suffix }`;
}

function isObject( value ) {
    return typeof value === 'object' && value !== null;
}
