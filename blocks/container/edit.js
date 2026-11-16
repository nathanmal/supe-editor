import {
    InnerBlocks,
    store as blockEditorStore,
    useBlockProps,
    useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * An empty wrapper for other blocks. It has no colors or typography of its
 * own, so it follows the theme; spacing comes from the responsive spacing
 * support. While empty it shows a "+" button instead of the default
 * paragraph prompt, like core's Group.
 *
 * @param {Object} props
 * @param {string} props.clientId
 */
export default function Edit( { clientId } ) {
    const hasInnerBlocks = useSelect(
        ( select ) => select( blockEditorStore ).getBlockCount( clientId ) > 0,
        [ clientId ]
    );
    const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
        renderAppender: hasInnerBlocks
            ? undefined
            : InnerBlocks.ButtonBlockAppender,
    } );

    return <div { ...innerBlocksProps } />;
}
