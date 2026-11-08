<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Responsive;

use Brain\Monkey\Functions;
use Supe\Editor\Responsive\Breakpoints;
use Supe\Editor\Responsive\Viewport;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class BreakpointsTest extends TestCase {

    public function test_uses_defaults_when_nothing_is_saved(): void {
        Functions\when( 'get_option' )->returnArg( 2 );

        self::assertSame( Breakpoints::DEFAULTS, ( new Breakpoints() )->all() );
    }

    public function test_returns_saved_breakpoints(): void {
        Functions\when( 'get_option' )->justReturn( [ 'tablet' => 900, 'mobile' => 480 ] );

        $breakpoints = new Breakpoints();

        self::assertNull( $breakpoints->maxWidth( Viewport::Desktop ) );
        self::assertSame( 900, $breakpoints->maxWidth( Viewport::Tablet ) );
        self::assertSame( 480, $breakpoints->maxWidth( Viewport::Mobile ) );
    }

    public function test_invalid_widths_fall_back_to_their_defaults(): void {
        $sanitized = ( new Breakpoints() )->sanitize( [ 'tablet' => 'wide', 'mobile' => '500' ] );

        self::assertSame( [ 'tablet' => 1024, 'mobile' => 500 ], $sanitized );
    }

    public function test_mobile_not_narrower_than_tablet_falls_back_to_defaults(): void {
        $breakpoints = new Breakpoints();

        self::assertSame( Breakpoints::DEFAULTS, $breakpoints->sanitize( [ 'tablet' => 600, 'mobile' => 600 ] ) );
        self::assertSame( Breakpoints::DEFAULTS, $breakpoints->sanitize( [ 'tablet' => 500, 'mobile' => 800 ] ) );
    }

    public function test_out_of_range_and_non_array_values_are_rejected(): void {
        $breakpoints = new Breakpoints();

        self::assertSame( Breakpoints::DEFAULTS, $breakpoints->sanitize( 'nope' ) );
        self::assertSame( Breakpoints::DEFAULTS, $breakpoints->sanitize( [ 'tablet' => 0, 'mobile' => -5 ] ) );
        self::assertSame( Breakpoints::DEFAULTS, $breakpoints->sanitize( [ 'tablet' => 100000, 'mobile' => 600 ] ) );
    }
}
