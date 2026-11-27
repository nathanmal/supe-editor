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
 * Rules are `!important`: a value set on one block should win the way
 * core's inline styles do (e.g. over core's `:root :where(.is-layout-flow) >
 * :last-child` margin reset). Among themselves the rules stay equal, so the
 * later media queries still override desktop.
 *
 * Property metadata: `css` (CSS property), `var` (short name used in
 * generated names), `sides` (top/right/bottom/left values), `type`
 * (ValueSanitizer type name, or its options, e.g. `{ "type": "keyword",
 * "values": [ "row", "column" ] }`).
 *
 * A property can set more than one CSS property, or scope them, with
 * `rules` in place of `css`: each rule has `css`, an optional `selector`
 * appended to the class (`.is-layout-flex`, `.is-layout-flow>*+*`; no
 * commas, no braces) and `important` (default true; false lets inline
 * styles on the matched elements win, e.g. a child's own margin).
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

                foreach ( self::targets( $config ) as $key => $side ) {
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
            foreach ( self::targets( $config ) as $key => $side ) {
                foreach ( Viewport::cases() as $viewport ) {
                    $name = $this->generatedName( $config, $side, $viewport );

                    foreach ( $config['rules'] as $rule ) {
                        $rules[ $viewport->value ][] = sprintf(
                            '.has-%1$s%2$s{%3$s:var(--%1$s)%4$s}',
                            $name,
                            $rule['selector'],
                            '' === $key ? $rule['css'] : $rule['css'] . '-' . $key,
                            $rule['important'] ? '!important' : ''
                        );
                    }
                }
            }
        }

        return $rules;
    }

    /**
     * The support's properties with their metadata validated. `var` and each
     * rule's `css` and `selector` end up verbatim in generated CSS, so
     * anything unexpected is skipped.
     *
     * @return array<string, array{var: string, sides: bool, type: string|array<string, mixed>, rules: list<array{css: string, selector: string, important: bool}>}>
     */
    protected function properties(): array {
        $properties = [];

        foreach ( (array) ( $this->metadata['properties'] ?? [] ) as $property => $config ) {
            if ( ! is_array( $config ) || ! preg_match( '/^[a-z0-9]+$/', (string) ( $config['var'] ?? '' ) ) ) {
                continue;
            }

            $rules = self::rulesOf( $config );

            if ( [] === $rules ) {
                continue;
            }

            $properties[ (string) $property ] = [
                'var'   => $config['var'],
                'sides' => (bool) ( $config['sides'] ?? false ),
                'type'  => is_array( $config['type'] ?? null ) ? $config['type'] : (string) ( $config['type'] ?? 'spacing' ),
                'rules' => $rules,
            ];
        }

        return $properties;
    }

    /**
     * A property's valid rules: its `rules`, or one rule for its `css`.
     *
     * @param  array<string, mixed> $config
     * @return list<array{css: string, selector: string, important: bool}>
     */
    private static function rulesOf( array $config ): array {
        $rules = is_array( $config['rules'] ?? null ) ? $config['rules'] : [ [ 'css' => $config['css'] ?? null ] ];
        $valid = [];

        foreach ( $rules as $rule ) {
            $css      = is_array( $rule ) && is_string( $rule['css'] ?? null ) ? $rule['css'] : '';
            $selector = is_array( $rule ) && is_string( $rule['selector'] ?? null ) ? $rule['selector'] : '';

            if ( ! preg_match( '/^[a-z-]+$/', $css ) || ! preg_match( '/^[a-z0-9 .>+~*:()_-]*$/', $selector ) ) {
                continue;
            }

            $valid[] = [
                'css'       => $css,
                'selector'  => $selector,
                'important' => false !== ( $rule['important'] ?? true ),
            ];
        }

        return $valid;
    }

    /**
     * Value keys to read for a property, mapped to their name suffix: each
     * side for sided properties, or the value itself (empty key) otherwise.
     *
     * @param  array{sides: bool} $config
     * @return array<string, string>
     */
    private static function targets( array $config ): array {
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
