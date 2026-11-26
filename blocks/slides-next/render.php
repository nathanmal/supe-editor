<?php
/**
 * Next slide button. The engine wires it up by `data-supe-slides-action`.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\Slides\Controls;

defined( 'ABSPATH' ) || exit;

printf(
    '<button %s>%s</button>',
    get_block_wrapper_attributes( [
        'class'                   => implode( ' ', [ 'supe-slides__button', 'supe-slides__next', ...Controls::classes( $attributes, 'center-right' ) ] ),
        'type'                    => 'button',
        'aria-label'              => __( 'Next slide', 'supe-editor' ),
        'data-supe-slides-action' => 'next',
    ] ),
    Controls::arrow( $attributes['arrows'] ?? null ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the package's own icon.
);
