import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
    const { content, variant } = attributes;

    const blockProps = useBlockProps.save( {
        className: `supe-callout is-variant-${ variant }`,
    } );

    return (
        <div { ...blockProps }>
            <RichText.Content
                tagName="p"
                className="supe-callout__content"
                value={ content }
            />
        </div>
    );
}
