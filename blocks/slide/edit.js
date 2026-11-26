import {
    BlockControls,
    BlockVerticalAlignmentToolbar,
    InnerBlocks,
    store as blockEditorStore,
    useBlockProps,
    useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * A content slide: any blocks, like a Group, with vertical alignment of its
 * content within the slide's height.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   props.clientId
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
    const { verticalAlignment } = attributes;
    const hasInnerBlocks = useSelect(
        ( select ) => select( blockEditorStore ).getBlockCount( clientId ) > 0,
        [ clientId ]
    );
    const innerBlocksProps = useInnerBlocksProps(
        useBlockProps( {
            className: [
                'supe-slides__slide',
                verticalAlignment &&
                    `is-vertically-aligned-${ verticalAlignment }`,
            ]
                .filter( Boolean )
                .join( ' ' ),
        } ),
        {
            renderAppender: hasInnerBlocks
                ? undefined
                : InnerBlocks.ButtonBlockAppender,
        }
    );

    return (
        <>
            <BlockControls group="block">
                <BlockVerticalAlignmentToolbar
                    value={ verticalAlignment }
                    onChange={ ( value ) =>
                        setAttributes( { verticalAlignment: value } )
                    }
                />
            </BlockControls>
            <div { ...innerBlocksProps } />
        </>
    );
}
