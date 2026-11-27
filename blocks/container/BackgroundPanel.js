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
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon, video as videoIcon } from '@wordpress/icons';

import { faderImage } from '../fader/edit/fader-image';
import { thumbnailOf } from '../shared/use-media';
import useMediaSelect from '../shared/use-media-select';
import { withDefaultMinHeight } from './min-height';

export const BACKGROUND = 'supe/container-background';

const FADER = 'supe/fader';
const IMAGE = [ 'image' ];
const VIDEO = [ 'video' ];

/**
 * @param {Object} background             The background block.
 * @param {Object} background.attributes
 * @param {Array}  background.innerBlocks
 * @return {string} What it is, for the panel.
 */
const label = ( { attributes, innerBlocks } ) => {
    if ( attributes.type === 'block' ) {
        const count = innerBlocks[ 0 ]?.innerBlocks.length ?? 0;

        return count
            ? sprintf(
                  /* translators: %d: number of images. */
                  _n(
                      'Fader (%d image)',
                      'Fader (%d images)',
                      count,
                      'supe-editor'
                  ),
                  count
              )
            : __( 'Fader (no images)', 'supe-editor' );
    }
    if ( attributes.type === 'video' ) {
        return attributes.mediaId
            ? __( 'Video', 'supe-editor' )
            : __( 'Video (none chosen)', 'supe-editor' );
    }
    return attributes.mediaId
        ? __( 'Image', 'supe-editor' )
        : __( 'Image (none chosen)', 'supe-editor' );
};

/**
 * The attachment to show as the background's thumbnail: the image, a
 * video's poster, a fader's first image.
 *
 * @param {?Object} background
 * @return {number|undefined} Attachment ID.
 */
const thumbnailIdOf = ( background ) => {
    const { type, mediaId, posterId } = background?.attributes ?? {};
    if ( type === 'block' ) {
        return background.innerBlocks[ 0 ]?.innerBlocks[ 0 ]?.attributes.id;
    }
    return type === 'video' ? posterId : mediaId;
};

/**
 * Adds, shows and removes the Container's background. Choosing an image, a
 * video or a fader's images inserts the background block first in the
 * Container (locked in place) and selects it, so its overlay settings are
 * right there; cancelling the media modal adds nothing. A fader goes inside
 * its background (locked there too) with the chosen images. A Container without a min height gets 400px (desktop),
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
    const isVideo = background?.attributes.type === 'video';
    const thumbnailId = thumbnailIdOf( background );
    const thumbnail = useSelect(
        ( select ) =>
            thumbnailId
                ? thumbnailOf( select( coreStore ).getMedia( thumbnailId ) )
                : null,
        [ thumbnailId ]
    );

    const insert = ( block ) =>
        registry.batch( () => {
            const supe = withDefaultMinHeight(
                registry
                    .select( blockEditorStore )
                    .getBlockAttributes( clientId )?.supe
            );

            if ( supe ) {
                updateBlockAttributes( clientId, { supe } );
            }

            insertBlock( block, 0, clientId );
        } );

    const add = ( type ) => ( media ) =>
        insert(
            createBlock( BACKGROUND, {
                type,
                mediaId: media.id,
                lock: { move: true },
            } )
        );

    const addFader = useMediaSelect( ( images ) =>
        insert(
            createBlock( BACKGROUND, { type: 'block', lock: { move: true } }, [
                createBlock(
                    FADER,
                    { lock: { move: true, remove: true } },
                    [ images ].flat().map( faderImage )
                ),
            ] )
        )
    );

    return (
        <PanelBody
            title={ __( 'Background media', 'supe-editor' ) }
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
                            <span className="supe-container-background-panel__thumbnail">
                                { isVideo && <Icon icon={ videoIcon } /> }
                            </span>
                        ) }
                        <span>{ label( background ) }</span>
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
                            'Remove the background, with its media and overlay?',
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
                        <Flex justify="flex-start" gap={ 2 } wrap>
                            <MediaUpload
                                allowedTypes={ IMAGE }
                                onSelect={ add( 'image' ) }
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
                            <MediaUpload
                                allowedTypes={ VIDEO }
                                onSelect={ add( 'video' ) }
                                render={ ( { open } ) => (
                                    <Button
                                        variant="secondary"
                                        size="compact"
                                        onClick={ open }
                                    >
                                        { __( 'Add video', 'supe-editor' ) }
                                    </Button>
                                ) }
                            />
                            <MediaUpload
                                allowedTypes={ IMAGE }
                                multiple
                                gallery
                                onSelect={ addFader }
                                render={ ( { open } ) => (
                                    <Button
                                        variant="secondary"
                                        size="compact"
                                        onClick={ open }
                                    >
                                        { __( 'Add fader', 'supe-editor' ) }
                                    </Button>
                                ) }
                            />
                        </Flex>
                    </MediaUploadCheck>
                </>
            ) }
        </PanelBody>
    );
}
