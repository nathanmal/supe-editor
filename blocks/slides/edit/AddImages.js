import { createBlock } from '@wordpress/blocks';

import SharedAddImages from '../../shared/AddImages';
import { imageSlideAttributes } from '../shared/image-settings';

/**
 * Adds image slides to a track through the media library's gallery flow
 * (blocks/shared/AddImages), the same flow as the image slide placeholder.
 *
 * @param {Object}   props
 * @param {string}   props.trackClientId
 * @param {Function} props.render        ( { open } ) => element.
 * @param {Function} [props.onAdded]     Called with the new slides' client IDs.
 */
export default function AddImages( { trackClientId, render, onAdded } ) {
    return (
        <SharedAddImages
            rootClientId={ trackClientId }
            createFor={ ( image ) =>
                createBlock( 'supe/image-slide', imageSlideAttributes( image ) )
            }
            render={ render }
            onAdded={ onAdded }
        />
    );
}
