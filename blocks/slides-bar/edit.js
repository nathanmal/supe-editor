import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

import { CONTROL_BLOCKS } from '../slides/shared/controls';

/**
 * Controls below the slides, laid out by core's flex layout (justification,
 * gap, wrap). Controls are added from the slider's Controls panel.
 */
export default function Edit() {
    const innerBlocksProps = useInnerBlocksProps(
        useBlockProps( { className: 'supe-slides__bar' } ),
        { allowedBlocks: CONTROL_BLOCKS, renderAppender: false }
    );

    return <div { ...innerBlocksProps } />;
}
