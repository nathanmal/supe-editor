import { registerBlockType } from '@wordpress/blocks';
import { chevronLeft } from '@wordpress/icons';

import arrowEdit from '../slides/shared/ArrowEdit';
import metadata from './block.json';

registerBlockType( metadata.name, {
    icon: chevronLeft,
    edit: arrowEdit( 'prev', metadata.attributes.position.default ),
    save: () => null,
} );
