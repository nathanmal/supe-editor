import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import {
    BaseControl,
    Button,
    Flex,
    PanelBody,
    ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import FocalPoint from './FocalPoint';

const POSTER_TYPES = [ 'image' ];

/**
 * Video settings: focal point, poster image and the optional pause button.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {?string}  props.src           The video's URL, once loaded.
 * @param {?string}  props.posterSrc     The poster's thumbnail, once loaded.
 */
export default function VideoPanel( {
    attributes,
    setAttributes,
    src,
    posterSrc,
} ) {
    const { focalPoint, posterId, pauseButton } = attributes;

    return (
        <PanelBody title={ __( 'Video', 'supe-editor' ) }>
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
                    { __( 'Choose a video from the toolbar.', 'supe-editor' ) }
                </p>
            ) }
            <BaseControl
                __nextHasNoMarginBottom
                id="supe-container-background-poster"
                label={ __( 'Poster image', 'supe-editor' ) }
                help={ __(
                    'Shown while the video loads, and instead of it for visitors who prefer reduced motion. Without one, the first frame shows.',
                    'supe-editor'
                ) }
                className="supe-container-background-poster"
            >
                <MediaUploadCheck>
                    <Flex justify="flex-start" gap={ 2 }>
                        { posterId && (
                            <img
                                className="supe-container-background-poster__thumbnail"
                                src={ posterSrc ?? undefined }
                                alt=""
                            />
                        ) }
                        <MediaUpload
                            allowedTypes={ POSTER_TYPES }
                            value={ posterId }
                            onSelect={ ( image ) =>
                                setAttributes( { posterId: image.id } )
                            }
                            render={ ( { open } ) => (
                                <Button
                                    variant="secondary"
                                    size="compact"
                                    onClick={ open }
                                >
                                    { posterId
                                        ? __( 'Replace', 'supe-editor' )
                                        : __( 'Choose poster', 'supe-editor' ) }
                                </Button>
                            ) }
                        />
                        { posterId && (
                            <Button
                                variant="tertiary"
                                size="compact"
                                isDestructive
                                onClick={ () =>
                                    setAttributes( { posterId: undefined } )
                                }
                            >
                                { __( 'Remove', 'supe-editor' ) }
                            </Button>
                        ) }
                    </Flex>
                </MediaUploadCheck>
            </BaseControl>
            <ToggleControl
                __nextHasNoMarginBottom
                label={ __( 'Pause button', 'supe-editor' ) }
                help={ __(
                    'A button in the corner that pauses and plays the video.',
                    'supe-editor'
                ) }
                checked={ !! pauseButton }
                onChange={ ( value ) =>
                    setAttributes( { pauseButton: value } )
                }
            />
        </PanelBody>
    );
}
