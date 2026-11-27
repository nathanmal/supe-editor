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
    Button,
    FocalPointPicker,
    PanelBody,
    RangeControl,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToolsPanel as ToolsPanel,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { group } from '@wordpress/icons';

import SelectParentButton from '../shared/SelectParentButton';
import { DEFAULT_OPACITY, fromStored, overlay, toStored } from './overlay';

const ALLOWED_TYPES = [ 'image' ];

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
 * The background layer as on the front end (image + overlay under the
 * container's content), with the image, focal point and overlay in the
 * sidebar, Replace in the toolbar, and a way back to the container beside
 * the block card's title. Added and removed from the Container's Background
 * panel.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   props.clientId
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
    const { mediaId, focalPoint, overlayColor, overlayGradient } = attributes;
    const overlayOpacity = attributes.overlayOpacity ?? DEFAULT_OPACITY;
    const src = useSelect(
        ( select ) =>
            mediaId
                ? select( coreStore ).getMedia( mediaId )?.source_url
                : null,
        [ mediaId ]
    );
    const colorSettings = useMultipleOriginColorsAndGradients();
    const colors = flatten( colorSettings.colors, 'colors' );
    const gradients = flatten( colorSettings.gradients, 'gradients' );
    const overlayStyle = overlay( attributes );
    const blockProps = useBlockProps( {
        className: mediaId ? undefined : 'is-empty',
    } );

    const resetOverlay = () =>
        setAttributes( {
            overlayColor: undefined,
            overlayGradient: undefined,
            overlayOpacity: DEFAULT_OPACITY,
        } );

    const onSelectImage = ( image ) =>
        setAttributes( { mediaId: image.id, focalPoint: undefined } );

    return (
        <>
            <BlockControls group="other">
                <MediaReplaceFlow
                    mediaId={ mediaId }
                    accept="image/*"
                    allowedTypes={ ALLOWED_TYPES }
                    onSelect={ onSelectImage }
                    name={
                        mediaId
                            ? __( 'Replace', 'supe-editor' )
                            : __( 'Choose image', 'supe-editor' )
                    }
                />
            </BlockControls>
            <InspectorControls>
                <SelectParentButton
                    clientId={ clientId }
                    parentName="supe-container/container"
                    label={ __( 'Select container', 'supe-editor' ) }
                    icon={ group }
                />
                <PanelBody title={ __( 'Image', 'supe-editor' ) }>
                    { src ? (
                        <>
                            <FocalPointPicker
                                __nextHasNoMarginBottom
                                label={ __( 'Focal point', 'supe-editor' ) }
                                help={ __(
                                    'The part of the image kept in view when the container is a different shape.',
                                    'supe-editor'
                                ) }
                                url={ src }
                                value={ focalPoint ?? { x: 0.5, y: 0.5 } }
                                onChange={ ( value ) =>
                                    setAttributes( { focalPoint: value } )
                                }
                            />
                            { focalPoint && (
                                <Button
                                    variant="link"
                                    onClick={ () =>
                                        setAttributes( {
                                            focalPoint: undefined,
                                        } )
                                    }
                                >
                                    { __( 'Reset focal point', 'supe-editor' ) }
                                </Button>
                            ) }
                        </>
                    ) : (
                        <p>
                            { __(
                                'Choose an image from the toolbar.',
                                'supe-editor'
                            ) }
                        </p>
                    ) }
                </PanelBody>
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
                <div className="wp-block-supe-container-background__media">
                    { src && (
                        <img
                            className="wp-block-supe-container-background__image"
                            src={ src }
                            alt=""
                            style={
                                focalPoint
                                    ? {
                                          objectPosition: `${
                                              focalPoint.x * 100
                                          }% ${ focalPoint.y * 100 }%`,
                                      }
                                    : undefined
                            }
                        />
                    ) }
                </div>
                { overlayStyle && (
                    <span
                        className="wp-block-supe-container-background__overlay"
                        style={ toStyle( overlayStyle ) }
                    />
                ) }
            </div>
        </>
    );
}
