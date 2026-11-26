import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

import { CONTROL_BLOCKS } from '../slides/shared/controls';

/**
 * Controls over the slides: a 3×3 grid sharing the track's place in the
 * slider (style.scss). Controls are added from the slider's Controls panel,
 * so there's no appender drawn over the design.
 */
export default function Edit() {
    const innerBlocksProps = useInnerBlocksProps(
        useBlockProps( { className: 'supe-slides__overlay' } ),
        { allowedBlocks: CONTROL_BLOCKS, renderAppender: false }
    );

    return <div { ...innerBlocksProps } />;
}
