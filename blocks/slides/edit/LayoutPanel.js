import {
    PanelBody,
    RangeControl,
    // No stable segmented control in @wordpress/components yet.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControl as ToggleGroupControl,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
    ResponsiveControl,
    SpacingSizeControl,
    ViewportSwitcher,
    VIEWPORTS,
    hasOwnValue,
    useViewport,
} from '@supe-editor/components';

import { editorSettings } from '../../../supports/_framework/settings';
import HeightControl from './HeightControl';

const RESPONSIVE = [ 'perView', 'gap', 'height' ];

/**
 * Slides per view, gap and height, each per viewport. One viewport switcher
 * (synced with the editor's device preview) serves all three.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 */
export default function LayoutPanel( { attributes, setAttributes } ) {
    const { perView, gap, height, heightTarget = 'slider' } = attributes;
    const [ viewport, setViewport ] = useViewport();
    const { breakpoints } = editorSettings();
    const overridden = VIEWPORTS.slice( 1 ).filter( ( name ) =>
        RESPONSIVE.some( ( key ) => hasOwnValue( attributes[ key ], name ) )
    );

    return (
        <PanelBody title={ __( 'Layout', 'supe-editor' ) }>
            <div className="supe-slides-layout">
                <ViewportSwitcher
                    viewport={ viewport }
                    onChange={ setViewport }
                    overridden={ overridden }
                    breakpoints={ breakpoints }
                />
                <ResponsiveControl
                    label={ __( 'Columns', 'supe-editor' ) }
                    value={ perView }
                    onChange={ ( next ) => setAttributes( { perView: next } ) }
                    showSwitcher={ false }
                    hideLabelFromVision
                >
                    { ( { value, inherited, onChange } ) => (
                        <RangeControl
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                            label={ __( 'Columns', 'supe-editor' ) }
                            help={ __(
                                'Slides shown side by side.',
                                'supe-editor'
                            ) }
                            min={ 1 }
                            max={ 12 }
                            value={ value }
                            initialPosition={ inherited ?? 1 }
                            onChange={ onChange }
                        />
                    ) }
                </ResponsiveControl>
                <ResponsiveControl
                    label={ __( 'Gap', 'supe-editor' ) }
                    value={ gap }
                    onChange={ ( next ) => setAttributes( { gap: next } ) }
                    showSwitcher={ false }
                    hideLabelFromVision
                >
                    { ( { viewport: current, value, onChange } ) => (
                        <SpacingSizeControl
                            // Core's control picks its layout from the values
                            // it mounts with.
                            key={ current }
                            label={ __( 'Gap', 'supe-editor' ) }
                            sides={ [ 'top' ] }
                            showSideInLabel={ false }
                            values={ value ? { top: value } : {} }
                            onChange={ ( next ) => onChange( next?.top ) }
                        />
                    ) }
                </ResponsiveControl>
                <ToggleGroupControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    isBlock
                    label={ __( 'Height applies to', 'supe-editor' ) }
                    value={ heightTarget }
                    onChange={ ( next ) =>
                        setAttributes( {
                            heightTarget:
                                next === 'slide' ? 'slide' : undefined,
                        } )
                    }
                >
                    <ToggleGroupControlOption
                        value="slider"
                        label={ __( 'Slider', 'supe-editor' ) }
                    />
                    <ToggleGroupControlOption
                        value="slide"
                        label={ __( 'Each slide', 'supe-editor' ) }
                    />
                </ToggleGroupControl>
                <ResponsiveControl
                    label={ __( 'Height', 'supe-editor' ) }
                    value={ height }
                    onChange={ ( next ) => setAttributes( { height: next } ) }
                    showSwitcher={ false }
                    hideLabelFromVision
                >
                    { ( { value, inherited, onChange } ) => (
                        <HeightControl
                            value={ value }
                            inherited={ inherited }
                            target={ heightTarget }
                            onChange={ onChange }
                        />
                    ) }
                </ResponsiveControl>
            </div>
        </PanelBody>
    );
}
