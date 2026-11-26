import { registerBlockType } from '@wordpress/blocks';
import { chevronRight } from '@wordpress/icons';

import arrowEdit from '../slides/shared/ArrowEdit';
import metadata from './block.json';

registerBlockType( metadata.name, {
    icon: chevronRight,
    edit: arrowEdit( 'next', metadata.attributes.position.default ),
    save: () => null,
} );
