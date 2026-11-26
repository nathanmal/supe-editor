<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Blocks\Slides;

use Brain\Monkey\Functions;
use Supe\Editor\Blocks\Slides\Controls;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class ControlsTest extends TestCase {

    protected function set_up(): void {
        parent::set_up();

        Functions\when( 'esc_attr' )->returnArg();
    }

    public function test_the_position_class_falls_back_to_the_default_cell(): void {
        self::assertSame( [ 'is-position-top-left' ], Controls::classes( [ 'position' => 'top-left' ], 'center-left' ) );
        self::assertSame( [ 'is-position-center-left' ], Controls::classes( [ 'position' => 'middle"><script>' ], 'center-left' ) );
        self::assertSame( [ 'is-position-bottom-right' ], Controls::classes( [], 'bottom-right' ) );
    }

    public function test_unknown_arrow_sets_use_the_chevron(): void {
        self::assertSame( 'caret', Controls::arrowSet( 'caret' ) );
        self::assertSame( 'chevron', Controls::arrowSet( 'zigzag' ) );
        self::assertSame( Controls::arrow( 'chevron' ), Controls::arrow( null ) );
    }

    public function test_every_preset_renders_as_a_hidden_svg(): void {
        foreach ( Controls::ARROW_SETS as $set ) {
            $svg = Controls::arrow( $set );

            self::assertStringStartsWith( '<svg class="supe-slides__icon" viewBox="0 0 24 24"', $svg, $set );
            self::assertStringContainsString( 'aria-hidden="true"', $svg );
            self::assertStringContainsString( '<path', $svg );
        }

        self::assertStringContainsString( 'class="supe-slides__icon is-pause"', Controls::icon( 'pause' ) );
        self::assertStringContainsString( 'class="supe-slides__icon is-play"', Controls::icon( 'play' ) );
        self::assertSame( '', Controls::icon( 'missing' ) );
    }
}
