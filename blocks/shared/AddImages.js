import {
    MediaUpload,
    MediaUploadCheck,
    store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';

import useMediaSelect from './use-media-select';

const ALLOWED_TYPES = [ 'image' ];

/**
 * Opens the media library's gallery flow (pick several, then reorder) and
 * appends one child block per chosen image to a parent, in that order.
 * Renders whatever `render` returns, given `open`.
 *
 * @param {Object}   props
 * @param {string}   props.rootClientId The parent.
 * @param {Function} props.createFor    ( image ) → the block for an image.
 * @param {Function} props.render       ( { open } ) → element.
 * @param {Function} [props.onAdded]    Called with the new blocks' client IDs.
 */
export default function AddImages( {
    rootClientId,
    createFor,
    render,
    onAdded,
} ) {
    const count = useSelect(
        ( select ) => select( blockEditorStore ).getBlockCount( rootClientId ),
        [ rootClientId ]
    );
    const { insertBlocks } = useDispatch( blockEditorStore );

    const onSelect = useMediaSelect( ( images ) => {
        const blocks = [ images ].flat().map( createFor );
        insertBlocks( blocks, count, rootClientId, false );
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
