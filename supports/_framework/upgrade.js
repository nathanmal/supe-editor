/**
 * JS port of AbstractSupport::version() / upgrade(): stored values carry the
 * version of their shape (`v`), and older values are upgraded through the
 * support's migrations before use. A value without a version is version 1.
 *
 * Portable: no WordPress imports, so headless front ends can use it as-is.
 */

/** Key holding a stored value's shape version. */
export const VERSION_KEY = 'v';

/**
 * Current version of a support's stored value shape (support.json
 * `version`, default 1).
 *
 * @param {Object} metadata Decoded support.json.
 * @return {number} Version.
 */
export function supportVersion( metadata ) {
    const version = metadata?.version ?? 1;

    return Number.isInteger( version ) && version > 0 ? version : 1;
}

/**
 * A stored value in the current shape, or null when it can't be read: an
 * invalid version, one newer than this code knows, or a missing migration.
 *
 * @param {Object} metadata     Decoded support.json.
 * @param {Object} value        Stored value.
 * @param {Object} [migrations] Keyed by the version each one upgrades from:
 *                              `{ 1: ( value ) => …version 2 shape… }`. Must
 *                              match the support's PHP migrations().
 * @return {Object|null} Upgraded value, or null.
 */
export function upgrade( metadata, value, migrations = {} ) {
    const current = supportVersion( metadata );
    const from = value?.[ VERSION_KEY ] ?? 1;

    if ( ! Number.isInteger( from ) || from < 1 || from > current ) {
        return null;
    }

    let upgraded = value;

    for ( let version = from; version < current; version++ ) {
        if ( typeof migrations[ version ] !== 'function' ) {
            return null;
        }

        upgraded = migrations[ version ]( upgraded );
    }

    return { ...upgraded, [ VERSION_KEY ]: current };
}
