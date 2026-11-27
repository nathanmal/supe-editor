import { __, _x } from '@wordpress/i18n';
import { grid, group, row, stack } from '@wordpress/icons';

/**
 * Layout presets, like core Group's. Only the default one is in the inserter
 * (Row / Stack / Grid there would sit next to Group's, same names and
 * icons); the others are switches in the sidebar and transforms in the
 * toolbar. A Container saved without a layout (before 0.2.0) is flow and
 * matches none of them.
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
];

export default variations;
