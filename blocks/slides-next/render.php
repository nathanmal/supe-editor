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
    // A custom SVG (sanitized, Editor\SvgUploads) or the arrow set's icon.
    supe( 'supe.editor.svg' )->icon( absint( $attributes['iconId'] ?? 0 ), 'supe-slides__icon' ) ?: Controls::arrow( $attributes['arrows'] ?? null ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- sanitized SVG or the package's own icon.
);
