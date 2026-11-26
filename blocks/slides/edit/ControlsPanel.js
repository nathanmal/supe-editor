import { store as blockEditorStore } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { AREAS } from '../shared/controls';
import useControlAreas from '../shared/use-control-areas';

const GROUPS = [
    {
        key: 'arrows',
        label: __( 'Arrows', 'supe-editor' ),
        blocks: [ 'supe/slides-prev', 'supe/slides-next' ],
    },
    {
        key: 'indicators',
        label: __( 'Indicators', 'supe-editor' ),
        blocks: [ 'supe/slides-indicators' ],
    },
    {
        key: 'pause',
        label: __( 'Pause button', 'supe-editor' ),
        blocks: [ 'supe/slides-pause' ],
    },
];

/**
 * Turns the slider's controls on and off. New controls go over the slides;
 * each control's own sidebar moves it below them or to another spot. All
 * optional — a slider used as a background can have none (the pause button
 * included: it's recommended with autoplay, not required).
 *
 * @param {Object}  props
 * @param {string}  props.clientId The slider.
 * @param {boolean} props.autoplay Whether the slider autoplays.
 */
export default function ControlsPanel( { clientId, autoplay } ) {
    const present = useSelect(
        ( select ) =>
            select( blockEditorStore )
                .getBlocks( clientId )
                .filter( ( block ) =>
                    Object.values( AREAS ).includes( block.name )
                )
                .flatMap( ( area ) =>
                    area.innerBlocks.map( ( block ) => block.name )
                ),
        [ clientId ]
    );
    const { add, remove } = useControlAreas( clientId );

    return (
        <PanelBody title={ __( 'Controls', 'supe-editor' ) }>
            <div className="supe-slides-panel">
                { GROUPS.map( ( { key, label, blocks } ) => (
                    <ToggleControl
                        key={ key }
                        __nextHasNoMarginBottom
                        label={ label }
                        help={
                            key === 'pause' && autoplay
                                ? __(
                                      'Lets visitors stop autoplay.',
                                      'supe-editor'
                                  )
                                : undefined
                        }
                        checked={ blocks.some( ( name ) =>
                            present.includes( name )
                        ) }
                        onChange={ ( on ) =>
                            on
                                ? add(
                                      blocks.filter(
                                          ( name ) => ! present.includes( name )
                                      )
                                  )
                                : remove( blocks )
                        }
                    />
                ) ) }
            </div>
        </PanelBody>
    );
}
