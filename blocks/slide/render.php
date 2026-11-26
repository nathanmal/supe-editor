<?php
/**
 * Content slide: its inner blocks in the slide wrapper.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\Slides\Markup;

defined( 'ABSPATH' ) || exit;

$supe_alignment = Markup::verticalAlignment( $attributes );

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes( Markup::slideAttributes(
        Markup::name( $attributes ),
        '' === $supe_alignment ? [] : [ 'is-vertically-aligned-' . $supe_alignment ]
    ) ),
    $content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered inner blocks.
);
