import { __, _x } from '@wordpress/i18n';
import { cover, grid, group, row, stack } from '@wordpress/icons';

/**
 * Layout presets, like core Group's. Only the default one is in the inserter
 * (Row / Stack / Grid there would sit next to Group's, same names and
 * icons); the others are switches in the sidebar and transforms in the
 * toolbar. A Container saved without a layout (before 0.2.0) is flow and
 * matches none of them.
 *
 * Hero is a starting point rather than a layout: a full-width Stack with a
 * min height, content centered, white text and a background with a 50%
 * black overlay (the image is chosen from the toolbar). Inserter only; once
 * inserted it's a Stack.
 */
const variations = [
    {
        name: 'container',
        title: __( 'Container', 'supe-editor' ),
        description: __( 'Gather blocks in a container.', 'supe-editor' ),
        attributes: { layout: { type: 'constrained' } },
        isDefault: true,
        scope: [ 'block', 'inserter', 'transform' ],
        isActive: ( attributes ) => attributes.layout?.type === 'constrained',
        icon: group,
    },
    {
        name: 'container-row',
        title: _x( 'Row', 'single horizontal line', 'supe-editor' ),
        description: __( 'Arrange blocks horizontally.', 'supe-editor' ),
        attributes: { layout: { type: 'flex', flexWrap: 'nowrap' } },
        scope: [ 'block', 'transform' ],
        isActive: ( attributes ) =>
            attributes.layout?.type === 'flex' &&
            attributes.layout?.orientation !== 'vertical',
        icon: row,
    },
    {
        name: 'container-stack',
        title: __( 'Stack', 'supe-editor' ),
        description: __( 'Arrange blocks vertically.', 'supe-editor' ),
        attributes: { layout: { type: 'flex', orientation: 'vertical' } },
        scope: [ 'block', 'transform' ],
        isActive: ( attributes ) =>
            attributes.layout?.type === 'flex' &&
            attributes.layout?.orientation === 'vertical',
        icon: stack,
    },
    {
        name: 'container-grid',
        title: __( 'Grid', 'supe-editor' ),
        description: __( 'Arrange blocks in a grid.', 'supe-editor' ),
        attributes: { layout: { type: 'grid' } },
        scope: [ 'block', 'transform' ],
        isActive: ( attributes ) => attributes.layout?.type === 'grid',
        icon: grid,
    },
    {
        name: 'container-hero',
        title: __( 'Hero', 'supe-editor' ),
        description: __(
            'A full-width section with a background image under an overlay.',
            'supe-editor'
        ),
        attributes: {
            align: 'full',
            layout: { type: 'flex', orientation: 'vertical' },
            style: { color: { text: '#ffffff' } },
            supe: {
                layout: { v: 1, justify: { desktop: 'center' } },
                dimensions: { v: 1, minHeight: { desktop: '60vh' } },
                spacing: {
                    v: 1,
                    padding: {
                        desktop: {
                            top: 'var:preset|spacing|60',
                            right: 'var:preset|spacing|40',
                            bottom: 'var:preset|spacing|60',
                            left: 'var:preset|spacing|40',
                        },
                    },
                },
            },
        },
        innerBlocks: [
            [
                'supe/container-background',
                {
                    lock: { move: true },
                    overlayColor: '#000000',
                    overlayOpacity: 50,
                },
            ],
            [ 'core/heading', { placeholder: __( 'Heading', 'supe-editor' ) } ],
            [
                'core/paragraph',
                { placeholder: __( 'Write something…', 'supe-editor' ) },
            ],
        ],
        scope: [ 'inserter' ],
        icon: cover,
    },
];

export default variations;
