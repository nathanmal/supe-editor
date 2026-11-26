import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Edits the slide's name: core block renaming's `metadata.name`, so this,
 * List View rename and the slider's slide list all show the same value.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   [props.placeholder] What's used while unnamed.
 */
export default function SlideNamePanel( {
    attributes,
    setAttributes,
    placeholder,
} ) {
    const { metadata } = attributes;

    return (
        <PanelBody title={ __( 'Slide', 'supe-editor' ) }>
            <TextControl
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                label={ __( 'Slide name', 'supe-editor' ) }
                value={ metadata?.name ?? '' }
                placeholder={ placeholder }
                onChange={ ( name ) =>
                    setAttributes( {
                        metadata: { ...metadata, name: name || undefined },
                    } )
                }
                help={ __(
                    'Shown in the slide list and List View, and read out by screen readers.',
                    'supe-editor'
                ) }
            />
        </PanelBody>
    );
}
