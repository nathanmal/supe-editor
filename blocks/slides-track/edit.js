import {
    InnerBlocks,
    useBlockProps,
    useInnerBlocksProps,
} from '@wordpress/block-editor';

import { SLIDE_BLOCKS } from './slide-blocks';

/**
 * The slider's track: always present, locked in place by the parent's
 * template. Which slides it accepts follows the parent's type.
 *
 * @param {Object} props
 * @param {Object} props.context
 */
export default function Edit( { context } ) {
    const innerBlocksProps = useInnerBlocksProps(
        useBlockProps( { className: 'supe-slides__track' } ),
        {
            allowedBlocks: SLIDE_BLOCKS[ context[ 'supe/slides/type' ] ] ?? [],
            renderAppender: InnerBlocks.ButtonBlockAppender,
        }
    );

    return <div { ...innerBlocksProps } />;
}
