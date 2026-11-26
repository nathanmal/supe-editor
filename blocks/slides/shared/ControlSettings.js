import { store as blockEditorStore } from '@wordpress/block-editor';
import {
    AlignmentMatrixControl,
    BaseControl,
    PanelBody,
    // No stable segmented control in @wordpress/components yet.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControl as ToggleGroupControl,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { AREAS, POSITIONS } from './controls';
import SelectSliderButton from './SelectSliderButton';
import useControlAreas from './use-control-areas';

/**
 * A control's sidebar: which area it's in (over or below the slides), its
 * cell in the overlay, and anything of its own (`children`).
 *
 * @param {Object}   props
 * @param {string}   props.clientId
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   props.defaultPosition
 * @param {Element}  [props.children]
 */
export default function ControlSettings( {
    clientId,
    attributes,
    setAttributes,
    defaultPosition,
    children,
} ) {
    const { sliderId, areaName } = useSelect(
        ( select ) => {
            const {
                getBlockName,
                getBlockParentsByBlockName,
                getBlockRootClientId,
            } = select( blockEditorStore );
            const parent = getBlockName( getBlockRootClientId( clientId ) );

            return {
                sliderId: getBlockParentsByBlockName(
                    clientId,
                    'supe/slides',
                    true
                )[ 0 ],
                areaName: Object.keys( AREAS ).find(
                    ( name ) => AREAS[ name ] === parent
                ),
            };
        },
        [ clientId ]
    );
    const { move } = useControlAreas( sliderId );
    const position = POSITIONS.includes( attributes.position )
        ? attributes.position
        : defaultPosition;

    return (
        <>
            <SelectSliderButton clientId={ clientId } />
            <PanelBody title={ __( 'Control', 'supe-editor' ) }>
                <div className="supe-slides-panel">
                    <ToggleGroupControl
                        __next40pxDefaultSize
                        __nextHasNoMarginBottom
                        isBlock
                        label={ __( 'Show', 'supe-editor' ) }
                        value={ areaName }
                        onChange={ ( name ) => move( clientId, name ) }
                    >
                        <ToggleGroupControlOption
                            value="overlay"
                            label={ __( 'Over the slides', 'supe-editor' ) }
                        />
                        <ToggleGroupControlOption
                            value="bar"
                            label={ __( 'Below', 'supe-editor' ) }
                        />
                    </ToggleGroupControl>
                    { areaName === 'overlay' && (
                        <BaseControl
                            __nextHasNoMarginBottom
                            id={ `supe-slides-position-${ clientId }` }
                            label={ __( 'Position', 'supe-editor' ) }
                            help={ __(
                                'Margin moves it from there; controls in the same spot overlap.',
                                'supe-editor'
                            ) }
                        >
                            <AlignmentMatrixControl
                                id={ `supe-slides-position-${ clientId }` }
                                value={ position.replace( '-', ' ' ) }
                                onChange={ ( next ) =>
                                    setAttributes( {
                                        position: next.replace( ' ', '-' ),
                                    } )
                                }
                            />
                        </BaseControl>
                    ) }
                    { children }
                </div>
            </PanelBody>
        </>
    );
}
