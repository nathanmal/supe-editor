<?php
/**
 * Slides: the slider's root, carrying the layout variables and the engine's
 * config (`data-supe-slides`). Renders nothing until a type is chosen and the
 * track has slides.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\Slides\Config;
use Supe\Editor\Blocks\Slides\Controls;
use Supe\Editor\Blocks\Slides\Layout;
use Supe\Editor\Blocks\Slides\Markup;
use Supe\Editor\Supports\Responsive\StyleGenerator;

defined( 'ABSPATH' ) || exit;

$supe_type = Markup::type( $attributes );
if ( '' === $supe_type || '' === trim( $content ) ) {
    return;
}

$supe_config  = Config::from( $attributes );
$supe_wrapper = [
    'class'                => implode( ' ', [ 'supe-slides', 'is-type-' . $supe_type, ...Layout::classes( $attributes ), ...Config::classes( $supe_config ) ] ),
    'aria-roledescription' => __( 'carousel', 'supe-editor' ),
    'aria-label'           => Markup::name( $attributes ) ?: __( 'Slideshow', 'supe-editor' ),
    'data-supe-slides'     => wp_json_encode( $supe_config ),
];

// Responsive layout (per view, gap, height) as variables the CSS consumes.
$supe_layout = StyleGenerator::inline( supe( 'supe.editor.slides' )->styles( $attributes ) );
if ( '' !== $supe_layout ) {
    $supe_wrapper['style'] = $supe_layout;
}

// One lightbox per slider, only when an image slide opens in it; the engine
// fills it (engine/lightbox.js).
$supe_lightbox = '';
if ( Markup::hasLightbox( $block->parsed_block['innerBlocks'] ?? [], (array) ( $attributes['imageDefaults'] ?? [] ) ) ) {
    $supe_lightbox = sprintf(
        '<dialog class="supe-slides__lightbox" aria-label="%1$s">'
            . '<figure class="supe-slides__lightbox-figure"><img class="supe-slides__lightbox-image" alt="" /><figcaption class="supe-slides__lightbox-caption"></figcaption></figure>'
            . '<p class="supe-slides__lightbox-count"></p>'
            . '<button type="button" class="supe-slides__button supe-slides__prev" data-lightbox="prev" aria-label="%2$s">%5$s</button>'
            . '<button type="button" class="supe-slides__button supe-slides__next" data-lightbox="next" aria-label="%3$s">%5$s</button>'
            . '<button type="button" class="supe-slides__button supe-slides__lightbox-close" data-lightbox="close" aria-label="%4$s">%6$s</button>'
            . '</dialog>',
        esc_attr__( 'Image viewer', 'supe-editor' ),
        esc_attr__( 'Previous image', 'supe-editor' ),
        esc_attr__( 'Next image', 'supe-editor' ),
        esc_attr__( 'Close', 'supe-editor' ),
        Controls::arrow( 'chevron' ),
        Controls::icon( 'close' )
    );
}

printf(
    '<section %s>%s%s</section>',
    get_block_wrapper_attributes( $supe_wrapper ),
    $content, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered inner blocks.
    $supe_lightbox // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
);
