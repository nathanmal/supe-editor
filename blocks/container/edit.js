import {
    InnerBlocks,
    InspectorControls,
    store as blockEditorStore,
    useBlockProps,
    useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

import BackgroundPanel, { BACKGROUND } from './BackgroundPanel';

/**
 * A layout block for other blocks. Layout (flow / constrained / flex / grid)
 * and colors come from core supports, spacing from the responsive spacing
 * support; with none set it follows the theme. While it has no content it
 * shows a "+" button instead of the default paragraph prompt, like core's
 * Group.
 *
 * An optional background (supe/container-background, added from the
 * Background panel) is kept as the first child: anything dragged above it
 * is moved back below. While it is the only child, the Container gets a
 * placeholder height in the editor (see editor.scss) so the image shows.
 *
 * @param {Object} props
 * @param {string} props.clientId
 */
export default function Edit( { clientId } ) {
    const { background, before, hasContent } = useSelect(
        ( select ) => {
            const blocks = select( blockEditorStore ).getBlocks( clientId );
            const index = blocks.findIndex(
                ( block ) => block.name === BACKGROUND
            );

            return {
                background: index === -1 ? null : blocks[ index ],
                before: index > 0 ? blocks.slice( 0, index ) : null,
                hasContent: blocks.length > ( index === -1 ? 0 : 1 ),
            };
        },
        [ clientId ]
    );
    const { moveBlocksToPosition } = useDispatch( blockEditorStore );

    useEffect( () => {
        if ( before ) {
            moveBlocksToPosition(
                before.map( ( block ) => block.clientId ),
                clientId,
                clientId,
                1
            );
        }
    }, [ before, clientId, moveBlocksToPosition ] );

    const blockProps = useBlockProps( {
        className:
            background && ! hasContent ? 'is-background-only' : undefined,
    } );
    const innerBlocksProps = useInnerBlocksProps( blockProps, {
        renderAppender: hasContent
            ? undefined
            : InnerBlocks.ButtonBlockAppender,
    } );

    return (
        <>
            <InspectorControls group="styles">
                <BackgroundPanel
                    clientId={ clientId }
                    background={ background }
                />
            </InspectorControls>
            <div { ...innerBlocksProps } />
        </>
    );
}
