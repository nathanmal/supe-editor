<?php
/**
 * Controls bar: a row below the slides (core flex layout).
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
    get_block_wrapper_attributes( [ 'class' => 'supe-slides__bar' ] ),
    $content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered inner blocks.
);
