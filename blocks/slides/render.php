<?php
/**
 * Slides: the slider's root, carrying the layout variables. Renders nothing
 * until a type is chosen and the track has slides.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\Slides\Layout;
use Supe\Editor\Blocks\Slides\Markup;
use Supe\Editor\Supports\Responsive\StyleGenerator;

defined( 'ABSPATH' ) || exit;

$supe_type = Markup::type( $attributes );
if ( '' === $supe_type || '' === trim( $content ) ) {
    return;
}

$supe_wrapper = [
    'class'                => implode( ' ', [ 'supe-slides', 'is-type-' . $supe_type, ...Layout::classes( $attributes ) ] ),
    'aria-roledescription' => __( 'carousel', 'supe-editor' ),
    'aria-label'           => Markup::name( $attributes ) ?: __( 'Slideshow', 'supe-editor' ),
];

// Responsive layout (per view, gap, height) as variables the CSS consumes.
$supe_layout = StyleGenerator::inline( supe( 'supe.editor.slides' )->styles( $attributes ) );
if ( '' !== $supe_layout ) {
    $supe_wrapper['style'] = $supe_layout;
}

printf(
    '<section %s>%s</section>',
    get_block_wrapper_attributes( $supe_wrapper ),
    $content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered inner blocks.
);
