import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * @param {string} clientId
 * @return {boolean} Whether the block is a Container background's block.
 */
export default function useBackgroundParent( clientId ) {
    return useSelect(
        ( select ) => {
            const { getBlockRootClientId, getBlockName } =
                select( blockEditorStore );

            return (
                getBlockName( getBlockRootClientId( clientId ) ) ===
                'supe/container-background'
            );
        },
        [ clientId ]
    );
}
