import { __ } from '@wordpress/i18n';

import SelectParentButton from '../../shared/SelectParentButton';
import icon from '../icon';

/**
 * A slide's or control's way back to its slider.
 *
 * @param {Object} props
 * @param {string} props.clientId
 */
export default function SelectSliderButton( { clientId } ) {
    return (
        <SelectParentButton
            clientId={ clientId }
            parentName="supe/slides"
            label={ __( 'Select slider', 'supe-editor' ) }
            icon={ icon }
        />
    );
}
