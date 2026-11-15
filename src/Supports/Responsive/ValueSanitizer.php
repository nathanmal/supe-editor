<?php

declare(strict_types=1);

namespace Supe\Editor\Supports\Responsive;

/**
 * ValueSanitizer
 *
 * Turns stored responsive values into CSS-safe strings, or null when a value
 * isn't allowed. Everything rendered into a `style` attribute goes through
 * here first, whatever the editor UI permitted — only numbers with known
 * units, preset references, and a few keywords ever get through.
 */
final class ValueSanitizer {

    private const MAX_LENGTH = 64;

    private const NUMBER = '(?:\d+(?:\.\d+)?|\.\d+)';

    /** Units a spacing value may use — the units core's spacing control offers. */
    private const SPACING_UNITS = 'px|em|rem|%|vh|vw';

    /**
     * Sanitize by type name, or by an options array whose `type` key names
     * it (`['type' => 'int', 'min' => 1, 'max' => 12]`).
     *
     * Types: spacing, margin (spacing plus negatives and `auto`), length,
     * ratio, int.
     *
     * @param string|array{type: string, min?: int, max?: int} $type
     */
    public function sanitize( mixed $value, string|array $type ): ?string {
        $options = is_array( $type ) ? $type : [ 'type' => $type ];

        return match ( $options['type'] ?? null ) {
            'spacing' => $this->spacing( $value ),
            'margin'  => $this->spacing( $value, allowNegative: true, allowAuto: true ),
            'length'  => $this->length( $value ),
            'ratio'   => $this->ratio( $value ),
            'int'     => $this->int( $value, $options['min'] ?? 0, $options['max'] ?? PHP_INT_MAX ),
            default   => null,
        };
    }

    /**
     * A theme spacing preset (`var:preset|spacing|40`, or its already-resolved
     * `var(--wp--preset--spacing--40)` form), `0`, or a number in px, em, rem,
     * %, vh or vw.
     */
    public function spacing( mixed $value, bool $allowNegative = false, bool $allowAuto = false ): ?string {
        $value = $this->normalize( $value );

        if ( null === $value ) {
            return null;
        }

        if ( preg_match( '/^var:preset\|spacing\|([a-z0-9-]+)$/', $value, $match )
            || preg_match( '/^var\(--wp--preset--spacing--([a-z0-9-]+)\)$/', $value, $match )
        ) {
            return 'var(--wp--preset--spacing--' . $match[1] . ')';
        }

        if ( $allowAuto && 'auto' === $value ) {
            return 'auto';
        }

        $sign = $allowNegative ? '-?' : '';

        if ( preg_match( '/^' . $sign . '0$/', $value ) ) {
            return '0';
        }

        return preg_match( '/^' . $sign . self::NUMBER . '(?:' . self::SPACING_UNITS . ')$/', $value ) ? $value : null;
    }

    /**
     * `auto`, `0`, or a non-negative number in px, % or vh.
     */
    public function length( mixed $value ): ?string {
        $value = $this->normalize( $value );

        if ( null === $value ) {
            return null;
        }

        if ( 'auto' === $value || '0' === $value ) {
            return $value;
        }

        return preg_match( '/^' . self::NUMBER . '(?:px|%|vh)$/', $value ) ? $value : null;
    }

    /**
     * `auto`, a `width/height` pair, or a single number — every number
     * positive. Pairs are returned in CSS `aspect-ratio` form (`16 / 9`).
     */
    public function ratio( mixed $value ): ?string {
        $value = $this->normalize( $value );

        if ( null === $value ) {
            return null;
        }

        if ( 'auto' === $value ) {
            return 'auto';
        }

        if ( preg_match( '/^(' . self::NUMBER . ')\s*\/\s*(' . self::NUMBER . ')$/', $value, $match ) ) {
            return ( (float) $match[1] > 0 && (float) $match[2] > 0 ) ? $match[1] . ' / ' . $match[2] : null;
        }

        if ( preg_match( '/^' . self::NUMBER . '$/', $value ) ) {
            return (float) $value > 0 ? $value : null;
        }

        return null;
    }

    public function int( mixed $value, int $min = 0, int $max = PHP_INT_MAX ): ?string {
        // filter_var() reads true as 1; the JS port (and any sane input) doesn't.
        if ( is_bool( $value ) ) {
            return null;
        }

        if ( is_string( $value ) ) {
            $value = trim( $value );
        }

        $int = filter_var( $value, FILTER_VALIDATE_INT, [
            'options' => [ 'min_range' => $min, 'max_range' => $max ],
        ] );

        return false === $int ? null : (string) $int;
    }

    /**
     * Trimmed, lowercased string form of a scalar value; null for anything
     * empty, oversized, or non-scalar.
     */
    private function normalize( mixed $value ): ?string {
        if ( is_int( $value ) || is_float( $value ) ) {
            $value = (string) $value;
        }

        if ( ! is_string( $value ) ) {
            return null;
        }

        $value = strtolower( trim( $value ) );

        if ( '' === $value || strlen( $value ) > self::MAX_LENGTH ) {
            return null;
        }

        return $value;
    }
}
