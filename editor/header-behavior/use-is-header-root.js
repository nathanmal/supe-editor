import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * Whether the block is the top-level block inside a header template part —
 * either inside a template (parent is a header template-part block) or with
 * the header template part open on its own.
 *
 * @param {string} clientId Block client ID.
 * @return {boolean} True for the header's root block.
 */
export default function useIsHeaderRoot( clientId ) {
    return useSelect(
        ( select ) => {
            const { getBlockParents, getBlock } = select( blockEditorStore );
            const parents = getBlockParents( clientId );

            if ( parents.length ) {
                const parent = getBlock( parents[ parents.length - 1 ] );

                return (
                    'core/template-part' === parent?.name &&
                    ( 'header' === parent.attributes.tagName ||
                        'header' === parent.attributes.area )
                );
            }

            const editor = select( editorStore );

            return (
                'wp_template_part' === editor.getCurrentPostType() &&
                'header' === editor.getEditedPostAttribute( 'area' )
            );
        },
        [ clientId ]
    );
}
