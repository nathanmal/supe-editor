import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
    CAPTION_POSITION_OPTIONS,
    FIT_OPTIONS,
    IMAGE_DEFAULTS,
} from '../shared/image-settings';
import useImageSizeOptions from '../shared/use-image-size-options';

/**
 * Defaults for every image slide in this slider; each slide can override
 * them. Stored in `imageDefaults` and passed down as block context.
 *
 * @param {Object}   props
 * @param {Object}   props.imageDefaults
 * @param {Function} props.setAttributes
 */
export default function ImageDefaultsPanel( { imageDefaults, setAttributes } ) {
    const sizeOptions = useImageSizeOptions();
    const value = { ...IMAGE_DEFAULTS, ...imageDefaults };
    const update = ( key ) => ( next ) =>
        setAttributes( { imageDefaults: { ...imageDefaults, [ key ]: next } } );

    return (
        <PanelBody title={ __( 'Image defaults', 'supe-editor' ) }>
            <SelectControl
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                label={ __( 'Image size', 'supe-editor' ) }
                value={ value.size }
                options={ sizeOptions }
                onChange={ update( 'size' ) }
            />
            <SelectControl
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                label={ __( 'Fit', 'supe-editor' ) }
                value={ value.fit }
                options={ FIT_OPTIONS }
                onChange={ update( 'fit' ) }
            />
            <SelectControl
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                label={ __( 'Caption', 'supe-editor' ) }
                value={ value.captionPosition }
                options={ CAPTION_POSITION_OPTIONS }
                onChange={ update( 'captionPosition' ) }
            />
            <ToggleControl
                __nextHasNoMarginBottom
                label={ __( 'Open images in a lightbox', 'supe-editor' ) }
                help={ __(
                    'Clicking an image shows it full size, with the slider’s other images. Linked images open their link instead.',
                    'supe-editor'
                ) }
                checked={ !! imageDefaults?.lightbox }
                onChange={ update( 'lightbox' ) }
            />
        </PanelBody>
    );
}
