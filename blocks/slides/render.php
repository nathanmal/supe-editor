<?php
/**
 * Slides: the slider's root. Renders nothing until a type is chosen and the
 * track has slides.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\Slides\Markup;

defined( 'ABSPATH' ) || exit;

$supe_type = Markup::type( $attributes );
if ( '' === $supe_type || '' === trim( $content ) ) {
    return;
}

printf(
    '<section %s>%s</section>',
    get_block_wrapper_attributes( [
        'class'                => 'supe-slides is-type-' . $supe_type,
        'aria-roledescription' => __( 'carousel', 'supe-editor' ),
        'aria-label'           => Markup::name( $attributes ) ?: __( 'Slideshow', 'supe-editor' ),
    ] ),
    $content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered inner blocks.
);
