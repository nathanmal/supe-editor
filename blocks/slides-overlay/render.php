<?php
/**
 * Overlay controls: a 3×3 grid over the track; each control picks a cell.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

defined( 'ABSPATH' ) || exit;

if ( '' === trim( $content ) ) {
    return;
}

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes( [ 'class' => 'supe-slides__overlay' ] ),
    $content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered inner blocks.
);
