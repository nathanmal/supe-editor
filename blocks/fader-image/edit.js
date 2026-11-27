import {
    BlockControls,
    InspectorControls,
    MediaPlaceholder,
    MediaReplaceFlow,
    useBlockProps,
} from '@wordpress/block-editor';
import {
    Button,
    FocalPointPicker,
    PanelBody,
    Spinner,
    TextareaControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

import icon from '../fader/icon';
import SelectParentButton from '../shared/SelectParentButton';

const ALLOWED_TYPES = [ 'image' ];

/**
 * One fader image: the image covering the fader as on the front end, with
 * its focal point and alt text in the sidebar, Replace in the toolbar, and
 * a way back to the fader beside the block card's title.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   props.clientId
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
    const { id, alt, focalPoint } = attributes;
    const media = useSelect(
        ( select ) => ( id ? select( coreStore ).getMedia( id ) : null ),
        [ id ]
    );
    const src = media?.source_url;
    const blockProps = useBlockProps( { className: 'supe-fader__slide' } );
    const backToFader = (
        <SelectParentButton
            clientId={ clientId }
            parentName="supe/fader"
            label={ __( 'Select fader', 'supe-editor' ) }
            icon={ icon }
        />
    );

    if ( ! id ) {
        return (
            <>
                <InspectorControls>{ backToFader }</InspectorControls>
                <div { ...blockProps }>
                    <MediaPlaceholder
                        icon="format-image"
                        labels={ { title: __( 'Fader image', 'supe-editor' ) } }
                        accept="image/*"
                        allowedTypes={ ALLOWED_TYPES }
                        onSelect={ ( image ) =>
                            setAttributes( { id: image.id } )
                        }
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <BlockControls group="other">
                <MediaReplaceFlow
                    mediaId={ id }
                    accept="image/*"
                    allowedTypes={ ALLOWED_TYPES }
                    onSelect={ ( image ) =>
                        setAttributes( {
                            id: image.id,
                            focalPoint: undefined,
                            alt: undefined,
                        } )
                    }
                    name={ __( 'Replace', 'supe-editor' ) }
                />
            </BlockControls>
            <InspectorControls>
                { backToFader }
                <PanelBody title={ __( 'Image', 'supe-editor' ) }>
                    <div className="supe-fader-panel">
                        { src && (
                            <FocalPointPicker
                                __nextHasNoMarginBottom
                                label={ __( 'Focal point', 'supe-editor' ) }
                                help={ __(
                                    'The part of the image kept in view when the fader is a different shape.',
                                    'supe-editor'
                                ) }
                                url={ src }
                                value={ focalPoint ?? { x: 0.5, y: 0.5 } }
                                onChange={ ( value ) =>
                                    setAttributes( { focalPoint: value } )
                                }
                            />
                        ) }
                        { focalPoint && (
                            <Button
                                variant="link"
                                onClick={ () =>
                                    setAttributes( { focalPoint: undefined } )
                                }
                            >
                                { __( 'Reset focal point', 'supe-editor' ) }
                            </Button>
                        ) }
                        <TextareaControl
                            __nextHasNoMarginBottom
                            label={ __( 'Alternative text', 'supe-editor' ) }
                            value={ alt ?? '' }
                            onChange={ ( value ) =>
                                setAttributes( { alt: value || undefined } )
                            }
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
                    </div>
                </PanelBody>
            </InspectorControls>
            <figure { ...blockProps }>
                { src ? (
                    <img
                        className="supe-fader__image"
                        src={ src }
                        alt={ alt || media?.alt_text || '' }
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
                ) : (
                    <Spinner />
                ) }
            </figure>
        </>
    );
}
