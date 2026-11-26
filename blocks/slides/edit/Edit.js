import {
    InspectorControls,
    useBlockProps,
    useInnerBlocksProps,
} from '@wordpress/block-editor';

import TypePanel from './TypePanel';
import TypePicker from './TypePicker';

/**
 * The slider's root. Until a type is chosen it shows the variation picker;
 * after that it holds the locked track (controls areas come with phase 5).
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   props.clientId
 * @param {string}   props.name
 */
export default function Edit( { attributes, setAttributes, clientId, name } ) {
    const { type } = attributes;
    const blockProps = useBlockProps( {
        className: type ? `supe-slides is-type-${ type }` : 'supe-slides',
    } );
    const innerBlocksProps = useInnerBlocksProps( blockProps, {
        renderAppender: false,
    } );

    if ( ! type ) {
        return (
            <div { ...blockProps }>
                <TypePicker
                    clientId={ clientId }
                    name={ name }
                    setAttributes={ setAttributes }
                />
            </div>
        );
    }

    return (
        <>
            <InspectorControls>
                <TypePanel
                    clientId={ clientId }
                    type={ type }
                    setAttributes={ setAttributes }
                />
            </InspectorControls>
            <div { ...innerBlocksProps } />
        </>
    );
}
