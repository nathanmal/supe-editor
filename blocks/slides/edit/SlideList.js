import { createBlock } from '@wordpress/blocks';
import { Button, PanelBody, ToggleControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';

import SortableBlockList from '../../shared/SortableBlockList';
import useMedia, { thumbnailOf } from '../../shared/use-media';
import AddImages from './AddImages';

/**
 * A slide's label, with the same fallbacks as the front end: its name, then
 * (image slides) the alt text and library title, then "Slide N".
 *
 * @param {Object}  slide
 * @param {number}  position
 * @param {?Object} media
 * @return {string} Row label.
 */
function slideLabel( slide, position, media ) {
    return (
        slide.attributes.metadata?.name ||
        slide.attributes.alt ||
        media?.alt_text ||
        media?.title?.rendered ||
        /* translators: %d: slide position. */
        sprintf( __( 'Slide %d', 'supe-editor' ), position )
    );
}

/**
 * The slider's slides in the sidebar (blocks/shared/SortableBlockList):
 * reorder, select, and the canvas follows a moved slide. Adds slides
 * (content) or images (media library), and toggles whether the canvas shows
 * every slide or just the current view.
 *
 * @param {Object}   props
 * @param {string}   props.trackClientId
 * @param {string}   props.type
 * @param {Array}    props.slides         The track's slide blocks.
 * @param {string[]} props.shownClientIds The slides the canvas shows.
 * @param {Function} props.setActiveId
 * @param {boolean}  props.showAll
 * @param {Function} props.setShowAll
 */
export default function SlideList( {
    trackClientId,
    type,
    slides,
    shownClientIds,
    setActiveId,
    showAll,
    setShowAll,
} ) {
    const { insertBlock } = useDispatch( blockEditorStore );
    const media = useMedia(
        slides.map( ( slide ) => slide.attributes.id ).filter( Boolean )
    );

    const addButton =
        type === 'images' ? (
            <AddImages
                trackClientId={ trackClientId }
                onAdded={ ( [ first ] ) => setActiveId( first ) }
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
        ) : (
            <Button
                __next40pxDefaultSize
                variant="secondary"
                icon={ plus }
                onClick={ () => {
                    const block = createBlock( 'supe/slide', {}, [
                        createBlock( 'core/paragraph' ),
                    ] );
                    insertBlock( block, slides.length, trackClientId, false );
                    setActiveId( block.clientId );
                } }
            >
                { __( 'Add slide', 'supe-editor' ) }
            </Button>
        );

    return (
        <PanelBody
            title={
                type === 'images'
                    ? __( 'Images', 'supe-editor' )
                    : __( 'Content', 'supe-editor' )
            }
        >
            <SortableBlockList
                rootClientId={ trackClientId }
                blocks={ slides }
                label={ ( slide, position ) =>
                    slideLabel( slide, position, media[ slide.attributes.id ] )
                }
                thumbnail={ ( slide ) =>
                    thumbnailOf( media[ slide.attributes.id ] )
                }
                isHighlighted={ ( slide ) =>
                    shownClientIds.includes( slide.clientId )
                }
                // Show the moved slide in its new place in the canvas.
                onMove={ ( slide ) => setActiveId( slide.clientId ) }
            />
            <div className="supe-block-list__add">{ addButton }</div>
            <ToggleControl
                __nextHasNoMarginBottom
                label={ __( 'Show all slides in the editor', 'supe-editor' ) }
                help={
                    showAll
                        ? undefined
                        : __(
                              'The editor shows the selected slide.',
                              'supe-editor'
                          )
                }
                checked={ showAll }
                onChange={ setShowAll }
            />
        </PanelBody>
    );
}
