import { Button, PanelBody } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';

import AddImages from '../../shared/AddImages';
import SortableBlockList from '../../shared/SortableBlockList';
import useMedia, { thumbnailOf } from '../../shared/use-media';
import { faderImage } from './fader-image';

/**
 * The fader's images in the sidebar, in the order they show: drag or move
 * to reorder (the first is the one the page starts with), click to edit
 * one, remove, or add more.
 *
 * @param {Object} props
 * @param {string} props.clientId The fader.
 * @param {Array}  props.images   Its image blocks.
 * @param {string} props.shownId  The image the canvas shows.
 */
export default function ImagesPanel( { clientId, images, shownId } ) {
    const media = useMedia(
        images.map( ( image ) => image.attributes.id ).filter( Boolean )
    );

    return (
        <PanelBody title={ __( 'Images', 'supe-editor' ) }>
            <SortableBlockList
                rootClientId={ clientId }
                blocks={ images }
                removable
                label={ ( image, position ) => {
                    const item = media[ image.attributes.id ];

                    return (
                        image.attributes.alt ||
                        item?.alt_text ||
                        item?.title?.rendered ||
                        /* translators: %d: image position. */
                        sprintf( __( 'Image %d', 'supe-editor' ), position )
                    );
                } }
                thumbnail={ ( image ) =>
                    thumbnailOf( media[ image.attributes.id ] )
                }
                isHighlighted={ ( image ) => image.clientId === shownId }
            />
            <div className="supe-block-list__add">
                <AddImages
                    rootClientId={ clientId }
                    createFor={ faderImage }
                    render={ ( { open } ) => (
                        <Button
                            __next40pxDefaultSize
                            variant="secondary"
                            icon={ plus }
                            onClick={ open }
                        >
                            { __( 'Add images', 'supe-editor' ) }
                        </Button>
                    ) }
                />
            </div>
        </PanelBody>
    );
}
