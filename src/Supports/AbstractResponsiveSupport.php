<?php

declare(strict_types=1);

namespace Supe\Editor\Supports;

use Supe\Editor\Supports\Responsive\Viewport;

/**
 * AbstractResponsiveSupport
 *
 * A support whose support.json `properties` map CSS properties to
 * per-viewport values, e.g. padding with sides:
 *
 *   { "padding": { "desktop": { "top": "2rem" }, "mobile": { "top": "1rem" } } }
 *
 * Each value set for a viewport becomes a class plus a CSS custom property on
 * the block (`has-supe-pt-m` + `--supe-pt-m: 1rem`), and the shared
 * stylesheet maps the class to the property inside that viewport's media
 * query. The class is only added when its own value is set, so an unset
 * viewport never resets the property — it cascades from the next larger
 * viewport, or leaves theme/core styles alone.
 *
 * Property metadata: `css` (CSS property), `var` (short name used in
 * generated names), `sides` (top/right/bottom/left values), `type`
 * (ValueSanitizer type).
 */
abstract class AbstractResponsiveSupport extends AbstractSupport {

    private const SIDES = [
        'top'    => 't',
        'right'  => 'r',
        'bottom' => 'b',
        'left'   => 'l',
    ];

    public function render( array $value ): array {
        $classes = [];
        $styles  = [];

        foreach ( $this->properties() as $property => $config ) {
            $byViewport = $value[ $property ] ?? null;

            if ( ! is_array( $byViewport ) ) {
                continue;
            }

            foreach ( Viewport::cases() as $viewport ) {
                $viewportValue = $byViewport[ $viewport->value ] ?? null;

                foreach ( $this->targets( $config ) as $key => $side ) {
                    $raw = '' === $key
                        ? $viewportValue
                        : ( is_array( $viewportValue ) ? ( $viewportValue[ $key ] ?? null ) : null );

                    $css = $this->sanitizer->sanitize( $raw, $config['type'] );

                    if ( null === $css ) {
                        continue;
                    }

                    $name = $this->generatedName( $config, $side, $viewport );

                    $classes[]             = 'has-' . $name;
                    $styles[ '--' . $name ] = $css;
                }
            }
        }

        return [
            'classes' => $classes,
            'styles'  => $styles,
        ];
    }

    public function rules(): array {
        $rules = self::emptyRules();

        foreach ( $this->properties() as $config ) {
            foreach ( $this->targets( $config ) as $key => $side ) {
                $cssProperty = '' === $key ? $config['css'] : $config['css'] . '-' . $key;

                foreach ( Viewport::cases() as $viewport ) {
                    $name = $this->generatedName( $config, $side, $viewport );

                    $rules[ $viewport->value ][] = sprintf( '.has-%1$s{%2$s:var(--%1$s)}', $name, $cssProperty );
                }
            }
        }

        return $rules;
    }

    /**
     * The support's properties with their metadata validated. `css` and `var`
     * end up verbatim in generated CSS, so anything unexpected is skipped.
     *
     * @return array<string, array{css: string, var: string, sides: bool, type: string}>
     */
    protected function properties(): array {
        $properties = [];

        foreach ( (array) ( $this->metadata['properties'] ?? [] ) as $property => $config ) {
            if ( ! is_array( $config )
                || ! preg_match( '/^[a-z-]+$/', (string) ( $config['css'] ?? '' ) )
                || ! preg_match( '/^[a-z0-9]+$/', (string) ( $config['var'] ?? '' ) )
            ) {
                continue;
            }

            $properties[ (string) $property ] = [
                'css'   => $config['css'],
                'var'   => $config['var'],
                'sides' => (bool) ( $config['sides'] ?? false ),
                'type'  => (string) ( $config['type'] ?? 'spacing' ),
            ];
        }

        return $properties;
    }

    /**
     * Value keys to read for a property, mapped to their name suffix: each
     * side for sided properties, or the value itself (empty key) otherwise.
     *
     * @param  array{sides: bool} $config
     * @return array<string, string>
     */
    private function targets( array $config ): array {
        return $config['sides'] ? self::SIDES : [ '' => '' ];
    }

    /**
     * Generated class/property name: `supe-pt` for desktop, `supe-pt-t` /
     * `supe-pt-m` for tablet / mobile.
     *
     * @param array{var: string} $config
     */
    private function generatedName( array $config, string $side, Viewport $viewport ): string {
        $name = 'supe-' . $config['var'] . $side;

        return Viewport::Desktop === $viewport ? $name : $name . '-' . $viewport->suffix();
    }
}
