<?php

declare(strict_types=1);

namespace Supe\Editor\Blocks;

/**
 * ContainerBackground
 *
 * Decisions for the Container's background layer (supe/container-background,
 * rendered by its render.php): the overlay's inline style. Pure, so it's
 * tested without WordPress; blocks/container-background/overlay.js mirrors
 * it for the editor, both running tests/fixtures/container-background.json.
 *
 * Colors and gradients are stored as theme preset references
 * (`var:preset|color|contrast`, `var:preset|gradient|vivid`) so a changed
 * palette updates every background, or as custom values, which must look
 * like a color / gradient and nothing else — they go into a style attribute.
 */
final class ContainerBackground {

    public const DEFAULT_OPACITY = 50;

    private const PRESET = '/^var:preset\|(color|gradient)\|([a-z0-9-]+)$/';

    private const COLOR = '/^(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([0-9.,%\s\/-]+\)|transparent)$/i';

    private const GRADIENT = '/^(?:repeating-)?(?:linear|radial|conic)-gradient\([a-z0-9#%.,()\s\/-]+\)$/i';

    /**
     * The overlay's declarations, or null when it has no color or gradient
     * (a gradient wins over a color). Opacity is 0–100, default 50.
     *
     * @param  array<string, mixed> $attributes
     * @return array<string, string>|null
     */
    public static function overlay( array $attributes ): ?array {
        $gradient = self::paint( $attributes['overlayGradient'] ?? null, 'gradient' );
        $color    = null === $gradient ? self::paint( $attributes['overlayColor'] ?? null, 'color' ) : null;

        if ( null === $gradient && null === $color ) {
            return null;
        }

        return [
            null === $gradient ? 'background-color' : 'background-image' => $gradient ?? $color,
            'opacity' => self::opacity( $attributes['overlayOpacity'] ?? null ),
        ];
    }

    /**
     * CSS opacity for a 0–100 setting: `0.5`, `1`, `0`.
     */
    public static function opacity( mixed $value ): string {
        $percent = is_int( $value ) || is_float( $value ) ? (int) round( $value ) : self::DEFAULT_OPACITY;
        $percent = max( 0, min( 100, $percent ) );

        return (string) ( $percent / 100 );
    }

    /**
     * Declarations as a style attribute value.
     *
     * @param array<string, string> $declarations
     */
    public static function style( array $declarations ): string {
        return implode( ';', array_map(
            static fn( string $property, string $value ): string => $property . ':' . $value,
            array_keys( $declarations ),
            $declarations
        ) );
    }

    /**
     * A preset reference as its custom property, or a custom value that
     * passes the color / gradient pattern; null otherwise.
     *
     * @param 'color'|'gradient' $kind
     */
    private static function paint( mixed $value, string $kind ): ?string {
        if ( ! is_string( $value ) || strlen( $value ) > 512 ) {
            return null;
        }

        $value = trim( $value );

        if ( preg_match( self::PRESET, $value, $match ) ) {
            return $match[1] === $kind ? 'var(--wp--preset--' . $kind . '--' . $match[2] . ')' : null;
        }

        if ( str_contains( strtolower( $value ), 'url' ) ) {
            return null;
        }

        return preg_match( 'color' === $kind ? self::COLOR : self::GRADIENT, $value ) ? $value : null;
    }
}
