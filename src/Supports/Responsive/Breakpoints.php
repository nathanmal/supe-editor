<?php

declare(strict_types=1);

namespace Supe\Editor\Supports\Responsive;

/**
 * Breakpoints
 *
 * The site-wide tablet/mobile breakpoints every responsive value shares,
 * stored in one option. Desktop is the base and has no breakpoint; tablet
 * and mobile overrides apply at or below their max widths.
 */
final class Breakpoints {

    public const OPTION = 'supe_editor_breakpoints';

    public const DEFAULTS = [
        'tablet' => 1024,
        'mobile' => 600,
    ];

    private const MAX_WIDTH = 9999;

    public function register(): void {
        add_action( 'init', [ $this, 'registerSetting' ] );
    }

    public function registerSetting(): void {
        $width = [
            'type'    => 'integer',
            'minimum' => 1,
            'maximum' => self::MAX_WIDTH,
        ];

        register_setting( 'supe_editor', self::OPTION, [
            'type'              => 'object',
            'description'       => __( 'Max widths (px) at which tablet and mobile responsive values apply.', 'supe-editor' ),
            'default'           => self::DEFAULTS,
            'sanitize_callback' => [ $this, 'sanitize' ],
            'show_in_rest'      => [
                'schema' => [
                    'type'                 => 'object',
                    'properties'           => [ 'tablet' => $width, 'mobile' => $width ],
                    'additionalProperties' => false,
                ],
            ],
        ] );
    }

    /**
     * @return array{tablet: int, mobile: int}
     */
    public function all(): array {
        return $this->sanitize( get_option( self::OPTION, self::DEFAULTS ) );
    }

    /**
     * Max width (px) at which a viewport's overrides apply; null for desktop,
     * which is the unconditional base.
     */
    public function maxWidth( Viewport $viewport ): ?int {
        if ( Viewport::Desktop === $viewport ) {
            return null;
        }

        return $this->all()[ $viewport->value ];
    }

    /**
     * Invalid widths fall back to their default; a pair where mobile isn't
     * narrower than tablet falls back to the defaults entirely, since either
     * value alone could be the wrong one.
     *
     * @return array{tablet: int, mobile: int}
     */
    public function sanitize( mixed $value ): array {
        if ( ! is_array( $value ) ) {
            return self::DEFAULTS;
        }

        $tablet = $this->toWidth( $value['tablet'] ?? null ) ?? self::DEFAULTS['tablet'];
        $mobile = $this->toWidth( $value['mobile'] ?? null ) ?? self::DEFAULTS['mobile'];

        if ( $mobile >= $tablet ) {
            return self::DEFAULTS;
        }

        return [
            'tablet' => $tablet,
            'mobile' => $mobile,
        ];
    }

    private function toWidth( mixed $value ): ?int {
        $width = filter_var( $value, FILTER_VALIDATE_INT, [
            'options' => [ 'min_range' => 1, 'max_range' => self::MAX_WIDTH ],
        ] );

        return false === $width ? null : $width;
    }
}
