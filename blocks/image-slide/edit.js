import {
    BlockControls,
    MediaPlaceholder,
    MediaReplaceFlow,
    useBlockProps,
} from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const ALLOWED_TYPES = [ 'image' ];

/**
 * One image from the media library. Only the attachment ID is stored; the
 * markup (srcset, alt) is built at render time so library edits flow
 * through.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 */
export default function Edit( { attributes, setAttributes } ) {
    const { id } = attributes;
    const media = useSelect(
        ( select ) => ( id ? select( coreStore ).getMedia( id ) : null ),
        [ id ]
    );
    const blockProps = useBlockProps( { className: 'supe-slides__slide' } );
    const onSelect = ( image ) => setAttributes( { id: image.id } );

    if ( ! id ) {
        return (
            <div { ...blockProps }>
                <MediaPlaceholder
                    icon="format-image"
                    labels={ { title: __( 'Image slide', 'supe-editor' ) } }
                    accept="image/*"
                    allowedTypes={ ALLOWED_TYPES }
                    onSelect={ onSelect }
                />
            </div>
        );
    }

    const src =
        media?.media_details?.sizes?.large?.source_url ?? media?.source_url;

    return (
        <>
            <BlockControls group="other">
                <MediaReplaceFlow
                    mediaId={ id }
                    accept="image/*"
                    allowedTypes={ ALLOWED_TYPES }
                    onSelect={ onSelect }
                    name={ __( 'Replace', 'supe-editor' ) }
                />
            </BlockControls>
            <div { ...blockProps }>
                { src ? (
                    <img
                        className="supe-slides__image"
                        src={ src }
                        alt={ media.alt_text }
                    />
                ) : (
                    <Spinner />
                ) }
            </div>
        </>
    );
}
