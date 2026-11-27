<?php

declare(strict_types=1);

namespace Supe\Editor\Blocks;

use WP_HTML_Tag_Processor;

/**
 * Fader
 *
 * The fader block (`supe/fader`): images stacked in one place, cycling with
 * a crossfade (blocks/fader/view.js). Shared by its render.php files: the
 * timing, validated, and the first image marked as the one showing — so the
 * page shows it before (or without) the script, and assistive tech only
 * meets the image on screen.
 */
final class Fader {

    public const SLIDE_CLASS = 'supe-fader__slide';

    /** Milliseconds: [ min, max ]. */
    public const DURATION = [ 1000, 60000 ];
    public const FADE     = [ 100, 10000 ];

    public const DEFAULTS = [
        'duration' => 5000,
        'fade'     => 1500,
    ];

    /**
     * How long each image shows and how long the fade takes, in whole ms
     * within range; anything that isn't a number gets the default.
     *
     * @return array{duration: int, fade: int}
     */
    public static function timing( array $attributes ): array {
        return [
            'duration' => self::milliseconds( $attributes['duration'] ?? null, self::DURATION, self::DEFAULTS['duration'] ),
            'fade'     => self::milliseconds( $attributes['fade'] ?? null, self::FADE, self::DEFAULTS['fade'] ),
        ];
    }

    /**
     * The first image becomes the one showing (`is-active`); the others are
     * hidden from assistive tech until the script shows them.
     */
    public static function prepare( string $html ): string {
        $processor = new WP_HTML_Tag_Processor( $html );
        $first     = true;

        while ( $processor->next_tag( [ 'class_name' => self::SLIDE_CLASS ] ) ) {
            if ( $first ) {
                $processor->add_class( 'is-active' );
                $first = false;
            } else {
                $processor->set_attribute( 'aria-hidden', 'true' );
            }
        }

        return $processor->get_updated_html();
    }

    /**
     * @param array{0: int, 1: int} $range
     */
    private static function milliseconds( mixed $value, array $range, int $default ): int {
        if ( is_string( $value ) && is_numeric( trim( $value ) ) ) {
            $value = (float) trim( $value );
        }
        if ( ! is_int( $value ) && ! ( is_float( $value ) && is_finite( $value ) ) ) {
            return $default;
        }

        return (int) max( $range[0], min( $range[1], round( $value ) ) );
    }
}
