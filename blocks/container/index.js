import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import save from './save';
import variations from './variations';
import metadata from './block.json';

registerBlockType( metadata.name, { edit: Edit, save, variations } );
