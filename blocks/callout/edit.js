import { __ } from '@wordpress/i18n';
import {
    useBlockProps,
    RichText,
    InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';

const VARIANTS = [
    { label: __( 'Info', 'supe-editor' ), value: 'info' },
    { label: __( 'Success', 'supe-editor' ), value: 'success' },
    { label: __( 'Warning', 'supe-editor' ), value: 'warning' },
    { label: __( 'Danger', 'supe-editor' ), value: 'danger' },
];

export default function Edit( { attributes, setAttributes } ) {
    const { content, variant } = attributes;

    const blockProps = useBlockProps( {
        className: `supe-callout is-variant-${ variant }`,
    } );

    return (
        <>
            <InspectorControls>
                <PanelBody title={ __( 'Callout Settings', 'supe-editor' ) }>
                    <SelectControl
                        label={ __( 'Variant', 'supe-editor' ) }
                        value={ variant }
                        options={ VARIANTS }
                        onChange={ ( value ) =>
                            setAttributes( { variant: value } )
                        }
                    />
                </PanelBody>
            </InspectorControls>
            <div { ...blockProps }>
                <RichText
                    tagName="p"
                    className="supe-callout__content"
                    value={ content }
                    onChange={ ( value ) =>
                        setAttributes( { content: value } )
                    }
                    placeholder={ __( 'Write your callout…', 'supe-editor' ) }
                />
            </div>
        </>
    );
}
