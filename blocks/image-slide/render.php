<?php
/**
 * Image slide: the attachment through wp_get_attachment_image() (srcset,
 * sizes, library alt text), optionally linked or opening the slider's
 * lightbox (a button carrying the full-size image), with an optional caption.
 * Settings fall back to the slider's image defaults (block context).
 * Renders nothing without a valid image.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\Slides\Markup;

defined( 'ABSPATH' ) || exit;

$supe_id = absint( $attributes['id'] ?? 0 );
if ( ! $supe_id || ! wp_attachment_is_image( $supe_id ) ) {
    return;
}

$supe_image = Markup::image(
    $attributes,
    (array) ( $block->context['supe/slides/imageDefaults'] ?? [] ),
    get_intermediate_image_sizes()
);

$supe_image_attributes = [
    // Passing a class replaces core's own, so keep those too.
    'class' => sprintf( 'attachment-%1$s size-%1$s supe-slides__image', sanitize_html_class( $supe_image['size'] ) ),
    'style' => 'object-fit:' . $supe_image['fit']
        . ( null === $supe_image['position'] ? '' : ';object-position:' . $supe_image['position'] ),
];
if ( '' !== $supe_image['alt'] ) {
    $supe_image_attributes['alt'] = $supe_image['alt'];
}

$supe_markup = wp_get_attachment_image( $supe_id, $supe_image['size'], false, $supe_image_attributes );

$supe_caption = '';
if ( '' !== $supe_image['caption'] && 'hidden' !== $supe_image['captionPosition'] ) {
    $supe_caption = '<figcaption class="supe-slides__caption">' . wp_kses_post( $supe_image['caption'] ) . '</figcaption>';
}

// Unnamed slides fall back to the alt text (slide, then library), then the
// image's library title.
$supe_name = Markup::name( $attributes )
    ?: $supe_image['alt']
    ?: trim( (string) get_post_meta( $supe_id, '_wp_attachment_image_alt', true ) )
    ?: trim( get_the_title( $supe_id ) );

$supe_href = esc_url( $supe_image['href'] );
if ( '' !== $supe_href ) {
    $supe_markup = sprintf(
        '<a class="supe-slides__link" href="%s"%s>%s</a>',
        $supe_href,
        $supe_image['newTab'] ? ' target="_blank" rel="noopener"' : '',
        $supe_markup
    );
} elseif ( $supe_image['lightbox'] ) {
    $supe_full = wp_get_attachment_image_src( $supe_id, 'full' );

    if ( $supe_full ) {
        $supe_markup = sprintf(
            '<button %s>%s</button>',
            implode( ' ', array_map(
                static fn ( string $name, string $value ): string => sprintf( '%s="%s"', $name, esc_attr( $value ) ),
                [ 'type', 'class', 'aria-haspopup', 'aria-label', 'data-supe-slides-action', 'data-src', 'data-srcset', 'data-width', 'data-height', 'data-caption' ],
                [
                    'button',
                    'supe-slides__zoom',
                    'dialog',
                    /* translators: %s: the image's name or alt text. */
                    '' === $supe_name ? __( 'Enlarge image', 'supe-editor' ) : sprintf( __( 'Enlarge image: %s', 'supe-editor' ), $supe_name ),
                    'lightbox',
                    $supe_full[0],
                    (string) wp_get_attachment_image_srcset( $supe_id, 'full' ),
                    (string) $supe_full[1],
                    (string) $supe_full[2],
                    '' === $supe_image['caption'] ? '' : wp_kses_post( $supe_image['caption'] ),
                ]
            ) ),
            $supe_markup
        );
    }
}

printf(
    '<div %s><figure class="supe-slides__figure">%s%s</figure></div>',
    get_block_wrapper_attributes( Markup::slideAttributes(
        $supe_name,
        '' === $supe_caption ? [] : [ 'has-caption-' . $supe_image['captionPosition'] ]
    ) ),
    $supe_markup, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core image markup.
    $supe_caption // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_kses_post() above.
);
