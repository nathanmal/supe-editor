import { Button, PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pause, play } from '@wordpress/icons';

import { DURATION, FADE, timing } from '../timing';

/**
 * How long each image shows and how long the fade takes, in seconds here
 * (stored as milliseconds), and a button that plays them in the canvas
 * (use-preview.js) when there's more than one image.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {Object}   props.preview       From usePreview().
 * @param {number}   props.count         How many images there are.
 */
export default function TimingPanel( {
    attributes,
    setAttributes,
    preview,
    count,
} ) {
    const { duration, fade } = timing( attributes );
    const toMs = ( seconds ) =>
        seconds === undefined ? undefined : Math.round( seconds * 1000 );

    return (
        <PanelBody title={ __( 'Timing', 'supe-editor' ) }>
            <div className="supe-fader-panel">
                <RangeControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    label={ __(
                        'Show each image for (seconds)',
                        'supe-editor'
                    ) }
                    min={ DURATION[ 0 ] / 1000 }
                    max={ 30 }
                    step={ 0.5 }
                    value={ duration / 1000 }
                    onChange={ ( seconds ) =>
                        setAttributes( { duration: toMs( seconds ) } )
                    }
                />
                <RangeControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    label={ __( 'Fade (seconds)', 'supe-editor' ) }
                    help={ __(
                        'How long one image takes to fade into the next. Visitors who prefer reduced motion see the first image only.',
                        'supe-editor'
                    ) }
                    min={ FADE[ 0 ] / 1000 }
                    max={ 5 }
                    step={ 0.1 }
                    value={ fade / 1000 }
                    onChange={ ( seconds ) =>
                        setAttributes( { fade: toMs( seconds ) } )
                    }
                />
                { count > 1 && (
                    <div>
                        <Button
                            __next40pxDefaultSize
                            variant="secondary"
                            icon={ preview.playing ? pause : play }
                            onClick={ () =>
                                preview.setPlaying( ! preview.playing )
                            }
                        >
                            { preview.playing
                                ? __( 'Stop preview', 'supe-editor' )
                                : __( 'Play preview', 'supe-editor' ) }
                        </Button>
                    </div>
                ) }
            </div>
        </PanelBody>
    );
}
