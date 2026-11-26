import { registerBlockType } from '@wordpress/blocks';
import { moreHorizontal } from '@wordpress/icons';

import Edit from './edit';
import metadata from './block.json';

registerBlockType( metadata.name, {
    icon: moreHorizontal,
    edit: Edit,
    save: () => null,
} );
