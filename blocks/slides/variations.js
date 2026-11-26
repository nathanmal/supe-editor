import { __ } from '@wordpress/i18n';
import { cover, gallery, postList } from '@wordpress/icons';

import { POSTS_QUERY } from './shared/posts';

/**
 * One variation per slide type, picked when the block is inserted (scope
 * `block`, like Columns). Each holds the locked track with starter slides
 * and overlay controls;
 * TypePanel reuses the starter slides when the type changes later.
 *
 * @param {Array} slides Inner blocks template for the track.
 */
const track = ( slides ) => [
    'supe/slides-track',
    { lock: { move: true, remove: true } },
    slides,
];

/** Arrows and indicators over the slides; the Controls panel turns them off. */
const overlay = [
    'supe/slides-overlay',
    {},
    [
        [ 'supe/slides-prev' ],
        [ 'supe/slides-next' ],
        [ 'supe/slides-indicators' ],
    ],
];

const variations = [
    {
        name: 'images',
        title: __( 'Image slides', 'supe-editor' ),
        description: __( 'One image per slide.', 'supe-editor' ),
        icon: gallery,
        attributes: { type: 'images' },
        innerBlocks: [ track( [ [ 'supe/image-slide' ] ] ), overlay ],
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
            overlay,
        ],
        scope: [ 'block' ],
        isActive: [ 'type' ],
    },
    {
        name: 'posts',
        title: __( 'Post slides', 'supe-editor' ),
        description: __(
            'One post per slide, from a query or picked by hand.',
            'supe-editor'
        ),
        icon: postList,
        attributes: { type: 'posts' },
        innerBlocks: [
            track( [
                [
                    'core/query',
                    {
                        query: POSTS_QUERY,
                        lock: { move: true, remove: true },
                    },
                    [
                        [
                            'core/post-template',
                            { lock: { move: true, remove: true } },
                            [
                                [
                                    'core/post-featured-image',
                                    { isLink: true },
                                ],
                                [
                                    'core/post-title',
                                    { isLink: true, level: 3 },
                                ],
                                [ 'core/post-excerpt', { excerptLength: 20 } ],
                            ],
                        ],
                    ],
                ],
            ] ),
            overlay,
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
