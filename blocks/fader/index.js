import './style.scss';
import './editor.scss';
import '../shared/sidebar.scss';

import { InnerBlocks } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';

import metadata from './block.json';
import Edit from './edit/Edit';
import icon from './icon';

registerBlockType( metadata.name, {
    icon,
    edit: Edit,
    save: () => <InnerBlocks.Content />,
} );
