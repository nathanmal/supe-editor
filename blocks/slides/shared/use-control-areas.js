import { store as blockEditorStore } from '@wordpress/block-editor';
import { cloneBlock, createBlock } from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

import { AREAS } from './controls';

/**
 * Adds, removes and moves a slider's controls between its two areas (the
 * overlay and the bar), creating an area when a control first needs it and
 * removing one once it's empty. Areas keep the order track, overlay, bar.
 *
 * A new area is created holding its first controls: the editor refuses to
 * insert or move blocks into an area it hasn't rendered yet (no block list
 * settings), so that can't be a second step.
 *
 * @param {string} sliderId The supe/slides block's client ID.
 * @return {Object} { area, controls, add, remove, move }.
 */
export default function useControlAreas( sliderId ) {
    const registry = useRegistry();

    return useMemo( () => {
        const select = () => registry.select( blockEditorStore );
        const actions = registry.dispatch( blockEditorStore );

        const area = ( name ) =>
            select()
                .getBlocks( sliderId )
                .find( ( block ) => block.name === AREAS[ name ] );

        const insertInto = ( name, blocks ) => {
            const existing = area( name );

            if ( existing ) {
                actions.insertBlocks(
                    blocks,
                    undefined,
                    existing.clientId,
                    false
                );
                return;
            }

            const children = select().getBlocks( sliderId );
            const track = children.findIndex(
                ( block ) => block.name === 'supe/slides-track'
            );

            actions.insertBlock(
                createBlock( AREAS[ name ], {}, blocks ),
                name === 'overlay' ? track + 1 : children.length,
                sliderId,
                false
            );
        };

        const prune = () =>
            Object.keys( AREAS ).forEach( ( name ) => {
                const existing = area( name );
                if ( existing && existing.innerBlocks.length === 0 ) {
                    actions.removeBlock( existing.clientId, false );
                }
            } );

        const controls = ( names ) =>
            Object.keys( AREAS )
                .flatMap( ( name ) => area( name )?.innerBlocks ?? [] )
                .filter( ( block ) => names.includes( block.name ) );

        return {
            area,
            controls,
            /** @param {string[]} names Control blocks to add to the overlay. */
            add( names ) {
                insertInto(
                    'overlay',
                    names.map( ( name ) => createBlock( name ) )
                );
            },
            /** @param {string[]} names Control blocks to remove everywhere. */
            remove( names ) {
                registry.batch( () => {
                    actions.removeBlocks(
                        controls( names ).map( ( block ) => block.clientId ),
                        false
                    );
                    prune();
                } );
            },
            /**
             * @param {string} clientId A control.
             * @param {string} name     `overlay` or `bar`.
             */
            move( clientId, name ) {
                const from = select().getBlockRootClientId( clientId );
                const target = area( name );

                if ( target?.clientId === from ) {
                    return;
                }
                registry.batch( () => {
                    if ( target ) {
                        actions.moveBlocksToPosition(
                            [ clientId ],
                            from,
                            target.clientId
                        );
                    } else {
                        // A copy, since the area is new; keep it selected.
                        const copy = cloneBlock(
                            select().getBlock( clientId )
                        );

                        actions.removeBlock( clientId, false );
                        insertInto( name, [ copy ] );
                        actions.selectBlock( copy.clientId );
                    }
                    prune();
                } );
            },
        };
    }, [ registry, sliderId ] );
}
