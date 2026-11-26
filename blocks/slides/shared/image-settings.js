import { __, sprintf } from '@wordpress/i18n';

/**
 * Image slide settings shared by the image slide and the slider's "Image
 * defaults" panel. Mirrors Markup::image() in PHP: a slide's own value, else
 * the slider's default, else IMAGE_DEFAULTS.
 */
export const IMAGE_DEFAULTS = {
    size: 'large',
    fit: 'cover',
    captionPosition: 'below',
};

export const FIT_OPTIONS = [
    { value: 'cover', label: __( 'Cover', 'supe-editor' ) },
    { value: 'contain', label: __( 'Contain', 'supe-editor' ) },
    { value: 'fill', label: __( 'Fill', 'supe-editor' ) },
    { value: 'none', label: __( 'None', 'supe-editor' ) },
];

export const LIGHTBOX_OPTIONS = [
    { value: 'on', label: __( 'On', 'supe-editor' ) },
    { value: 'off', label: __( 'Off', 'supe-editor' ) },
];

/**
 * Whether an image slide opens in the lightbox, like Markup::lightbox() and
 * Markup::image(): its own setting, else the slider's, else no — never
 * when it links somewhere.
 *
 * @param {Object} attributes The slide's attributes.
 * @param {Object} defaults   The slider's `imageDefaults`.
 * @return {boolean} Opens in the lightbox.
 */
export function resolveLightbox( attributes, defaults = {} ) {
    if ( attributes.href?.trim() ) {
        return false;
    }

    return (
        [ attributes.lightbox, defaults.lightbox ].find(
            ( value ) => typeof value === 'boolean'
        ) ?? false
    );
}

export const CAPTION_POSITION_OPTIONS = [
    { value: 'below', label: __( 'Below the image', 'supe-editor' ) },
    { value: 'overlay', label: __( 'Over the image', 'supe-editor' ) },
    { value: 'hidden', label: __( 'Hidden', 'supe-editor' ) },
];

/**
 * Resolves size, fit and caption position for an image slide.
 *
 * @param {Object} attributes The slide's attributes.
 * @param {Object} defaults   The slider's `imageDefaults`.
 * @return {Object} { size, fit, captionPosition }
 */
export function resolveImageSettings( attributes, defaults = {} ) {
    return Object.fromEntries(
        Object.keys( IMAGE_DEFAULTS ).map( ( key ) => [
            key,
            attributes[ key ] || defaults[ key ] || IMAGE_DEFAULTS[ key ],
        ] )
    );
}

/**
 * Prepends a "Default (…)" option (empty value) naming what it falls back to.
 *
 * @param {Array}  options
 * @param {string} fallback The value used when "Default" is chosen.
 * @return {Array} Options with the default first.
 */
export function withDefaultOption( options, fallback ) {
    const label =
        options.find( ( option ) => option.value === fallback )?.label ??
        fallback;

    return [
        {
            value: '',
            /* translators: %s: the value used by default, e.g. "Large". */
            label: sprintf( __( 'Default (%s)', 'supe-editor' ), label ),
        },
        ...options,
    ];
}

/**
 * Attributes for an image slide made from a media library selection.
 *
 * @param {Object} image A media object from the media modal.
 * @return {Object} Image slide attributes.
 */
export const imageSlideAttributes = ( image ) => ( {
    id: image.id,
    caption: image.caption || undefined,
} );
