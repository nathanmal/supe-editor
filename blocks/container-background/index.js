import { InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

import metadata from './block.json';
import Edit from './edit';
import BackgroundBlockNotice from './edit/BackgroundBlockNotice';
import './style.scss';
import './editor.scss';
import '../shared/sidebar.scss';

registerBlockType( metadata.name, {
    edit: Edit,
    // Dynamic; only a block background (a Fader) saves anything.
    save: () => <InnerBlocks.Content />,
} );

/**
 * A block used as a background (a Fader) gets a way back to its background
 * and a note that the background, not its own size settings, sizes it.
 */
addFilter(
    'editor.BlockEdit',
    'supe-editor/container-background/inner-block',
    createHigherOrderComponent(
        ( BlockEdit ) => ( props ) => (
            <>
                <BlockEdit { ...props } />
                { props.isSelected &&
                    metadata.allowedBlocks.includes( props.name ) && (
                        <InspectorControls>
                            <BackgroundBlockNotice
                                clientId={ props.clientId }
                            />
                        </InspectorControls>
                    ) }
            </>
        ),
        'withContainerBackgroundNotice'
    )
);
