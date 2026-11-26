<?php
/**
 * Slide track: the slides, each labelled with its position ("2 of 5").
 * Focusable so the no-JS scroll strip works from the keyboard. A posts
 * slider's track renders its Query Loop's posts as the slides
 * (Blocks\Slides\Posts).
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\Slides\Markup;

defined( 'ABSPATH' ) || exit;

if ( 'posts' === ( $block->context['supe/slides/type'] ?? null ) ) {
    $content = supe( 'supe.editor.slides.posts' )->render( $block );
}

if ( '' === trim( $content ) ) {
    return;
}

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes( [
        'class'    => 'supe-slides__track',
        'tabindex' => '0',
    ] ),
    Markup::labelSlides( $content ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered inner blocks.
);
