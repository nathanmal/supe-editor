<?php
/**
 * Image slide: the attachment through wp_get_attachment_image() (srcset,
 * sizes, library alt text). Renders nothing without a valid image.
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

// Unnamed slides fall back to the image's alt text, then its library title.
$supe_name = Markup::name( $attributes )
    ?: trim( (string) get_post_meta( $supe_id, '_wp_attachment_image_alt', true ) )
    ?: trim( get_the_title( $supe_id ) );

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes( Markup::slideAttributes( $supe_name ) ),
    wp_get_attachment_image( $supe_id, 'large', false, [ 'class' => 'supe-slides__image' ] )
);
