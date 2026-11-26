<?php
/**
 * Pause / play button for autoplay. The engine shows it only when the slider
 * autoplays, and swaps the icon and label (`data-label-play`) when paused.
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
        'class'                   => implode( ' ', [ 'supe-slides__button', 'supe-slides__pause', ...Controls::classes( $attributes, 'bottom-right' ) ] ),
        'type'                    => 'button',
        'hidden'                  => 'hidden',
        'aria-label'              => __( 'Pause slideshow', 'supe-editor' ),
        'data-label-pause'        => __( 'Pause slideshow', 'supe-editor' ),
        'data-label-play'         => __( 'Play slideshow', 'supe-editor' ),
        'data-supe-slides-action' => 'pause',
    ] ),
    Controls::icon( 'pause' ) . Controls::icon( 'play' ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the package's own icons.
);
