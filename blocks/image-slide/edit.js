import {
    BlockControls,
    InspectorControls,
    MediaPlaceholder,
    MediaReplaceFlow,
    RichText,
    store as blockEditorStore,
    useBlockProps,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
    Button,
    FocalPointPicker,
    PanelBody,
    SelectControl,
    Spinner,
    TextareaControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

import {
    CAPTION_POSITION_OPTIONS,
    FIT_OPTIONS,
    LIGHTBOX_OPTIONS,
    imageSlideAttributes,
    resolveImageSettings,
    resolveLightbox,
    withDefaultOption,
} from '../slides/shared/image-settings';
import useImageSizeOptions from '../slides/shared/use-image-size-options';
import useMediaSelect from '../shared/use-media-select';
import SelectSliderButton from '../slides/shared/SelectSliderButton';
import SlideNamePanel from '../slides/shared/SlideNamePanel';
import ImageLink from './ImageLink';

const ALLOWED_TYPES = [ 'image' ];

/**
 * @param {boolean|undefined} value
 * @return {string} The lightbox select's value: `on`, `off` or '' (default).
 */
const lightboxValue = ( value ) => {
    if ( typeof value !== 'boolean' ) {
        return '';
    }

    return value ? 'on' : 'off';
};

/**
 * One image from the media library. The markup (srcset, library alt) is
 * built at render time so library edits flow through. Choosing several
 * images in the placeholder fills this slide and adds a slide for each of
 * the others after it.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {Object}   props.context
 * @param {string}   props.clientId
 * @param {boolean}  props.isSelected
 */
export default function Edit( {
    attributes,
    setAttributes,
    context,
    clientId,
    isSelected,
} ) {
    const { id, size, fit, focalPoint, alt, caption, captionPosition } =
        attributes;
    const defaults = resolveImageSettings(
        {},
        context[ 'supe/slides/imageDefaults' ]
    );
    const resolved = resolveImageSettings( attributes, defaults );
    const media = useSelect(
        ( select ) => ( id ? select( coreStore ).getMedia( id ) : null ),
        [ id ]
    );
    const sizeOptions = useImageSizeOptions();
    const { getBlockIndex, getBlockRootClientId } =
        useSelect( blockEditorStore );
    const { insertBlocks } = useDispatch( blockEditorStore );

    const onSelectImages = useMediaSelect( ( images ) => {
        const [ first, ...others ] = [ images ].flat();
        setAttributes( imageSlideAttributes( first ) );
        if ( others.length ) {
            insertBlocks(
                others.map( ( image ) =>
                    createBlock(
                        'supe/image-slide',
                        imageSlideAttributes( image )
                    )
                ),
                getBlockIndex( clientId ) + 1,
                getBlockRootClientId( clientId ),
                false
            );
        }
    } );

    // A new image gets its own library caption (if this slide has none) and
    // loses settings that only made sense for the old one.
    const onReplace = ( image ) =>
        setAttributes( {
            id: image.id,
            caption: caption || image.caption || undefined,
            focalPoint: undefined,
            alt: undefined,
        } );

    const showCaption =
        resolved.captionPosition !== 'hidden' && ( isSelected || !! caption );
    const blockProps = useBlockProps( {
        className: [
            'supe-slides__slide',
            showCaption && `has-caption-${ resolved.captionPosition }`,
        ]
            .filter( Boolean )
            .join( ' ' ),
    } );

    if ( ! id ) {
        return (
            <>
                <InspectorControls>
                    <SelectSliderButton clientId={ clientId } />
                </InspectorControls>
                <div { ...blockProps }>
                    <MediaPlaceholder
                        icon="format-image"
                        labels={ {
                            title: __( 'Image slide', 'supe-editor' ),
                            instructions: __(
                                'Choose one image, or several to add a slide for each.',
                                'supe-editor'
                            ),
                        } }
                        accept="image/*"
                        allowedTypes={ ALLOWED_TYPES }
                        multiple="add"
                        onSelect={ onSelectImages }
                    />
                </div>
            </>
        );
    }

    const src =
        media?.media_details?.sizes?.[ resolved.size ]?.source_url ??
        media?.source_url;
    const objectPosition = focalPoint
        ? `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`
        : undefined;
    const update = ( key ) => ( value ) =>
        setAttributes( { [ key ]: value || undefined } );

    return (
        <>
            <BlockControls group="other">
                <MediaReplaceFlow
                    mediaId={ id }
                    accept="image/*"
                    allowedTypes={ ALLOWED_TYPES }
                    onSelect={ onReplace }
                    name={ __( 'Replace', 'supe-editor' ) }
                />
            </BlockControls>
            <BlockControls group="block">
                <ImageLink
                    attributes={ attributes }
                    setAttributes={ setAttributes }
                />
            </BlockControls>
            <InspectorControls>
                <SelectSliderButton clientId={ clientId } />
                <SlideNamePanel
                    attributes={ attributes }
                    setAttributes={ setAttributes }
                    placeholder={
                        alt ||
                        media?.alt_text ||
                        media?.title?.rendered ||
                        undefined
                    }
                />
                <PanelBody title={ __( 'Image', 'supe-editor' ) }>
                    <SelectControl
                        __next40pxDefaultSize
                        __nextHasNoMarginBottom
                        label={ __( 'Image size', 'supe-editor' ) }
                        value={ size ?? '' }
                        options={ withDefaultOption(
                            sizeOptions,
                            defaults.size
                        ) }
                        onChange={ update( 'size' ) }
                    />
                    <SelectControl
                        __next40pxDefaultSize
                        __nextHasNoMarginBottom
                        label={ __( 'Fit', 'supe-editor' ) }
                        value={ fit ?? '' }
                        options={ withDefaultOption(
                            FIT_OPTIONS,
                            defaults.fit
                        ) }
                        onChange={ update( 'fit' ) }
                        help={ __(
                            'How the image fills its slide when the slide is a different shape.',
                            'supe-editor'
                        ) }
                    />
                    { src && (
                        <FocalPointPicker
                            __nextHasNoMarginBottom
                            label={ __( 'Focal point', 'supe-editor' ) }
                            url={ src }
                            value={ focalPoint ?? { x: 0.5, y: 0.5 } }
                            onChange={ ( value ) =>
                                setAttributes( { focalPoint: value } )
                            }
                            help={
                                focalPoint && (
                                    <Button
                                        variant="link"
                                        onClick={ () =>
                                            setAttributes( {
                                                focalPoint: undefined,
                                            } )
                                        }
                                    >
                                        { __(
                                            'Reset focal point',
                                            'supe-editor'
                                        ) }
                                    </Button>
                                )
                            }
                        />
                    ) }
                    <TextareaControl
                        __nextHasNoMarginBottom
                        label={ __( 'Alternative text', 'supe-editor' ) }
                        value={ alt ?? '' }
                        onChange={ update( 'alt' ) }
                        help={
                            media?.alt_text
                                ? sprintf(
                                      /* translators: %s: alt text from the media library. */
                                      __(
                                          'Leave empty to use the media library’s: “%s”',
                                          'supe-editor'
                                      ),
                                      media.alt_text
                                  )
                                : __(
                                      'Leave empty to use the media library’s alt text.',
                                      'supe-editor'
                                  )
                        }
                    />
                    <SelectControl
                        __next40pxDefaultSize
                        __nextHasNoMarginBottom
                        label={ __( 'Caption', 'supe-editor' ) }
                        value={ captionPosition ?? '' }
                        options={ withDefaultOption(
                            CAPTION_POSITION_OPTIONS,
                            defaults.captionPosition
                        ) }
                        onChange={ update( 'captionPosition' ) }
                    />
                    <SelectControl
                        __next40pxDefaultSize
                        __nextHasNoMarginBottom
                        label={ __( 'Lightbox', 'supe-editor' ) }
                        value={ lightboxValue( attributes.lightbox ) }
                        options={ withDefaultOption(
                            LIGHTBOX_OPTIONS,
                            lightboxValue(
                                resolveLightbox(
                                    {},
                                    context[ 'supe/slides/imageDefaults' ]
                                )
                            )
                        ) }
                        disabled={ !! attributes.href }
                        help={
                            attributes.href
                                ? __(
                                      'A linked image opens its link instead.',
                                      'supe-editor'
                                  )
                                : __(
                                      'Clicking the image shows it full size.',
                                      'supe-editor'
                                  )
                        }
                        onChange={ ( next ) =>
                            setAttributes( {
                                lightbox: next ? next === 'on' : undefined,
                            } )
                        }
                    />
                </PanelBody>
            </InspectorControls>
            <div { ...blockProps }>
                <figure className="supe-slides__figure">
                    { src ? (
                        <img
                            className="supe-slides__image"
                            src={ src }
                            alt={ alt || media.alt_text }
                            style={ {
                                objectFit: resolved.fit,
                                objectPosition,
                            } }
                        />
                    ) : (
                        <Spinner />
                    ) }
                    { showCaption && (
                        <RichText
                            tagName="figcaption"
                            className="supe-slides__caption"
                            value={ caption ?? '' }
                            onChange={ update( 'caption' ) }
                            placeholder={ __( 'Add caption', 'supe-editor' ) }
                            withoutInteractiveFormatting
                        />
                    ) }
                </figure>
            </div>
        </>
    );
}
