<?php
/**
 * Container background: an image (full size with its srcset) or a looping
 * video (muted, inline, poster), positioned by its focal point, under an
 * optional overlay. Decorative, so the media and overlay are hidden from
 * assistive tech; a video may add a pause button, which isn't. Renders
 * nothing without valid media — the container then looks as it would
 * without a background. The frame (the container's positioning, the layer
 * under its content) is in style.scss.
 *
 * A video doesn't autoplay from the markup: view.js (enqueued only for
 * videos) starts it unless reduced motion is on, and pauses it off screen
 * and in hidden tabs. The pause button stays `hidden` until then.
 *
 * The media sits in its own wrapper so a later fixed / parallax mode can
 * move it without changing the structure.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

use Supe\Editor\Blocks\ContainerBackground;
use Supe\Editor\Blocks\Slides\Controls;
use Supe\Editor\Blocks\Slides\Markup;

defined( 'ABSPATH' ) || exit;

$supe_type     = ContainerBackground::type( $attributes );
$supe_id       = absint( $attributes['mediaId'] ?? 0 );
$supe_position = Markup::objectPosition( $attributes['focalPoint'] ?? null );
$supe_style    = null === $supe_position ? '' : 'object-position:' . $supe_position;
$supe_button   = '';

if ( 'video' === $supe_type ) {
    $supe_src = $supe_id && wp_attachment_is( 'video', $supe_id ) ? wp_get_attachment_url( $supe_id ) : false;
    if ( ! $supe_src ) {
        return;
    }

    $supe_poster_id = absint( $attributes['posterId'] ?? 0 );
    $supe_poster    = $supe_poster_id && wp_attachment_is_image( $supe_poster_id )
        ? wp_get_attachment_image_url( $supe_poster_id, 'full' )
        : false;

    $supe_media = sprintf(
        '<video class="wp-block-supe-container-background__video" src="%1$s"%2$s%3$s muted loop playsinline preload="metadata" disablepictureinpicture disableremoteplayback></video>',
        esc_url( $supe_src ),
        $supe_poster ? ' poster="' . esc_url( $supe_poster ) . '"' : '',
        '' === $supe_style ? '' : ' style="' . esc_attr( $supe_style ) . '"'
    );

    if ( ! empty( $attributes['pauseButton'] ) ) {
        $supe_button = sprintf(
            '<button type="button" class="wp-block-supe-container-background__pause" aria-label="%1$s" data-label-play="%2$s" hidden>%3$s%4$s</button>',
            esc_attr__( 'Pause background video', 'supe-editor' ),
            esc_attr__( 'Play background video', 'supe-editor' ),
            Controls::icon( 'pause', 'wp-block-supe-container-background__icon' ),
            Controls::icon( 'play', 'wp-block-supe-container-background__icon' )
        );
    }

    wp_enqueue_script_module( ContainerBackground::VIEW_MODULE );
} else {
    if ( ! $supe_id || ! wp_attachment_is_image( $supe_id ) ) {
        return;
    }

    $supe_image_attributes = [
        'class' => 'wp-block-supe-container-background__image',
        'alt'   => '',
        'sizes' => '100vw',
    ];
    if ( '' !== $supe_style ) {
        $supe_image_attributes['style'] = $supe_style;
    }

    $supe_media = wp_get_attachment_image( $supe_id, 'full', false, $supe_image_attributes );
}

$supe_overlay = ContainerBackground::overlay( $attributes );

printf(
    '<div %1$s><div class="wp-block-supe-container-background__media" aria-hidden="true">%2$s</div>%3$s%4$s</div>',
    get_block_wrapper_attributes( [ 'class' => 'is-' . $supe_type ] ),
    $supe_media, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core image markup / escaped above.
    null === $supe_overlay
        ? ''
        : '<span class="wp-block-supe-container-background__overlay" style="' . esc_attr( ContainerBackground::style( $supe_overlay ) ) . '" aria-hidden="true"></span>',
    $supe_button // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
);
