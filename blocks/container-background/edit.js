import {
    BlockControls,
    InspectorControls,
    MediaReplaceFlow,
    useBlockProps,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import {
    PanelBody,
    RangeControl,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToolsPanel as ToolsPanel,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { group } from '@wordpress/icons';

import SelectParentButton from '../shared/SelectParentButton';
import { thumbnailOf } from '../shared/use-media';
import ControlIcon from '../slides/shared/ControlIcon';
import { icons } from '../slides/shared/controls';
import FocalPoint from './edit/FocalPoint';
import VideoPanel from './edit/VideoPanel';
import { DEFAULT_OPACITY, fromStored, overlay, toStored } from './overlay';

/**
 * Presets from the multiple-origin lists (theme, default, custom).
 *
 * @param {Array}  origins
 * @param {string} key     `colors` or `gradients`.
 * @return {Array} Flat list of presets.
 */
const flatten = ( origins = [], key ) =>
    origins.flatMap( ( origin ) => origin[ key ] ?? [ origin ] );

/**
 * CSS declarations as a React style object.
 *
 * @param {?Object<string, string>} declarations
 * @return {Object|undefined} Style.
 */
const toStyle = ( declarations ) =>
    declarations
        ? Object.fromEntries(
              Object.entries( declarations ).map( ( [ property, value ] ) => [
                  property.replace( /-([a-z])/g, ( _, letter ) =>
                      letter.toUpperCase()
                  ),
                  value,
              ] )
          )
        : undefined;

/**
 * The background layer as on the front end (image or playing video +
 * overlay under the container's content, and a video's pause button if
 * on), with the media settings and overlay in the sidebar, Replace in the
 * toolbar, and a way back to the container beside the block card's title.
 * Added and removed from the Container's Background panel; the type is
 * chosen there and kept (Replace picks the same kind of media).
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   props.clientId
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
    const {
        mediaId,
        posterId,
        focalPoint,
        pauseButton,
        overlayColor,
        overlayGradient,
    } = attributes;
    const isVideo = attributes.type === 'video';
    const overlayOpacity = attributes.overlayOpacity ?? DEFAULT_OPACITY;
    const { src, poster, posterThumbnail } = useSelect(
        ( select ) => {
            const { getMedia } = select( coreStore );
            const posterMedia = posterId ? getMedia( posterId ) : null;

            return {
                src: mediaId ? getMedia( mediaId )?.source_url : null,
                poster: posterMedia?.source_url ?? null,
                posterThumbnail: thumbnailOf( posterMedia ),
            };
        },
        [ mediaId, posterId ]
    );
    const reducedMotion = useReducedMotion();
    const colorSettings = useMultipleOriginColorsAndGradients();
    const colors = flatten( colorSettings.colors, 'colors' );
    const gradients = flatten( colorSettings.gradients, 'gradients' );
    const overlayStyle = overlay( attributes );
    const blockProps = useBlockProps( {
        className: [
            isVideo ? 'is-video' : 'is-image',
            ! mediaId && 'is-empty',
        ]
            .filter( Boolean )
            .join( ' ' ),
    } );
    const position = focalPoint
        ? {
              objectPosition: `${ focalPoint.x * 100 }% ${
                  focalPoint.y * 100
              }%`,
          }
        : undefined;
    const allowedTypes = [ isVideo ? 'video' : 'image' ];

    const resetOverlay = () =>
        setAttributes( {
            overlayColor: undefined,
            overlayGradient: undefined,
            overlayOpacity: DEFAULT_OPACITY,
        } );

    const onSelectMedia = ( media ) =>
        setAttributes( { mediaId: media.id, focalPoint: undefined } );

    return (
        <>
            <BlockControls group="other">
                <MediaReplaceFlow
                    mediaId={ mediaId }
                    accept={ isVideo ? 'video/*' : 'image/*' }
                    allowedTypes={ allowedTypes }
                    onSelect={ onSelectMedia }
                    name={ ( () => {
                        if ( mediaId ) {
                            return __( 'Replace', 'supe-editor' );
                        }
                        return isVideo
                            ? __( 'Choose video', 'supe-editor' )
                            : __( 'Choose image', 'supe-editor' );
                    } )() }
                />
            </BlockControls>
            <InspectorControls>
                <SelectParentButton
                    clientId={ clientId }
                    parentName="supe-container/container"
                    label={ __( 'Select container', 'supe-editor' ) }
                    icon={ group }
                />
                { isVideo ? (
                    <VideoPanel
                        attributes={ attributes }
                        setAttributes={ setAttributes }
                        src={ src }
                        posterSrc={ posterThumbnail }
                    />
                ) : (
                    <PanelBody title={ __( 'Image', 'supe-editor' ) }>
                        { src ? (
                            <FocalPoint
                                url={ src }
                                focalPoint={ focalPoint }
                                onChange={ ( value ) =>
                                    setAttributes( { focalPoint: value } )
                                }
                            />
                        ) : (
                            <p>
                                { __(
                                    'Choose an image from the toolbar.',
                                    'supe-editor'
                                ) }
                            </p>
                        ) }
                    </PanelBody>
                ) }
                <ToolsPanel
                    label={ __( 'Overlay', 'supe-editor' ) }
                    panelId={ clientId }
                    resetAll={ resetOverlay }
                    className="supe-container-background-overlay"
                >
                    <ColorGradientSettingsDropdown
                        __experimentalIsRenderedInSidebar
                        settings={ [
                            {
                                label: __( 'Color', 'supe-editor' ),
                                colorValue: fromStored(
                                    overlayColor,
                                    colors,
                                    'color'
                                ),
                                gradientValue: fromStored(
                                    overlayGradient,
                                    gradients,
                                    'gradient'
                                ),
                                onColorChange: ( value ) =>
                                    setAttributes( {
                                        overlayColor: toStored(
                                            value,
                                            colors,
                                            'color'
                                        ),
                                    } ),
                                onGradientChange: ( value ) =>
                                    setAttributes( {
                                        overlayGradient: toStored(
                                            value,
                                            gradients,
                                            'gradient'
                                        ),
                                    } ),
                                isShownByDefault: true,
                                hasValue: () =>
                                    !! overlayColor || !! overlayGradient,
                                onDeselect: () =>
                                    setAttributes( {
                                        overlayColor: undefined,
                                        overlayGradient: undefined,
                                    } ),
                                clearable: true,
                            },
                        ] }
                        panelId={ clientId }
                        { ...colorSettings }
                    />
                    <ToolsPanelItem
                        label={ __( 'Opacity', 'supe-editor' ) }
                        isShownByDefault
                        hasValue={ () => overlayOpacity !== DEFAULT_OPACITY }
                        onDeselect={ () =>
                            setAttributes( { overlayOpacity: DEFAULT_OPACITY } )
                        }
                        panelId={ clientId }
                    >
                        <RangeControl
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                            label={ __( 'Opacity', 'supe-editor' ) }
                            value={ overlayOpacity }
                            onChange={ ( value ) =>
                                setAttributes( {
                                    overlayOpacity: value ?? DEFAULT_OPACITY,
                                } )
                            }
                            min={ 0 }
                            max={ 100 }
                            step={ 5 }
                            disabled={ ! overlayStyle }
                            help={
                                overlayStyle
                                    ? undefined
                                    : __(
                                          'Pick an overlay color or gradient first.',
                                          'supe-editor'
                                      )
                            }
                        />
                    </ToolsPanelItem>
                </ToolsPanel>
            </InspectorControls>
            <div { ...blockProps }>
                <div
                    className="wp-block-supe-container-background__media"
                    aria-hidden="true"
                >
                    { src && isVideo && (
                        <video
                            className="wp-block-supe-container-background__video"
                            src={ src }
                            poster={ poster ?? undefined }
                            style={ position }
                            autoPlay={ ! reducedMotion }
                            muted
                            loop
                            playsInline
                        />
                    ) }
                    { src && ! isVideo && (
                        <img
                            className="wp-block-supe-container-background__image"
                            src={ src }
                            alt=""
                            style={ position }
                        />
                    ) }
                </div>
                { overlayStyle && (
                    <span
                        className="wp-block-supe-container-background__overlay"
                        style={ toStyle( overlayStyle ) }
                        aria-hidden="true"
                    />
                ) }
                { isVideo && pauseButton && (
                    // The front end's button, as a picture of it: clicking
                    // it selects the background.
                    <span className="wp-block-supe-container-background__pause">
                        <ControlIcon
                            paths={ icons.pause }
                            className="wp-block-supe-container-background__icon is-pause"
                        />
                    </span>
                ) }
            </div>
        </>
    );
}
