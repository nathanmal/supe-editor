import {
    MediaUpload,
    MediaUploadCheck,
    store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

import { imageSlideAttributes } from '../shared/image-settings';
import useMediaSelect from '../shared/use-media-select';

const ALLOWED_TYPES = [ 'image' ];

/**
 * Opens the media library's gallery flow (pick several, then reorder) and
 * appends one image slide per chosen image to the track, in that order —
 * the same flow as the image slide placeholder. Renders whatever `render` returns,
 * given `open` (a toolbar button, a navigator button, …).
 *
 * @param {Object}   props
 * @param {string}   props.trackClientId
 * @param {Function} props.render        ( { open } ) => element.
 * @param {Function} [props.onAdded]     Called with the new slides' client IDs.
 */
export default function AddImages( { trackClientId, render, onAdded } ) {
    const slideCount = useSelect(
        ( select ) => select( blockEditorStore ).getBlockCount( trackClientId ),
        [ trackClientId ]
    );
    const { insertBlocks } = useDispatch( blockEditorStore );

    const onSelect = useMediaSelect( ( images ) => {
        const blocks = [ images ]
            .flat()
            .map( ( image ) =>
                createBlock( 'supe/image-slide', imageSlideAttributes( image ) )
            );
        insertBlocks( blocks, slideCount, trackClientId, false );
        onAdded?.( blocks.map( ( block ) => block.clientId ) );
    } );

    return (
        <MediaUploadCheck>
            <MediaUpload
                allowedTypes={ ALLOWED_TYPES }
                gallery
                multiple
                onSelect={ onSelect }
                render={ render }
            />
        </MediaUploadCheck>
    );
}
