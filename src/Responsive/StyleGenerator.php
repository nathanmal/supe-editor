<?php

declare(strict_types=1);

namespace Supe\Editor\Responsive;

use Supe\Editor\Supports\AbstractSupport;

/**
 * StyleGenerator
 *
 * Builds the one shared responsive stylesheet from two sources, using the
 * site's breakpoints for the media queries (which is why it can't be a
 * static file):
 *
 *  - Supports' rules (e.g. `.has-supe-pt-m{padding-top:var(--supe-pt-m)}`).
 *  - Responsive variables a block registers for its own settings. Each
 *    resolves to one custom property the block's CSS consumes:
 *
 *      .wp-block-supe-slides{--supe-slides-per-view:var(--supe-slides-per-view-d)}
 *      @media (max-width:1024px){ … var(--supe-slides-per-view-t,var(--supe-slides-per-view-d)) }
 *
 * The CSS is a few dozen short rules, so it's built once per request rather
 * than cached in the database. It's printed inline, always in the editor and
 * on the front end only once something renders a value that needs it.
 */
final class StyleGenerator {

    public const HANDLE = 'supe-responsive';

    /** @var list<AbstractSupport> */
    private array $supports = [];

    /** @var array<string, array{selector: string, type: string|array{type: string, min?: int, max?: int}}> */
    private array $variables = [];

    private ?string $css = null;

    private bool $enqueued = false;

    public function __construct(
        private readonly Breakpoints $breakpoints,
        private readonly ValueSanitizer $sanitizer
    ) {}

    public function register(): void {
        add_action( 'enqueue_block_assets', [ $this, 'enqueueInEditor' ] );
    }

    /**
     * `enqueue_block_assets` also runs inside the editor iframe, where every
     * block may need the rules regardless of what's been rendered.
     */
    public function enqueueInEditor(): void {
        if ( is_admin() ) {
            $this->enqueue();
        }
    }

    public function addSupport( AbstractSupport $support ): void {
        $this->supports[] = $support;
        $this->css        = null;
    }

    /**
     * Register a block's responsive variables, keyed by variable name
     * (without the leading `--`) with their ValueSanitizer type:
     *
     *   registerVariables( '.wp-block-supe-slides', [
     *       'supe-slides-per-view' => [ 'type' => 'int', 'min' => 1, 'max' => 12 ],
     *       'supe-slides-gap'      => 'spacing',
     *   ] );
     *
     * @param array<string, string|array{type: string, min?: int, max?: int}> $variables
     */
    public function registerVariables( string $selector, array $variables ): void {
        foreach ( $variables as $name => $type ) {
            if ( ! preg_match( '/^[a-z0-9-]+$/', (string) $name ) ) {
                continue;
            }

            $this->variables[ (string) $name ] = [
                'selector' => $selector,
                'type'     => $type,
            ];
        }

        $this->css = null;
    }

    /**
     * Inline declarations for one block's value of a registered variable:
     * `--{name}-d` / `-t` / `-m`. Unset viewports are written as `initial`
     * so a nested block of the same type can't inherit an outer block's value.
     * Enqueues the stylesheet whenever it returns anything.
     *
     * @param  array<string, mixed> $values Keyed by Viewport value.
     * @return array<string, string>
     */
    public function variableStyles( string $name, array $values ): array {
        if ( ! isset( $this->variables[ $name ] ) ) {
            return [];
        }

        $styles = [];
        $isSet  = false;

        foreach ( Viewport::cases() as $viewport ) {
            $css   = $this->sanitizer->sanitize( $values[ $viewport->value ] ?? null, $this->variables[ $name ]['type'] );
            $isSet = $isSet || null !== $css;

            $styles[ '--' . $name . '-' . $viewport->suffix() ] = $css ?? 'initial';
        }

        if ( ! $isSet ) {
            return [];
        }

        $this->enqueue();

        return $styles;
    }

    public function css(): string {
        if ( null !== $this->css ) {
            return $this->css;
        }

        $rules = array_fill_keys( array_map( static fn( Viewport $viewport ): string => $viewport->value, Viewport::cases() ), [] );

        foreach ( $this->supports as $support ) {
            foreach ( $support->rules() as $viewport => $viewportRules ) {
                if ( isset( $rules[ $viewport ] ) ) {
                    array_push( $rules[ $viewport ], ...$viewportRules );
                }
            }
        }

        foreach ( $this->variableRules() as $viewport => $viewportRules ) {
            array_push( $rules[ $viewport ], ...$viewportRules );
        }

        $css = '';

        foreach ( Viewport::cases() as $viewport ) {
            if ( [] === $rules[ $viewport->value ] ) {
                continue;
            }

            $block    = implode( '', $rules[ $viewport->value ] );
            $maxWidth = $this->breakpoints->maxWidth( $viewport );

            $css .= null === $maxWidth ? $block : sprintf( '@media (max-width:%dpx){%s}', $maxWidth, $block );
        }

        return $this->css = $css;
    }

    public function enqueue(): void {
        if ( $this->enqueued ) {
            return;
        }

        $css = $this->css();

        if ( '' === $css ) {
            return;
        }

        wp_register_style( self::HANDLE, false, [], false );
        wp_add_inline_style( self::HANDLE, $css );
        wp_enqueue_style( self::HANDLE );

        $this->enqueued = true;
    }

    /**
     * Turn declarations into a `style` attribute value.
     *
     * @param array<string, string> $styles
     */
    public static function inline( array $styles ): string {
        $declarations = [];

        foreach ( $styles as $property => $value ) {
            $declarations[] = $property . ':' . $value;
        }

        return implode( ';', $declarations );
    }

    /**
     * One rule per selector and viewport, resolving each variable from its
     * viewport value with fallbacks to the larger viewports.
     *
     * @return array<string, list<string>>
     */
    private function variableRules(): array {
        $declarations = [];

        foreach ( $this->variables as $name => $variable ) {
            $fallback = null;

            foreach ( Viewport::cases() as $viewport ) {
                $reference = '--' . $name . '-' . $viewport->suffix();
                $fallback  = null === $fallback ? "var({$reference})" : "var({$reference},{$fallback})";

                $declarations[ $viewport->value ][ $variable['selector'] ][] = "--{$name}:{$fallback}";
            }
        }

        $rules = [];

        foreach ( $declarations as $viewport => $bySelector ) {
            foreach ( $bySelector as $selector => $lines ) {
                $rules[ $viewport ][] = $selector . '{' . implode( ';', $lines ) . '}';
            }
        }

        return $rules;
    }
}
