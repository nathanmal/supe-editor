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

    public const FITS = [ 'cover', 'contain', 'fill', 'none' ];

    public const CAPTION_POSITIONS = [ 'below', 'overlay', 'hidden' ];

    /** Used when neither the slide nor the slider's image defaults set a value. */
    public const IMAGE_DEFAULTS = [
        'size'            => 'large',
        'fit'             => 'cover',
        'captionPosition' => 'below',
    ];

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
     * An image slide's settings: each comes from the slide, else the slider's
     * image defaults (block context), else IMAGE_DEFAULTS. Invalid values are
     * skipped at every level.
     *
     * @param array<string, mixed> $defaults The slider's `imageDefaults`.
     * @param string[]             $sizes    Registered image size slugs.
     * @return array{size: string, fit: string, captionPosition: string, position: ?string, alt: string, caption: string, href: string, newTab: bool}
     */
    public static function image( array $attributes, array $defaults, array $sizes ): array {
        $valid = [
            'size'            => [ ...$sizes, 'full' ],
            'fit'             => self::FITS,
            'captionPosition' => self::CAPTION_POSITIONS,
        ];

        $settings = [];
        foreach ( $valid as $key => $allowed ) {
            $settings[ $key ] = self::IMAGE_DEFAULTS[ $key ];
            foreach ( [ $attributes[ $key ] ?? null, $defaults[ $key ] ?? null ] as $value ) {
                if ( in_array( $value, $allowed, true ) ) {
                    $settings[ $key ] = $value;
                    break;
                }
            }
        }

        $caption = $attributes['caption'] ?? '';
        $alt     = $attributes['alt'] ?? '';
        $href    = $attributes['href'] ?? '';

        $href = is_string( $href ) ? trim( $href ) : '';

        return $settings + [
            'position' => self::objectPosition( $attributes['focalPoint'] ?? null ),
            'alt'      => is_string( $alt ) ? trim( $alt ) : '',
            'caption'  => is_string( $caption ) ? trim( $caption ) : '',
            'href'     => $href,
            'newTab'   => '_blank' === ( $attributes['linkTarget'] ?? '' ),
            'lightbox' => '' === $href && self::lightbox( $attributes, $defaults ),
        ];
    }

    /**
     * Whether an image slide opens in the lightbox: its own setting, else
     * the slider's default, else no. (A linked image never does; image()
     * applies that.)
     */
    public static function lightbox( array $attributes, array $defaults ): bool {
        foreach ( [ $attributes['lightbox'] ?? null, $defaults['lightbox'] ?? null ] as $value ) {
            if ( is_bool( $value ) ) {
                return $value;
            }
        }

        return false;
    }

    /**
     * Whether any of a slider's image slides opens in the lightbox, from its
     * parsed inner blocks (the slider renders the dialog only then).
     *
     * @param array $innerBlocks The slider's parsed inner blocks.
     * @param array $defaults    Its `imageDefaults`.
     */
    public static function hasLightbox( array $innerBlocks, array $defaults ): bool {
        foreach ( $innerBlocks as $track ) {
            if ( 'supe/slides-track' !== ( $track['blockName'] ?? null ) ) {
                continue;
            }
            foreach ( $track['innerBlocks'] ?? [] as $slide ) {
                $attributes = (array) ( $slide['attrs'] ?? [] );

                if (
                    'supe/image-slide' === ( $slide['blockName'] ?? null )
                    && '' === trim( (string) ( $attributes['href'] ?? '' ) )
                    && self::lightbox( $attributes, $defaults )
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * A focal point ({ x, y } from 0 to 1) as an `object-position` value, or
     * null when it's missing or malformed.
     */
    public static function objectPosition( mixed $focalPoint ): ?string {
        if ( ! is_array( $focalPoint ) ) {
            return null;
        }

        $axes = [];
        foreach ( [ 'x', 'y' ] as $axis ) {
            $value = $focalPoint[ $axis ] ?? null;
            if ( ! is_int( $value ) && ! is_float( $value ) ) {
                return null;
            }
            $axes[] = round( max( 0, min( 1, $value ) ) * 100, 2 ) . '%';
        }

        return implode( ' ', $axes );
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
