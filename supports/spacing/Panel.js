import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import {
    ResponsiveControl,
    SpacingSizeControl,
    ViewportSwitcher,
    VIEWPORTS,
    hasOwnValue,
    useViewport,
} from '@supe-editor/components';
import { editorSettings } from '../_framework/settings';

const PROPERTIES = [
    { key: 'padding', label: __( 'Padding', 'supe-editor' ) },
    {
        key: 'margin',
        label: __( 'Margin', 'supe-editor' ),
        allowNegative: true,
    },
];

/**
 * Responsive padding and margin: one viewport switcher (shared with the
 * editor's device preview) for both controls.
 *
 * @param {Object}   props
 * @param {Object}   props.value    `{ padding, margin }`, each keyed by viewport.
 * @param {Function} props.onChange Called with the updated value.
 */
export default function SpacingPanel( { value, onChange } ) {
    const [ viewport, setViewport ] = useViewport();
    const { breakpoints } = editorSettings();
    const overridden = VIEWPORTS.slice( 1 ).filter( ( name ) =>
        PROPERTIES.some( ( { key } ) => hasOwnValue( value[ key ], name ) )
    );

    return (
        <PanelBody
            title={ __( 'Responsive spacing', 'supe-editor' ) }
            className="supe-spacing-panel"
        >
            <ViewportSwitcher
                viewport={ viewport }
                onChange={ setViewport }
                overridden={ overridden }
                breakpoints={ breakpoints }
            />
            { PROPERTIES.map( ( { key, label, allowNegative } ) => (
                <ResponsiveControl
                    key={ key }
                    label={ label }
                    value={ value[ key ] }
                    onChange={ ( next ) =>
                        onChange( { ...value, [ key ]: next } )
                    }
                    inheritPerKey
                    showSwitcher={ false }
                    hideLabelFromVision
                >
                    { ( {
                        viewport: current,
                        value: sides,
                        onChange: setSides,
                    } ) => (
                        <SpacingSizeControl
                            // Core's control picks its layout (linked or
                            // per side) from the values it mounts with.
                            key={ current }
                            label={ label }
                            values={ sides }
                            onChange={ setSides }
                            allowNegative={ allowNegative }
                        />
                    ) }
                </ResponsiveControl>
            ) ) }
        </PanelBody>
    );
}
