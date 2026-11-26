import {
    BlockControls,
    InspectorControls,
    store as blockEditorStore,
    useBlockProps,
    useInnerBlocksProps,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useViewport } from '@supe-editor/components';

import { configClasses, configFrom } from '../shared/config';
import { layoutOutput, perViewAt, viewRange } from '../shared/layout';
import AddImages from './AddImages';
import ControlsPanel from './ControlsPanel';
import ImageDefaultsPanel from './ImageDefaultsPanel';
import InteractionPanel from './InteractionPanel';
import LayoutPanel from './LayoutPanel';
import PostsPanel from './PostsPanel';
import PlaybackPanel from './PlaybackPanel';
import SlideList from './SlideList';
import TransitionPanel from './TransitionPanel';
import TypePanel from './TypePanel';
import TypePicker from './TypePicker';

/**
 * The slider's root. Until a type is chosen it shows the variation picker;
 * after that it holds the locked track and any control areas (overlay, bar).
 * The canvas previews the real layout (per view, gap, height for the device
 * preview's viewport, direction) showing the view that holds the selected
 * slide, without the engine (nothing moves in the editor); the
 * sidebar lists the slides (SlideList). No editing UI is drawn in the
 * canvas.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   props.clientId
 * @param {string}   props.name
 */
export default function Edit( { attributes, setAttributes, clientId, name } ) {
    const { type, imageDefaults } = attributes;
    const [ activeId, setActiveId ] = useState( null );
    const [ showAll, setShowAll ] = useState( false );

    const { trackClientId, slides, selectedSlideId } = useSelect(
        ( select ) => {
            const { getBlocks, getBlockParents, getSelectedBlockClientId } =
                select( blockEditorStore );
            const track = getBlocks( clientId ).find(
                ( block ) => block.name === 'supe/slides-track'
            );
            const trackSlides = track?.innerBlocks ?? [];
            const selectedId = getSelectedBlockClientId();
            const path = selectedId
                ? [ selectedId, ...getBlockParents( selectedId ) ]
                : [];

            return {
                trackClientId: track?.clientId,
                slides: trackSlides,
                selectedSlideId: trackSlides.find( ( slide ) =>
                    path.includes( slide.clientId )
                )?.clientId,
            };
        },
        [ clientId ]
    );

    // Selecting a block inside a slide (canvas or List View) shows that slide.
    useEffect( () => {
        if ( selectedSlideId ) {
            setActiveId( selectedSlideId );
        }
    }, [ selectedSlideId ] );

    const activeIndex = Math.max(
        0,
        slides.findIndex( ( slide ) => slide.clientId === activeId )
    );

    // The view holding the active slide, at the previewed viewport. It
    // stays put while the active slide is still in it, so a reorder shows
    // the slides changing places rather than the view jumping.
    const [ viewport ] = useViewport();
    const viewStart = useRef( null );
    const [ firstShown, lastShown ] = viewRange(
        slides.length,
        activeIndex,
        perViewAt( attributes.perView, viewport ),
        viewStart.current
    );
    viewStart.current = firstShown;
    // Post slides aren't blocks: the editor shows the query's posts as a
    // strip (editor.scss) rather than a view.
    const shownSlides =
        showAll || type === 'posts'
            ? []
            : slides.slice( firstShown, lastShown + 1 );

    const layout = layoutOutput( attributes );
    const config = configFrom( attributes );
    const blockProps = useBlockProps( {
        className: [
            'supe-slides',
            type && `is-type-${ type }`,
            ...layout.classes,
            ...configClasses( config ),
            showAll && 'is-showing-all',
        ]
            .filter( Boolean )
            .join( ' ' ),
        style: layout.styles,
    } );
    const { children, ...innerBlocksProps } = useInnerBlocksProps( blockProps, {
        renderAppender: false,
    } );

    if ( ! type ) {
        return (
            <div { ...blockProps }>
                <TypePicker
                    clientId={ clientId }
                    name={ name }
                    setAttributes={ setAttributes }
                />
            </div>
        );
    }

    return (
        <>
            { type === 'images' && trackClientId && (
                <BlockControls group="other">
                    <AddImages
                        trackClientId={ trackClientId }
                        onAdded={ ( [ first ] ) => setActiveId( first ) }
                        render={ ( { open } ) => (
                            <ToolbarButton onClick={ open }>
                                { __( 'Add images', 'supe-editor' ) }
                            </ToolbarButton>
                        ) }
                    />
                </BlockControls>
            ) }
            <InspectorControls>
                <TypePanel
                    clientId={ clientId }
                    type={ type }
                    setAttributes={ setAttributes }
                />
                { trackClientId && type === 'posts' && (
                    <PostsPanel trackClientId={ trackClientId } />
                ) }
                { trackClientId && type !== 'posts' && (
                    <SlideList
                        trackClientId={ trackClientId }
                        type={ type }
                        slides={ slides }
                        shownClientIds={ shownSlides.map(
                            ( slide ) => slide.clientId
                        ) }
                        setActiveId={ setActiveId }
                        showAll={ showAll }
                        setShowAll={ setShowAll }
                    />
                ) }
                <LayoutPanel
                    attributes={ attributes }
                    vertical={ configClasses( config ).includes(
                        'is-vertical'
                    ) }
                    setAttributes={ setAttributes }
                />
                <PlaybackPanel
                    config={ config }
                    autoplay={ attributes.autoplay }
                    setAttributes={ setAttributes }
                />
                <TransitionPanel
                    config={ config }
                    transition={ attributes.transition }
                    setAttributes={ setAttributes }
                />
                <InteractionPanel
                    config={ config }
                    drag={ attributes.drag }
                    setAttributes={ setAttributes }
                />
                <ControlsPanel
                    clientId={ clientId }
                    autoplay={ config.autoplay.enabled }
                />
                { type === 'images' && (
                    <ImageDefaultsPanel
                        imageDefaults={ imageDefaults }
                        setAttributes={ setAttributes }
                    />
                ) }
            </InspectorControls>
            <div { ...innerBlocksProps }>
                { shownSlides.length > 0 && (
                    // Hides the slides outside the view, in this track only
                    // (direct children), so nested sliders keep their own.
                    <style>
                        { `#block-${ trackClientId } > .supe-slides__slide${ shownSlides
                            .map(
                                ( slide ) => `:not(#block-${ slide.clientId })`
                            )
                            .join( '' ) }{display:none}` }
                    </style>
                ) }
                { children }
            </div>
        </>
    );
}
