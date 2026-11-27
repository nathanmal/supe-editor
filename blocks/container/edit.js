import {
    InnerBlocks,
    store as blockEditorStore,
    useBlockProps,
    useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * A layout block for other blocks. Layout (flow / constrained / flex / grid)
 * and colors come from core supports, spacing from the responsive spacing
 * support; with none set it follows the theme. While empty it shows a "+"
 * button instead of the default paragraph prompt, like core's Group.
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
