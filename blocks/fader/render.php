<?php
/**
 * Fader: its images stacked in one place, the first showing; the script
 * (view.js) cycles them with a crossfade. Renders nothing without images.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\Fader;

defined( 'ABSPATH' ) || exit;

if ( '' === trim( $content ) ) {
    return;
}

$supe_timing = Fader::timing( $attributes );

printf(
    '<div %s>%s</div>',
    get_block_wrapper_attributes( [
        'class'           => 'supe-fader',
        'style'           => '--supe-fader-fade:' . $supe_timing['fade'] . 'ms',
        'data-supe-fader' => wp_json_encode( $supe_timing ),
    ] ),
    Fader::prepare( $content ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- rendered inner blocks.
);
