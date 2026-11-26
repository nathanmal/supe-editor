import { InnerBlocks } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { row } from '@wordpress/icons';

import metadata from './block.json';
import Edit from './edit';

registerBlockType( metadata.name, {
    icon: row,
    edit: Edit,
    save: () => <InnerBlocks.Content />,
} );
