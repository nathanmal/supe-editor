import {
    InspectorControls,
    MediaPlaceholder,
    store as blockEditorStore,
    useBlockProps,
    useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import useMediaSelect from '../../shared/use-media-select';
import icon from '../icon';
import { timing } from '../timing';
import { faderImage } from './fader-image';
import ImagesPanel from './ImagesPanel';
import TimingPanel from './TimingPanel';
import usePreview from './use-preview';

const ALLOWED_TYPES = [ 'image' ];

/**
 * The canvas shows one image — or, mid-preview, the one fading in over the
 * one before. Only this fader's own images (direct children). The fade is
 * an animation from transparent: it starts whenever an image becomes the
 * one fading in, even when it was the opaque one underneath until then.
 *
 * @param {string}       clientId   The fader.
 * @param {string}       shownId    The image showing.
 * @param {string|false} previousId The image it fades in over, if any.
 * @param {number}       fade       Milliseconds.
 * @return {string} CSS.
 */
function canvasStyles( clientId, shownId, previousId, fade ) {
    const slide = ( id ) => `#block-${ clientId } > #block-${ id }`;
    const hidden = [ shownId, previousId ]
        .filter( Boolean )
        .map( ( id ) => `:not(#block-${ id })` )
        .join( '' );
    let css = `#block-${ clientId } > .supe-fader__slide${ hidden }{display:none}`;

    if ( previousId ) {
        const animation = `supe-fader-preview ${ fade }ms ease-in-out`;

        css += `${ slide( previousId ) }{z-index:1}`;
        css += `${ slide( shownId ) }{z-index:2;animation:${ animation }}`;
    }

    return css;
}

/**
 * The fader's root. Empty, it asks for images (the one prompt drawn in the
 * canvas); after that the canvas shows a single image — the first, or the
 * one being edited — and the sidebar lists them (ImagesPanel).
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   props.clientId
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
    const { images, selectedImageId } = useSelect(
        ( select ) => {
            const { getBlocks, getBlockParents, getSelectedBlockClientId } =
                select( blockEditorStore );
            const children = getBlocks( clientId );
            const selected = getSelectedBlockClientId();
            const path = selected
                ? [ selected, ...getBlockParents( selected ) ]
                : [];

            return {
                images: children,
                selectedImageId: children.find( ( child ) =>
                    path.includes( child.clientId )
                )?.clientId,
            };
        },
        [ clientId ]
    );
    const { insertBlocks } = useDispatch( blockEditorStore );
    const onSelect = useMediaSelect( ( chosen ) =>
        insertBlocks( [ chosen ].flat().map( faderImage ), 0, clientId, false )
    );

    const { duration, fade } = timing( attributes );
    const preview = usePreview(
        images.map( ( image ) => image.clientId ),
        { duration, fade }
    );
    const { setPlaying } = preview;

    // Editing an image shows that one, so the preview stops there.
    useEffect( () => {
        if ( selectedImageId ) {
            setPlaying( false );
        }
    }, [ selectedImageId, setPlaying ] );

    const shownId = selectedImageId ?? preview.active ?? images[ 0 ]?.clientId;
    const previousId = ! selectedImageId && preview.active && preview.previous;
    const blockProps = useBlockProps( {
        className: 'supe-fader',
        style: { '--supe-fader-fade': `${ fade }ms` },
    } );
    const { children, ...innerBlocksProps } = useInnerBlocksProps( blockProps, {
        allowedBlocks: [ 'supe/fader-image' ],
        renderAppender: false,
    } );

    if ( images.length === 0 ) {
        // `children` still renders (empty): it's what registers the allowed
        // blocks, and without it the images chosen here can't be inserted.
        return (
            <div { ...innerBlocksProps }>
                <MediaPlaceholder
                    icon={ icon }
                    labels={ {
                        title: __( 'Fader', 'supe-editor' ),
                        instructions: __(
                            'Choose the images to fade between.',
                            'supe-editor'
                        ),
                    } }
                    accept="image/*"
                    allowedTypes={ ALLOWED_TYPES }
                    multiple
                    onSelect={ onSelect }
                />
                { children }
            </div>
        );
    }

    return (
        <>
            <InspectorControls>
                <ImagesPanel
                    clientId={ clientId }
                    images={ images }
                    shownId={ shownId }
                />
                <TimingPanel
                    attributes={ attributes }
                    setAttributes={ setAttributes }
                    preview={ preview }
                    count={ images.length }
                />
            </InspectorControls>
            <div { ...innerBlocksProps }>
                { shownId && (
                    <style>
                        { canvasStyles( clientId, shownId, previousId, fade ) }
                    </style>
                ) }
                { children }
            </div>
        </>
    );
}
