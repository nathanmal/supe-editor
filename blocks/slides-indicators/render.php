<?php
/**
 * Slide indicators. Their number depends on slides per view (responsive)
 * and the step, so the engine builds them from the template; the style
 * (dots, bars, numbers) is a block style class.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\Slides\Controls;

defined( 'ABSPATH' ) || exit;

printf(
    '<div %s><template><button type="button" class="supe-slides__indicator" data-supe-slides-action="go"><span class="supe-slides__indicator-mark" aria-hidden="true"></span></button></template></div>',
    get_block_wrapper_attributes( [
        'class'      => implode( ' ', [ 'supe-slides__indicators', ...Controls::classes( $attributes, 'bottom-center' ) ] ),
        'role'       => 'group',
        'aria-label' => __( 'Choose a slide', 'supe-editor' ),
        /* translators: %d: slide number. */
        'data-label' => __( 'Show slide %d', 'supe-editor' ),
    ] )
);
