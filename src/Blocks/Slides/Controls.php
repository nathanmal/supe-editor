<?php

declare(strict_types=1);

namespace Supe\Editor\Blocks\Slides;

/**
 * Controls
 *
 * Shared by the control blocks' render.php files (prev, next, indicators,
 * pause): the overlay cell classes, the arrow set and the preset
 * icons (blocks/slides/shared/icons.json, also read by the editor). The
 * engine finds controls by `data-supe-slides-action` inside the slider's
 * own control areas (blocks/slides/engine/controls.js). Mirrored by
 * blocks/slides/shared/controls.js.
 */
final class Controls {

    /** Overlay grid cells, row then column. */
    public const POSITIONS = [
        'top-left',
        'top-center',
        'top-right',
        'center-left',
        'center-center',
        'center-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
    ];

    public const ARROW_SETS = [ 'chevron', 'arrow', 'caret', 'line' ];

    /** @var array<string, mixed>|null */
    private static ?array $icons = null;

    /**
     * Classes every control button shares: its overlay cell (ignored in the
     * bar).
     *
     * @return string[]
     */
    public static function classes( array $attributes, string $defaultPosition ): array {
        return [ 'is-position-' . self::oneOf( $attributes['position'] ?? null, self::POSITIONS, $defaultPosition ) ];
    }

    public static function arrowSet( mixed $value ): string {
        return self::oneOf( $value, self::ARROW_SETS, self::ARROW_SETS[0] );
    }

    /** An arrow set's icon, pointing to the next slide. */
    public static function arrow( mixed $set ): string {
        return self::svg( self::icons()['arrows'][ self::arrowSet( $set ) ] ?? '' );
    }

    /**
     * The pause or play icon (also the Container background's pause button,
     * with its own class).
     */
    public static function icon( string $name, string $class = 'supe-slides__icon' ): string {
        $paths = self::icons()[ $name ] ?? null;

        return is_string( $paths ) ? self::svg( $paths, $class . ' is-' . $name ) : '';
    }

    /**
     * A preset's paths in the SVG every icon uses: hidden from assistive
     * tech (the button carries the label), 1em square so font size sizes it.
     */
    public static function svg( string $paths, string $class = 'supe-slides__icon' ): string {
        return sprintf(
            '<svg class="%s" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">%s</svg>',
            esc_attr( $class ),
            $paths
        );
    }

    /**
     * @return array<string, mixed>
     */
    private static function icons(): array {
        if ( null === self::$icons ) {
            $json        = file_get_contents( dirname( __DIR__, 3 ) . '/blocks/slides/shared/icons.json' );
            $icons       = is_string( $json ) ? json_decode( $json, true ) : null;
            self::$icons = is_array( $icons ) ? $icons : [];
        }

        return self::$icons;
    }

    private static function oneOf( mixed $value, array $allowed, string $default ): string {
        return in_array( $value, $allowed, true ) ? $value : $default;
    }
}
