import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { background } from '@wordpress/icons';

import SelectParentButton from '../../shared/SelectParentButton';
import useBackgroundParent from './use-background-parent';

/**
 * For a block inside a Container background: "Select background" beside the
 * block card's title, and a note that its size settings don't apply there.
 * Nothing for the same block elsewhere.
 *
 * @param {Object} props
 * @param {string} props.clientId
 */
export default function BackgroundBlockNotice( { clientId } ) {
    if ( ! useBackgroundParent( clientId ) ) {
        return null;
    }

    return (
        <>
            <SelectParentButton
                clientId={ clientId }
                parentName="supe/container-background"
                label={ __( 'Select background', 'supe-editor' ) }
                icon={ background }
            />
            <Notice
                status="info"
                isDismissible={ false }
                className="supe-container-background-notice"
            >
                { __(
                    'As a background, this fills the container: its own aspect ratio, minimum height and margins don’t apply. Set the size on the container.',
                    'supe-editor'
                ) }
            </Notice>
        </>
    );
}
