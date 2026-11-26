import {
    PanelBody,
    RangeControl,
    ToggleControl,
    // No stable segmented control in @wordpress/components yet.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControl as ToggleGroupControl,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { getTransition } from '../engine/transitions';
import { DELAY } from '../shared/config';

/**
 * How the slider moves: loop, step, arrow keys and autoplay.
 *
 * @param {Object}   props
 * @param {Object}   props.config        From configFrom().
 * @param {Object}   props.autoplay      The stored attribute.
 * @param {Function} props.setAttributes
 */
export default function PlaybackPanel( {
    config,
    autoplay = {},
    setAttributes,
} ) {
    const { pageOnly } = getTransition( config.transition.name );
    const updateAutoplay = ( changes ) =>
        setAttributes( { autoplay: { ...autoplay, ...changes } } );

    return (
        <PanelBody title={ __( 'Playback', 'supe-editor' ) }>
            <div className="supe-slides-panel">
                <ToggleControl
                    __nextHasNoMarginBottom
                    label={ __( 'Loop', 'supe-editor' ) }
                    help={ __(
                        'After the last slide, carry on from the first.',
                        'supe-editor'
                    ) }
                    checked={ config.loop }
                    onChange={ ( loop ) => setAttributes( { loop } ) }
                />
                <ToggleGroupControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    isBlock
                    label={ __( 'Move by', 'supe-editor' ) }
                    help={
                        pageOnly
                            ? __(
                                  'This effect moves a whole view at a time when it shows more than one slide.',
                                  'supe-editor'
                              )
                            : undefined
                    }
                    value={ config.step }
                    onChange={ ( step ) => setAttributes( { step } ) }
                >
                    <ToggleGroupControlOption
                        value="slide"
                        label={ __( 'One slide', 'supe-editor' ) }
                    />
                    <ToggleGroupControlOption
                        value="page"
                        label={ __( 'Whole view', 'supe-editor' ) }
                    />
                </ToggleGroupControl>
                <ToggleControl
                    __nextHasNoMarginBottom
                    label={ __( 'Arrow keys', 'supe-editor' ) }
                    help={ __(
                        'Arrow keys move the slider while it has focus.',
                        'supe-editor'
                    ) }
                    checked={ config.keyboard }
                    onChange={ ( keyboard ) => setAttributes( { keyboard } ) }
                />
                <ToggleControl
                    __nextHasNoMarginBottom
                    label={ __( 'Autoplay', 'supe-editor' ) }
                    help={ __(
                        'Pauses while the slider has focus or is off screen, and for visitors who prefer reduced motion.',
                        'supe-editor'
                    ) }
                    checked={ config.autoplay.enabled }
                    onChange={ ( enabled ) => updateAutoplay( { enabled } ) }
                />
                { config.autoplay.enabled && (
                    <>
                        <RangeControl
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                            label={ __( 'Delay (seconds)', 'supe-editor' ) }
                            min={ DELAY[ 0 ] / 1000 }
                            max={ DELAY[ 1 ] / 1000 }
                            step={ 0.5 }
                            value={ config.autoplay.delay / 1000 }
                            onChange={ ( seconds ) =>
                                updateAutoplay( {
                                    delay:
                                        seconds === undefined
                                            ? undefined
                                            : Math.round( seconds * 1000 ),
                                } )
                            }
                        />
                        <ToggleControl
                            __nextHasNoMarginBottom
                            label={ __( 'Pause on hover', 'supe-editor' ) }
                            checked={ config.autoplay.pauseOnHover }
                            onChange={ ( pauseOnHover ) =>
                                updateAutoplay( { pauseOnHover } )
                            }
                        />
                    </>
                ) }
            </div>
        </PanelBody>
    );
}
