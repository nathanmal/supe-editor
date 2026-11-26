import { __ } from '@wordpress/i18n';
import { cover, gallery } from '@wordpress/icons';

/**
 * One variation per slide type, picked when the block is inserted (scope
 * `block`, like Columns). Each holds the locked track with starter slides;
 * TypePanel reuses the starter slides when the type changes later.
 *
 * @param {Array} slides Inner blocks template for the track.
 */
const track = ( slides ) => [
    'supe/slides-track',
    { lock: { move: true, remove: true } },
    slides,
];

const variations = [
    {
        name: 'images',
        title: __( 'Image slides', 'supe-editor' ),
        description: __( 'One image per slide.', 'supe-editor' ),
        icon: gallery,
        attributes: { type: 'images' },
        innerBlocks: [ track( [ [ 'supe/image-slide' ] ] ) ],
        scope: [ 'block' ],
        isActive: [ 'type' ],
    },
    {
        name: 'content',
        title: __( 'Content slides', 'supe-editor' ),
        description: __( 'Slides that hold any blocks.', 'supe-editor' ),
        icon: cover,
        attributes: { type: 'content' },
        innerBlocks: [
            track( [
                [ 'supe/slide', {}, [ [ 'core/paragraph' ] ] ],
                [ 'supe/slide', {}, [ [ 'core/paragraph' ] ] ],
            ] ),
        ],
        scope: [ 'block' ],
        isActive: [ 'type' ],
    },
];

/**
 * The starter slides for a type, as an inner blocks template.
 *
 * @param {string} type
 * @return {Array} Template for the track's inner blocks.
 */
export const starterSlides = ( type ) =>
    variations.find( ( variation ) => variation.attributes.type === type )
        ?.innerBlocks[ 0 ][ 2 ] ?? [];

export default variations;
