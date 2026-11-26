<?php
/**
 * Image slide: the attachment through wp_get_attachment_image() (srcset,
 * sizes, library alt text), optionally linked, with an optional caption.
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

$supe_href = esc_url( $supe_image['href'] );
if ( '' !== $supe_href ) {
    $supe_markup = sprintf(
        '<a class="supe-slides__link" href="%s"%s>%s</a>',
        $supe_href,
        $supe_image['newTab'] ? ' target="_blank" rel="noopener"' : '',
        $supe_markup
    );
}

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

printf(
    '<div %s><figure class="supe-slides__figure">%s%s</figure></div>',
    get_block_wrapper_attributes( Markup::slideAttributes(
        $supe_name,
        '' === $supe_caption ? [] : [ 'has-caption-' . $supe_image['captionPosition'] ]
    ) ),
    $supe_markup, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core image markup.
    $supe_caption // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_kses_post() above.
);
