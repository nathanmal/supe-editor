import { addFilter } from '@wordpress/hooks';

/** The slide block each slider type holds. */
export const SLIDE_BLOCKS = {
    images: [ 'supe/image-slide' ],
    content: [ 'supe/slide' ],
    // One locked Query Loop; its post template is the slide.
    posts: [ 'core/query' ],
};

const ALL_SLIDE_BLOCKS = Object.values( SLIDE_BLOCKS ).flat();

/**
 * Keeps each track to its slider type's slide block. The track's
 * `allowedBlocks` alone can't: slide blocks declare `"parent"`, and the
 * editor allows a block when either the container's list or the block's
 * `parent` allows it. (`ancestor` instead would offer slides inside every
 * container nested in a content slide.) The filter is core's own way to
 * veto an insertion — it keeps template parts out of post content.
 */
addFilter(
    'blockEditor.__unstableCanInsertBlockType',
    'supe-editor/slides/slide-blocks',
    (
        canInsert,
        blockType,
        rootClientId,
        { getBlock, getBlockParentsByBlockName }
    ) => {
        if (
            ! canInsert ||
            ! ALL_SLIDE_BLOCKS.includes( blockType.name ) ||
            getBlock( rootClientId )?.name !== 'supe/slides-track'
        ) {
            return canInsert;
        }

        const [ sliderId ] = getBlockParentsByBlockName(
            rootClientId,
            'supe/slides',
            true
        );
        const type = getBlock( sliderId )?.attributes.type;

        return SLIDE_BLOCKS[ type ]?.includes( blockType.name ) ?? false;
    }
);
