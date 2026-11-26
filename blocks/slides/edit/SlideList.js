import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Button, Icon, PanelBody, ToggleControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp, dragHandle, plus } from '@wordpress/icons';

import { dropIndex } from '../shared/drop-index';
import AddImages from './AddImages';

/** Drag data type, so the editor's own drop zones ignore row drags. */
const DRAG_TYPE = 'application/x-supe-slide';

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
 * The slider's slides in the sidebar, in order: drag a row (or use its
 * up/down buttons) to reorder, click it to select that slide block. Adds
 * slides (content) or images (media library), and toggles whether the canvas
 * shows every slide or just the selected one.
 *
 * @param {Object}   props
 * @param {string}   props.trackClientId
 * @param {string}   props.type
 * @param {Array}    props.slides        The track's slide blocks.
 * @param {number}   props.activeIndex   The slide shown in the canvas.
 * @param {Function} props.setActiveId
 * @param {boolean}  props.showAll
 * @param {Function} props.setShowAll
 */
export default function SlideList( {
    trackClientId,
    type,
    slides,
    activeIndex,
    setActiveId,
    showAll,
    setShowAll,
} ) {
    const [ drag, setDrag ] = useState( null );
    const { insertBlock, moveBlockToPosition, selectBlock } =
        useDispatch( blockEditorStore );

    const imageIds = slides
        .map( ( slide ) => slide.attributes.id )
        .filter( Boolean );
    const media = useSelect(
        ( select ) =>
            Object.fromEntries(
                imageIds.map( ( id ) => [
                    id,
                    select( coreStore ).getMedia( id ),
                ] )
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- by value.
        [ imageIds.join() ]
    );

    const move = ( from, to ) => {
        if ( to < 0 || to >= slides.length || from === to ) {
            return;
        }
        moveBlockToPosition(
            slides[ from ].clientId,
            trackClientId,
            trackClientId,
            to
        );
    };

    const rowDragProps = ( index ) => ( {
        draggable: true,
        onDragStart: ( event ) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData( DRAG_TYPE, String( index ) );
            setDrag( { from: index, over: null, before: true } );
        },
        onDragOver: ( event ) => {
            if ( ! drag ) {
                return;
            }
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            const rect = event.currentTarget.getBoundingClientRect();
            const before = event.clientY < rect.top + rect.height / 2;
            if ( drag.over !== index || drag.before !== before ) {
                setDrag( { ...drag, over: index, before } );
            }
        },
        onDrop: ( event ) => {
            if ( ! drag ) {
                return;
            }
            event.preventDefault();
            move( drag.from, dropIndex( drag.from, index, drag.before ) );
            setDrag( null );
        },
        onDragEnd: () => setDrag( null ),
    } );

    // The indicator is hidden where the drop wouldn't move anything.
    const indicatorClass = ( index ) => {
        if (
            ! drag ||
            drag.over !== index ||
            dropIndex( drag.from, index, drag.before ) === drag.from
        ) {
            return null;
        }

        return drag.before ? 'is-drop-before' : 'is-drop-after';
    };

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
            { slides.length > 0 && (
                <ol className="supe-slides-list">
                    { slides.map( ( slide, index ) => {
                        const image = media[ slide.attributes.id ];
                        const thumbnail =
                            image?.media_details?.sizes?.thumbnail
                                ?.source_url ?? image?.source_url;
                        const label = slideLabel( slide, index + 1, image );
                        const isShown = ! showAll && index === activeIndex;

                        return (
                            <li
                                key={ slide.clientId }
                                className={ [
                                    'supe-slides-list__row',
                                    isShown && 'is-shown',
                                    drag?.from === index && 'is-dragging',
                                    indicatorClass( index ),
                                ]
                                    .filter( Boolean )
                                    .join( ' ' ) }
                                { ...rowDragProps( index ) }
                            >
                                <Icon
                                    className="supe-slides-list__handle"
                                    icon={ dragHandle }
                                />
                                { /* A div, not a <button>: browsers won't
                                   start a drag that begins on a button. */ }
                                <div
                                    role="button"
                                    tabIndex={ 0 }
                                    className="supe-slides-list__select"
                                    aria-current={ isShown || undefined }
                                    title={ label }
                                    onClick={ () =>
                                        selectBlock( slide.clientId )
                                    }
                                    onKeyDown={ ( event ) => {
                                        if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                        ) {
                                            event.preventDefault();
                                            selectBlock( slide.clientId );
                                        }
                                    } }
                                >
                                    <span className="supe-slides-list__number">
                                        { index + 1 }
                                    </span>
                                    { thumbnail && (
                                        <img src={ thumbnail } alt="" />
                                    ) }
                                    <span className="supe-slides-list__name">
                                        { label }
                                    </span>
                                </div>
                                <Button
                                    size="small"
                                    icon={ chevronUp }
                                    label={ sprintf(
                                        /* translators: %s: slide label. */
                                        __( 'Move up: %s', 'supe-editor' ),
                                        label
                                    ) }
                                    showTooltip={ false }
                                    disabled={ index === 0 }
                                    accessibleWhenDisabled
                                    onClick={ () => move( index, index - 1 ) }
                                />
                                <Button
                                    size="small"
                                    icon={ chevronDown }
                                    label={ sprintf(
                                        /* translators: %s: slide label. */
                                        __( 'Move down: %s', 'supe-editor' ),
                                        label
                                    ) }
                                    showTooltip={ false }
                                    disabled={ index === slides.length - 1 }
                                    accessibleWhenDisabled
                                    onClick={ () => move( index, index + 1 ) }
                                />
                            </li>
                        );
                    } ) }
                </ol>
            ) }
            <div className="supe-slides-list__add">{ addButton }</div>
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
