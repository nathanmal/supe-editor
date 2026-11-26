import { registerBlockType } from '@wordpress/blocks';
import { pause } from '@wordpress/icons';

import Edit from './edit';
import metadata from './block.json';

registerBlockType( metadata.name, {
    icon: pause,
    edit: Edit,
    save: () => null,
} );
