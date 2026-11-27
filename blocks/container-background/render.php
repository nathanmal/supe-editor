<?php
/**
 * Container background: the image covering the container (full size with
 * its srcset, positioned by its focal point) under an optional overlay.
 * Decorative, so hidden from assistive tech with an empty alt. Renders
 * nothing without a valid image — the container then looks as it would
 * without a background. The frame (the container's positioning, the layer
 * under its content) is in style.scss.
 *
 * The image sits in its own wrapper so a later fixed / parallax mode can
 * move it without changing the structure.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\ContainerBackground;
use Supe\Editor\Blocks\Slides\Markup;

defined( 'ABSPATH' ) || exit;

$supe_id = absint( $attributes['mediaId'] ?? 0 );
if ( ! $supe_id || ! wp_attachment_is_image( $supe_id ) ) {
    return;
}

$supe_position         = Markup::objectPosition( $attributes['focalPoint'] ?? null );
$supe_image_attributes = [
    'class' => 'wp-block-supe-container-background__image',
    'alt'   => '',
    'sizes' => '100vw',
];
if ( null !== $supe_position ) {
    $supe_image_attributes['style'] = 'object-position:' . $supe_position;
}

$supe_overlay = ContainerBackground::overlay( $attributes );

printf(
    '<div %1$s aria-hidden="true"><div class="wp-block-supe-container-background__media">%2$s</div>%3$s</div>',
    get_block_wrapper_attributes(),
    wp_get_attachment_image( $supe_id, 'full', false, $supe_image_attributes ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core image markup.
    null === $supe_overlay
        ? ''
        : '<span class="wp-block-supe-container-background__overlay" style="' . esc_attr( ContainerBackground::style( $supe_overlay ) ) . '"></span>'
);
