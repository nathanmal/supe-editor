/**
 * JS port of StyleGenerator's responsive variables (variableStyles() and the
 * rules css() builds from registerVariables()): a block's own responsive
 * settings resolved into one custom property its CSS consumes. Tested
 * against tests/fixtures/responsive-variables.json, the same cases as the
 * PHP.
 *
 * Portable: no WordPress imports, so headless front ends can use it as-is.
 *
 *   variableStyles( 'supe-slides-per-view', { type: 'int', min: 1, max: 12 }, { desktop: 3 } )
 *   → { '--supe-slides-per-view-d': '3', '--supe-slides-per-view-t': 'initial', … }
 */
import { sanitize } from './sanitize';

/** Viewports in cascade order, with their name suffixes. */
const VIEWPORTS = [
    [ 'desktop', 'd' ],
    [ 'tablet', 't' ],
    [ 'mobile', 'm' ],
];

const NAME = /^[a-z0-9-]+$/;

/**
 * Inline declarations for one block's value of a variable: `--{name}-d` /
 * `-t` / `-m`. Unset viewports are written as `initial` so a nested block of
 * the same type can't inherit an outer block's value. Nothing at all when no
 * viewport has a valid value.
 *
 * @param {string}        name   Variable name without the leading `--`.
 * @param {string|Object} type   ValueSanitizer type (see sanitize()).
 * @param {Object}        values Keyed by viewport.
 * @return {Object<string, string>} Declarations.
 */
export function variableStyles( name, type, values ) {
    if ( ! NAME.test( String( name ) ) ) {
        return {};
    }

    const styles = {};
    let isSet = false;

    for ( const [ viewport, suffix ] of VIEWPORTS ) {
        const css = sanitize( values?.[ viewport ] ?? null, type );

        isSet = isSet || css !== null;
        styles[ `--${ name }-${ suffix }` ] = css ?? 'initial';
    }

    return isSet ? styles : {};
}

/**
 * Stylesheet rules resolving each variable from its viewport values, with
 * fallbacks to the larger viewports — one rule per selector and viewport.
 *
 * @param {Object<string, {selector: string}>} variables By variable name, in registration order.
 * @return {Object<string, string[]>} Rules per viewport.
 */
export function variableRules( variables ) {
    const declarations = Object.fromEntries(
        VIEWPORTS.map( ( [ viewport ] ) => [ viewport, {} ] )
    );

    for ( const [ name, { selector } ] of Object.entries( variables ?? {} ) ) {
        if ( ! NAME.test( name ) ) {
            continue;
        }

        let fallback = null;

        for ( const [ viewport, suffix ] of VIEWPORTS ) {
            const reference = `--${ name }-${ suffix }`;
            fallback =
                fallback === null
                    ? `var(${ reference })`
                    : `var(${ reference },${ fallback })`;

            ( declarations[ viewport ][ selector ] ??= [] ).push(
                `--${ name }:${ fallback }`
            );
        }
    }

    return Object.fromEntries(
        Object.entries( declarations ).map( ( [ viewport, bySelector ] ) => [
            viewport,
            Object.entries( bySelector ).map(
                ( [ selector, lines ] ) =>
                    `${ selector }{${ lines.join( ';' ) }}`
            ),
        ] )
    );
}

/**
 * Inline style string from declarations, like StyleGenerator::inline().
 *
 * @param {Object<string, string>} styles
 * @return {string} `a:b;c:d`.
 */
export function inlineStyle( styles ) {
    return Object.entries( styles )
        .map( ( [ property, value ] ) => `${ property }:${ value }` )
        .join( ';' );
}
