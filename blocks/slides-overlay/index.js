import { InnerBlocks } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { overlayText } from '@wordpress/icons';

import metadata from './block.json';
import Edit from './edit';

registerBlockType( metadata.name, {
    icon: overlayText,
    edit: Edit,
    save: () => <InnerBlocks.Content />,
} );
