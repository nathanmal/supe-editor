/**
 * A block never has both a support and the core feature it replaces
 * (support.json `replaces`, e.g. `{ "spacing": [ "padding", "margin" ] }`).
 * JS twin of SupportRegistry::withoutReplacedCoreSupports(); applied to
 * blocks that opt in themselves, not to core blocks opted in through
 * `coreBlocks` (their saved markup depends on the core feature).
 */

/**
 * A block's supports with the core features a support replaces turned off,
 * e.g. `spacing.padding` and `spacing.margin` set to false while
 * `spacing.blockGap` stays.
 *
 * @param {Object} blockSupports The block type's `supports`.
 * @param {Object} metadata      Decoded support.json.
 * @return {Object} Updated supports.
 */
export function withoutReplacedCoreSupports( blockSupports, metadata ) {
    let updated = blockSupports;

    for ( const [ feature, keys ] of Object.entries(
        metadata?.replaces ?? {}
    ) ) {
        const names = Array.isArray( keys )
            ? keys.filter( ( key ) => typeof key === 'string' )
            : [];

        if ( ! names.length || ! updated[ feature ] ) {
            continue;
        }

        const current =
            typeof updated[ feature ] === 'object' ? updated[ feature ] : {};

        updated = {
            ...updated,
            [ feature ]: {
                ...current,
                ...Object.fromEntries( names.map( ( key ) => [ key, false ] ) ),
            },
        };
    }

    return updated;
}
