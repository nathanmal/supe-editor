<?php

declare(strict_types=1);

namespace Supe\Editor\Blocks\Slides;

/**
 * Config
 *
 * The slider's behavior (loop, step, keyboard, drag, autoplay, transition)
 * from its attributes, validated and filled with defaults. render.php writes
 * it to the root as `data-supe-slides` for the engine (blocks/slides/engine/),
 * and adds its classes. Responsive values (per view, gap, height) aren't here; they're
 * CSS variables (Layout). Mirrored by blocks/slides/shared/config.js; both
 * run tests/fixtures/slides-config.json.
 *
 * Transition names aren't checked against a list: the engine's registry
 * owns them and falls back to `slide` for a name it doesn't know.
 */
final class Config {

    public const STEPS      = [ 'slide', 'page' ];
    public const DIRECTIONS = [ 'left', 'right', 'up', 'down' ];
    public const EASINGS    = [ 'ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out' ];

    /** [ min, max ] milliseconds. */
    public const DELAY    = [ 1000, 60000 ];
    public const DURATION = [ 0, 5000 ];

    public const DEFAULTS = [
        'loop'       => false,
        'step'       => 'slide',
        'keyboard'   => true,
        'drag'       => [
            'touch' => true,
            'mouse' => false,
        ],
        'autoplay'   => [
            'enabled'      => false,
            'delay'        => 5000,
            'pauseOnHover' => true,
        ],
        'transition' => [
            'name'      => 'slide',
            'direction' => 'left',
            'duration'  => 500,
            'easing'    => 'ease',
        ],
    ];

    /**
     * @return array{loop: bool, step: string, keyboard: bool, drag: array, autoplay: array, transition: array}
     */
    public static function from( array $attributes ): array {
        $defaults   = self::DEFAULTS;
        $drag       = is_array( $attributes['drag'] ?? null ) ? $attributes['drag'] : [];
        $autoplay   = is_array( $attributes['autoplay'] ?? null ) ? $attributes['autoplay'] : [];
        $transition = is_array( $attributes['transition'] ?? null ) ? $attributes['transition'] : [];
        $name       = $transition['name'] ?? null;

        return [
            'loop'       => self::bool( $attributes['loop'] ?? null, $defaults['loop'] ),
            'step'       => self::oneOf( $attributes['step'] ?? null, self::STEPS, $defaults['step'] ),
            'keyboard'   => self::bool( $attributes['keyboard'] ?? null, $defaults['keyboard'] ),
            'drag'       => [
                'touch' => self::bool( $drag['touch'] ?? null, $defaults['drag']['touch'] ),
                'mouse' => self::bool( $drag['mouse'] ?? null, $defaults['drag']['mouse'] ),
            ],
            'autoplay'   => [
                'enabled'      => self::bool( $autoplay['enabled'] ?? null, $defaults['autoplay']['enabled'] ),
                'delay'        => self::milliseconds( $autoplay['delay'] ?? null, self::DELAY, $defaults['autoplay']['delay'] ),
                'pauseOnHover' => self::bool( $autoplay['pauseOnHover'] ?? null, $defaults['autoplay']['pauseOnHover'] ),
            ],
            'transition' => [
                'name'      => is_string( $name ) && 1 === preg_match( '/^[a-z][a-z0-9-]*$/', $name ) ? $name : $defaults['transition']['name'],
                'direction' => self::oneOf( $transition['direction'] ?? null, self::DIRECTIONS, $defaults['transition']['direction'] ),
                'duration'  => self::milliseconds( $transition['duration'] ?? null, self::DURATION, $defaults['transition']['duration'] ),
                'easing'    => self::oneOf( $transition['easing'] ?? null, self::EASINGS, $defaults['transition']['easing'] ),
            ],
        ];
    }

    /**
     * Root classes for the layout the direction needs: `is-vertical` (up,
     * down) and `is-reversed` (right, down — the next slide comes from the
     * start side).
     *
     * @param array $config From from().
     * @return string[]
     */
    public static function classes( array $config ): array {
        $direction = $config['transition']['direction'];
        $classes   = [];

        if ( in_array( $direction, [ 'up', 'down' ], true ) ) {
            $classes[] = 'is-vertical';
        }
        if ( in_array( $direction, [ 'right', 'down' ], true ) ) {
            $classes[] = 'is-reversed';
        }

        return $classes;
    }

    private static function bool( mixed $value, bool $default ): bool {
        return is_bool( $value ) ? $value : $default;
    }

    private static function oneOf( mixed $value, array $allowed, string $default ): string {
        return in_array( $value, $allowed, true ) ? $value : $default;
    }

    /**
     * A whole number of milliseconds within [ min, max ]; anything that
     * isn't a number gets the default.
     *
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
