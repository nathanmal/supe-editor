import {
    InspectorControls,
    store as blockEditorStore,
    useBlockProps,
} from '@wordpress/block-editor';
import {
    // No stable segmented control in @wordpress/components yet.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControl as ToggleGroupControl,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import ControlSettings from './ControlSettings';
import { ArrowIcon } from './ControlIcon';
import { CustomIcon, CustomIconControl } from './CustomIcon';
import { ARROW_SETS, arrowSet, positionClass } from './controls';
import useControlAreas from './use-control-areas';

const ARROW_LABELS = {
    chevron: __( 'Chevron', 'supe-editor' ),
    arrow: __( 'Arrow', 'supe-editor' ),
    caret: __( 'Caret', 'supe-editor' ),
    line: __( 'Thin chevron', 'supe-editor' ),
};

const ARROW_BLOCKS = [ 'supe/slides-prev', 'supe/slides-next' ];

/**
 * The previous / next button's editor: the same button render.php outputs
 * (it doesn't navigate here — clicking selects it), plus its settings. The
 * arrow set is shared: changing it on one arrow changes the other too.
 *
 * @param {string} action          `prev` or `next`.
 * @param {string} defaultPosition Its block.json default cell.
 * @return {Function} The block's edit component.
 */
export default function arrowEdit( action, defaultPosition ) {
    return function Edit( { attributes, setAttributes, clientId } ) {
        const set = arrowSet( attributes.arrows );
        const sliderId = useSelect(
            ( select ) =>
                select( blockEditorStore ).getBlockParentsByBlockName(
                    clientId,
                    'supe/slides',
                    true
                )[ 0 ],
            [ clientId ]
        );
        const { controls } = useControlAreas( sliderId );
        const { updateBlockAttributes } = useDispatch( blockEditorStore );
        const blockProps = useBlockProps( {
            className: [
                'supe-slides__button',
                `supe-slides__${ action }`,
                positionClass( attributes, defaultPosition ),
            ].join( ' ' ),
        } );

        return (
            <>
                <InspectorControls>
                    <ControlSettings
                        clientId={ clientId }
                        attributes={ attributes }
                        setAttributes={ setAttributes }
                        defaultPosition={ defaultPosition }
                    >
                        <ToggleGroupControl
                            __next40pxDefaultSize
                            __nextHasNoMarginBottom
                            isBlock
                            label={ __( 'Arrows', 'supe-editor' ) }
                            help={
                                attributes.iconId
                                    ? __(
                                          'The custom arrow below is used instead.',
                                          'supe-editor'
                                      )
                                    : __(
                                          'Applies to both arrows.',
                                          'supe-editor'
                                      )
                            }
                            value={ set }
                            onChange={ ( arrows ) =>
                                updateBlockAttributes(
                                    controls( ARROW_BLOCKS ).map(
                                        ( block ) => block.clientId
                                    ),
                                    { arrows }
                                )
                            }
                        >
                            { ARROW_SETS.map( ( name ) => (
                                <ToggleGroupControlOptionIcon
                                    key={ name }
                                    value={ name }
                                    icon={ <ArrowIcon set={ name } /> }
                                    label={ ARROW_LABELS[ name ] }
                                />
                            ) ) }
                        </ToggleGroupControl>
                        <CustomIconControl
                            label={ __( 'Custom arrow', 'supe-editor' ) }
                            help={ __(
                                'An SVG pointing right, to the next slide; the previous arrow is turned around. Applies to both arrows.',
                                'supe-editor'
                            ) }
                            value={ attributes.iconId }
                            onChange={ ( iconId ) =>
                                updateBlockAttributes(
                                    controls( ARROW_BLOCKS ).map(
                                        ( block ) => block.clientId
                                    ),
                                    { iconId }
                                )
                            }
                        />
                    </ControlSettings>
                </InspectorControls>
                <div { ...blockProps }>
                    <CustomIcon
                        id={ attributes.iconId }
                        className="supe-slides__icon"
                        fallback={ <ArrowIcon set={ set } /> }
                    />
                </div>
            </>
        );
    };
}
