import { __ } from '@wordpress/i18n';
import {
    PanelBody,
    // No stable unit control in @wordpress/components yet.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalUnitControl as UnitControl,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import {
    ResponsiveControl,
    ViewportSwitcher,
    VIEWPORTS,
    hasOwnValue,
    useViewport,
} from '@supe-editor/components';
import { editorSettings } from '../_framework/settings';

/** Units the sanitizer accepts for a min height (its `spacing` type). */
const UNITS = [ 'px', 'vh', 'vw', 'rem', 'em', '%' ];

/**
 * Responsive min height. `0` is the way to drop an inherited min height on a
 * smaller viewport.
 *
 * @param {Object}   props
 * @param {Object}   props.value    `{ minHeight }`, keyed by viewport.
 * @param {Function} props.onChange Called with the updated value.
 */
export default function DimensionsPanel( { value, onChange } ) {
    const [ viewport, setViewport ] = useViewport();
    const { breakpoints } = editorSettings();
    const units = useCustomUnits( { availableUnits: UNITS } );

    return (
        <PanelBody
            title={ __( 'Responsive dimensions', 'supe-editor' ) }
            className="supe-dimensions-panel"
        >
            <ViewportSwitcher
                viewport={ viewport }
                onChange={ setViewport }
                overridden={ VIEWPORTS.slice( 1 ).filter( ( name ) =>
                    hasOwnValue( value.minHeight, name )
                ) }
                breakpoints={ breakpoints }
            />
            <ResponsiveControl
                label={ __( 'Minimum height', 'supe-editor' ) }
                value={ value.minHeight }
                onChange={ ( minHeight ) =>
                    onChange( { ...value, minHeight } )
                }
                showSwitcher={ false }
                hideLabelFromVision
            >
                { ( { value: current, inherited, onChange: setCurrent } ) => (
                    <UnitControl
                        __next40pxDefaultSize
                        label={ __( 'Minimum height', 'supe-editor' ) }
                        value={ current ?? '' }
                        placeholder={ inherited }
                        units={ units }
                        min={ 0 }
                        // A cleared number comes back as '' or a bare unit.
                        onChange={ ( next ) =>
                            setCurrent(
                                /^\.?\d/.test( next ?? '' ) ? next : undefined
                            )
                        }
                    />
                ) }
            </ResponsiveControl>
        </PanelBody>
    );
}
