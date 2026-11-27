import {
    MediaUpload,
    MediaUploadCheck,
    store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
    Button,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalConfirmDialog as ConfirmDialog,
    Flex,
    PanelBody,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { thumbnailOf } from '../shared/use-media';
import { withDefaultMinHeight } from './min-height';

export const BACKGROUND = 'supe/container-background';

const ALLOWED_TYPES = [ 'image' ];

/**
 * Adds, shows and removes the Container's background. Choosing an image
 * inserts the background block first in the Container (locked in place) and
 * selects it, so its overlay settings are right there; cancelling the media
 * modal adds nothing. A Container without a min height gets 400px (desktop),
 * like Cover, so the background shows before there is content.
 *
 * @param {Object}  props
 * @param {string}  props.clientId   The Container.
 * @param {?Object} props.background The background block, if any.
 */
export default function BackgroundPanel( { clientId, background } ) {
    const [ isConfirming, setIsConfirming ] = useState( false );
    const registry = useRegistry();
    const { insertBlock, removeBlock, selectBlock, updateBlockAttributes } =
        useDispatch( blockEditorStore );
    const mediaId = background?.attributes.mediaId;
    const thumbnail = useSelect(
        ( select ) =>
            mediaId
                ? thumbnailOf( select( coreStore ).getMedia( mediaId ) )
                : null,
        [ mediaId ]
    );

    const addImage = ( image ) =>
        registry.batch( () => {
            const supe = withDefaultMinHeight(
                registry
                    .select( blockEditorStore )
                    .getBlockAttributes( clientId )?.supe
            );

            if ( supe ) {
                updateBlockAttributes( clientId, { supe } );
            }

            insertBlock(
                createBlock( BACKGROUND, {
                    type: 'image',
                    mediaId: image.id,
                    lock: { move: true },
                } ),
                0,
                clientId
            );
        } );

    return (
        <PanelBody
            title={ __( 'Background', 'supe-editor' ) }
            className="supe-container-background-panel"
        >
            { background ? (
                <>
                    <Flex justify="flex-start" gap={ 3 }>
                        { thumbnail ? (
                            <img
                                className="supe-container-background-panel__thumbnail"
                                src={ thumbnail }
                                alt=""
                            />
                        ) : (
                            <span className="supe-container-background-panel__thumbnail" />
                        ) }
                        <span>
                            { mediaId
                                ? __( 'Image', 'supe-editor' )
                                : __( 'Image (none chosen)', 'supe-editor' ) }
                        </span>
                    </Flex>
                    <Flex justify="flex-start" gap={ 2 }>
                        <Button
                            variant="secondary"
                            size="compact"
                            onClick={ () => selectBlock( background.clientId ) }
                        >
                            { __( 'Edit background', 'supe-editor' ) }
                        </Button>
                        <Button
                            variant="tertiary"
                            size="compact"
                            isDestructive
                            onClick={ () => setIsConfirming( true ) }
                        >
                            { __( 'Remove', 'supe-editor' ) }
                        </Button>
                    </Flex>
                    <ConfirmDialog
                        isOpen={ isConfirming }
                        confirmButtonText={ __( 'Remove', 'supe-editor' ) }
                        onConfirm={ () => {
                            setIsConfirming( false );
                            removeBlock( background.clientId, false );
                        } }
                        onCancel={ () => setIsConfirming( false ) }
                    >
                        { __(
                            'Remove the background, with its image and overlay?',
                            'supe-editor'
                        ) }
                    </ConfirmDialog>
                </>
            ) : (
                <>
                    <p className="supe-container-background-panel__none">
                        { __( 'None', 'supe-editor' ) }
                    </p>
                    <MediaUploadCheck>
                        <MediaUpload
                            allowedTypes={ ALLOWED_TYPES }
                            onSelect={ addImage }
                            render={ ( { open } ) => (
                                <Button
                                    variant="secondary"
                                    size="compact"
                                    onClick={ open }
                                >
                                    { __( 'Add image', 'supe-editor' ) }
                                </Button>
                            ) }
                        />
                    </MediaUploadCheck>
                </>
            ) }
        </PanelBody>
    );
}
