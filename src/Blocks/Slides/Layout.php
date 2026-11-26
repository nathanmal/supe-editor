<?php

declare(strict_types=1);

namespace Supe\Editor\Blocks\Slides;

use Supe\Editor\Supports\Responsive\StyleGenerator;
use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Supe\Editor\Supports\Responsive\Viewport;

/**
 * Layout
 *
 * The slider's responsive layout: slides per view, gap and height, written
 * as responsive variables on the slider's root and consumed by its CSS
 * (blocks/slides/style.scss). Mirrored for the editor and headless front
 * ends by blocks/slides/shared/layout.js; both run
 * tests/fixtures/slides-layout.json.
 *
 * Height is stored per viewport as `{ mode, value }` and becomes a pair of
 * variables — `--supe-slides-h` and `--supe-slides-ar` (aspect ratio). A
 * viewport always sets both, the unused one as `auto`, so a desktop ratio
 * can't combine with a mobile `vh` height.
 */
final class Layout {

    public const SELECTOR = '.wp-block-supe-slides';

    public const PER_VIEW = 'supe-slides-per-view';
    public const GAP      = 'supe-slides-gap';
    public const HEIGHT   = 'supe-slides-h';
    public const RATIO    = 'supe-slides-ar';

    /** Registered with StyleGenerator: variable name => ValueSanitizer type. */
    public const VARIABLES = [
        self::PER_VIEW => [ 'type' => 'int', 'min' => 1, 'max' => 12 ],
        self::GAP      => 'spacing',
        self::HEIGHT   => 'length',
        self::RATIO    => 'ratio',
    ];

    /** Height modes that are a number in that unit. */
    public const HEIGHT_UNITS = [ 'px', '%', 'vh' ];

    public function __construct(
        private readonly StyleGenerator $styles,
        private readonly ValueSanitizer $sanitizer
    ) {}

    public function register(): void {
        add_action( 'init', [ $this, 'registerVariables' ] );
    }

    public function registerVariables(): void {
        $this->styles->registerVariables( self::SELECTOR, self::VARIABLES );
    }

    /**
     * Inline variable declarations for the slider's root.
     *
     * @return array<string, string>
     */
    public function styles( array $attributes ): array {
        $styles = [];

        foreach ( $this->values( $attributes ) as $name => $values ) {
            $styles += $this->styles->variableStyles( $name, $values );
        }

        return $styles;
    }

    /**
     * Classes for the slider's root: `is-height-slide` when the height
     * applies to each slide rather than the whole slider.
     *
     * @return string[]
     */
    public static function classes( array $attributes ): array {
        return 'slide' === ( $attributes['heightTarget'] ?? null ) ? [ 'is-height-slide' ] : [];
    }

    /**
     * Each variable's per-viewport values, ready for variableStyles().
     *
     * @return array<string, array<string, mixed>>
     */
    public function values( array $attributes ): array {
        $values = [
            self::PER_VIEW => self::responsive( $attributes['perView'] ?? null ),
            self::GAP      => array_map( [ self::class, 'gapValue' ], self::responsive( $attributes['gap'] ?? null ) ),
            self::HEIGHT   => [],
            self::RATIO    => [],
        ];

        $height = self::responsive( $attributes['height'] ?? null );

        foreach ( Viewport::cases() as $viewport ) {
            $pair = $this->heightPair( $height[ $viewport->value ] ?? null );

            if ( null !== $pair ) {
                [ $values[ self::HEIGHT ][ $viewport->value ], $values[ self::RATIO ][ $viewport->value ] ] = $pair;
            }
        }

        return $values;
    }

    /**
     * One viewport's height setting as [ height, aspect-ratio ] CSS, or null
     * when it's missing or invalid (the viewport then inherits).
     *
     * @return array{0: string, 1: string}|null
     */
    public function heightPair( mixed $setting ): ?array {
        if ( ! is_array( $setting ) ) {
            return null;
        }

        $mode  = $setting['mode'] ?? null;
        $value = $setting['value'] ?? null;

        if ( 'auto' === $mode ) {
            return [ 'auto', 'auto' ];
        }

        if ( 'ratio' === $mode ) {
            $ratio = $this->sanitizer->ratio( $value );

            return null === $ratio || 'auto' === $ratio ? null : [ 'auto', $ratio ];
        }

        if ( in_array( $mode, self::HEIGHT_UNITS, true ) && self::isNumber( $value ) ) {
            $length = $this->sanitizer->length( trim( (string) $value ) . $mode );

            return null === $length ? null : [ $length, 'auto' ];
        }

        return null;
    }

    /**
     * A gap of zero as `0px`: the gap is multiplied inside the slide width's
     * `calc()`, where a unitless `0` (what core's spacing control stores)
     * makes `100% - 0` invalid and the slides shrink to their content.
     */
    public static function gapValue( mixed $value ): mixed {
        $trimmed = is_string( $value ) ? trim( $value ) : $value;

        return in_array( $trimmed, [ 0, 0.0, '0' ], true ) ? '0px' : $value;
    }

    /**
     * @return array<string, mixed>
     */
    private static function responsive( mixed $value ): array {
        return is_array( $value ) ? $value : [];
    }

    private static function isNumber( mixed $value ): bool {
        return is_int( $value ) || is_float( $value ) || ( is_string( $value ) && is_numeric( trim( $value ) ) );
    }
}
