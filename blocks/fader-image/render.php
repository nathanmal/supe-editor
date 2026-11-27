<?php
/**
 * Fader image: the attachment at full size with its srcset (the browser
 * picks the resolution), covering the fader, positioned by its focal point.
 * Renders nothing without a valid image.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\Fader;
use Supe\Editor\Blocks\Slides\Markup;

defined( 'ABSPATH' ) || exit;

$supe_id = absint( $attributes['id'] ?? 0 );
if ( ! $supe_id || ! wp_attachment_is_image( $supe_id ) ) {
    return;
}

$supe_position = Markup::objectPosition( $attributes['focalPoint'] ?? null );
$supe_alt      = is_string( $attributes['alt'] ?? null ) ? trim( $attributes['alt'] ) : '';

$supe_image_attributes = [
    'class' => 'attachment-full size-full supe-fader__image',
];
if ( null !== $supe_position ) {
    $supe_image_attributes['style'] = 'object-position:' . $supe_position;
}
if ( '' !== $supe_alt ) {
    $supe_image_attributes['alt'] = $supe_alt;
}

printf(
    '<figure %s>%s</figure>',
    get_block_wrapper_attributes( [ 'class' => Fader::SLIDE_CLASS ] ),
    wp_get_attachment_image( $supe_id, 'full', false, $supe_image_attributes ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core image markup.
);
