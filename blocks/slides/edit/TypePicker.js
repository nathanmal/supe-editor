import {
    // Core's own placeholder for picking a variation (Columns uses it); no
    // stable equivalent yet.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalBlockVariationPicker as BlockVariationPicker,
    store as blockEditorStore,
} from '@wordpress/block-editor';
import {
    createBlocksFromInnerBlocksTemplate,
    store as blocksStore,
} from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Shown on insert: pick the slide type (a block variation), which sets
 * `type` and creates the track with starter slides.
 *
 * @param {Object}   props
 * @param {string}   props.clientId
 * @param {string}   props.name
 * @param {Function} props.setAttributes
 */
export default function TypePicker( { clientId, name, setAttributes } ) {
    const { blockType, variations } = useSelect(
        ( select ) => ( {
            blockType: select( blocksStore ).getBlockType( name ),
            variations: select( blocksStore ).getBlockVariations(
                name,
                'block'
            ),
        } ),
        [ name ]
    );
    const { replaceInnerBlocks } = useDispatch( blockEditorStore );

    const onSelect = ( variation = variations[ 0 ] ) => {
        setAttributes( variation.attributes );
        replaceInnerBlocks(
            clientId,
            createBlocksFromInnerBlocksTemplate( variation.innerBlocks ),
            true
        );
    };

    return (
        <BlockVariationPicker
            icon={ blockType?.icon?.src }
            label={ blockType?.title }
            instructions={ __( 'Choose what the slides show.', 'supe-editor' ) }
            variations={ variations }
            onSelect={ onSelect }
        />
    );
}
