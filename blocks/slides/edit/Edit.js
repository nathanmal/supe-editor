import {
    BlockControls,
    InspectorControls,
    store as blockEditorStore,
    useBlockProps,
    useInnerBlocksProps,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import AddImages from './AddImages';
import ImageDefaultsPanel from './ImageDefaultsPanel';
import SlideList from './SlideList';
import TypePanel from './TypePanel';
import TypePicker from './TypePicker';

/**
 * The slider's root. Until a type is chosen it shows the variation picker;
 * after that it holds the locked track (controls areas come with phase 5).
 * The canvas shows one slide at a time — the one holding the selection —
 * and the sidebar lists the slides (SlideList); no editing UI is drawn in
 * the canvas.
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
    const activeSlide = slides[ activeIndex ];

    const blockProps = useBlockProps( {
        className: type ? `supe-slides is-type-${ type }` : 'supe-slides',
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
                { trackClientId && (
                    <SlideList
                        trackClientId={ trackClientId }
                        type={ type }
                        slides={ slides }
                        activeIndex={ activeIndex }
                        setActiveId={ setActiveId }
                        showAll={ showAll }
                        setShowAll={ setShowAll }
                    />
                ) }
                { type === 'images' && (
                    <ImageDefaultsPanel
                        imageDefaults={ imageDefaults }
                        setAttributes={ setAttributes }
                    />
                ) }
            </InspectorControls>
            <div { ...innerBlocksProps }>
                { ! showAll && activeSlide && (
                    // Hides every other slide of this track only (direct
                    // children), so nested sliders keep their own state.
                    <style>
                        { `#block-${ trackClientId } > .supe-slides__slide:not(#block-${ activeSlide.clientId }){display:none}` }
                    </style>
                ) }
                { children }
            </div>
        </>
    );
}
