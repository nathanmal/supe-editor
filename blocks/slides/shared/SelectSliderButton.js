import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import icon from '../icon';

/**
 * A slide's way back to its slider: clicking the slider in the canvas
 * selects the slide under the pointer, and the slide list lives on the
 * slider's sidebar. An icon button with a tooltip; sidebar.scss lifts it
 * beside the block card's title (BlockCard's own `controls` slot isn't open
 * to blocks).
 *
 * @param {Object} props
 * @param {string} props.clientId The slide's client ID.
 */
export default function SelectSliderButton( { clientId } ) {
    const sliderId = useSelect(
        ( select ) =>
            select( blockEditorStore ).getBlockParentsByBlockName(
                clientId,
                'supe/slides',
                true
            )[ 0 ],
        [ clientId ]
    );
    const { selectBlock } = useDispatch( blockEditorStore );

    if ( ! sliderId ) {
        return null;
    }

    return (
        <div className="supe-slides-select-slider">
            <Button
                size="small"
                icon={ icon }
                label={ __( 'Select slider', 'supe-editor' ) }
                onClick={ () => selectBlock( sliderId ) }
            />
        </div>
    );
}
