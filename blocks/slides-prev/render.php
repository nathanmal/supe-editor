<?php
/**
 * Previous slide button. The engine wires it up by `data-supe-slides-action`.
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
        'class'                   => implode( ' ', [ 'supe-slides__button', 'supe-slides__prev', ...Controls::classes( $attributes, 'center-left' ) ] ),
        'type'                    => 'button',
        'aria-label'              => __( 'Previous slide', 'supe-editor' ),
        'data-supe-slides-action' => 'prev',
    ] ),
    Controls::arrow( $attributes['arrows'] ?? null ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the package's own icon.
);
