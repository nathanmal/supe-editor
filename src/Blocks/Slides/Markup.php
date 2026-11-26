<?php

declare(strict_types=1);

namespace Supe\Editor\Blocks\Slides;

use WP_HTML_Processor;

/**
 * Markup
 *
 * Shared by the slides blocks' render.php files. The decisions (type,
 * names, labels, alignment) are pure; labelSlides() applies the labels to
 * rendered markup with WP_HTML_Processor and is covered by Feature tests.
 */
final class Markup {

    /** Every slide carries this class, whatever its type. */
    public const SLIDE_CLASS = 'supe-slides__slide';

    /** Slide types that render (posts arrive with phase 8 of docs/slides.md). */
    public const TYPES = [ 'images', 'content' ];

    public const VERTICAL_ALIGNMENTS = [ 'top', 'center', 'bottom' ];

    public static function type( array $attributes ): string {
        $type = $attributes['type'] ?? '';

        return in_array( $type, self::TYPES, true ) ? $type : '';
    }

    /**
     * The block's own name, set through core block renaming (`metadata.name`).
     */
    public static function name( array $attributes ): string {
        $name = $attributes['metadata']['name'] ?? '';

        return is_string( $name ) ? trim( $name ) : '';
    }

    public static function verticalAlignment( array $attributes ): string {
        $alignment = $attributes['verticalAlignment'] ?? '';

        return in_array( $alignment, self::VERTICAL_ALIGNMENTS, true ) ? $alignment : '';
    }

    /**
     * Wrapper attributes for a slide, for get_block_wrapper_attributes(). The
     * name goes in `aria-label`; the track prefixes the position later.
     *
     * @param string[] $classes
     * @return array<string, string>
     */
    public static function slideAttributes( string $name, array $classes = [] ): array {
        $attributes = [
            'class'                => implode( ' ', [ self::SLIDE_CLASS, ...$classes ] ),
            'role'                 => 'group',
            'aria-roledescription' => __( 'slide', 'supe-editor' ),
        ];

        if ( '' !== $name ) {
            $attributes['aria-label'] = $name;
        }

        return $attributes;
    }

    /**
     * A slide's accessible label: "3 of 7", or "3 of 7: Summer collection".
     */
    public static function label( int $position, int $total, string $name = '' ): string {
        if ( '' === $name ) {
            /* translators: 1: slide position, 2: number of slides. */
            return sprintf( __( '%1$d of %2$d', 'supe-editor' ), $position, $total );
        }

        /* translators: 1: slide position, 2: number of slides, 3: slide name. */
        return sprintf( __( '%1$d of %2$d: %3$s', 'supe-editor' ), $position, $total, $name );
    }

    /**
     * Labels the track's slides with their position. Only top-level slides
     * count, so a slider nested inside a content slide keeps its own labels.
     * Returns the markup unchanged if it can't be parsed.
     */
    public static function labelSlides( string $html ): string {
        $total   = 0;
        $counted = self::eachSlide( $html, static function () use ( &$total ): void {
            $total++;
        } );
        if ( null === $counted || 0 === $total ) {
            return $html;
        }

        $position = 0;

        return self::eachSlide( $html, static function ( WP_HTML_Processor $slide ) use ( &$position, $total ): void {
            $name = $slide->get_attribute( 'aria-label' );
            $slide->set_attribute( 'aria-label', self::label( ++$position, $total, is_string( $name ) ? $name : '' ) );
        } ) ?? $html;
    }

    /**
     * Calls $callback on every top-level slide element. Returns the updated
     * markup, or null when the HTML API can't parse it.
     *
     * @param callable(WP_HTML_Processor): void $callback
     */
    private static function eachSlide( string $html, callable $callback ): ?string {
        $processor = WP_HTML_Processor::create_fragment( $html );
        if ( null === $processor ) {
            return null;
        }

        $depth = null;
        while ( $processor->next_tag() ) {
            $depth ??= $processor->get_current_depth();
            if ( $processor->get_current_depth() === $depth && $processor->has_class( self::SLIDE_CLASS ) ) {
                $callback( $processor );
            }
        }

        return null === $processor->get_last_error() ? $processor->get_updated_html() : null;
    }
}
