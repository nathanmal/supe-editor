<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Supports;

use Brain\Monkey\Functions;
use Supe\Editor\Supports\AbstractSupport;
use Supe\Editor\Supports\Responsive\Breakpoints;
use Supe\Editor\Supports\Responsive\StyleGenerator;
use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * Exercises AbstractResponsiveSupport through the real spacing support. The
 * render and stylesheet cases live in tests/fixtures/supports/spacing.json,
 * shared with the JS port (supports/_framework/) so both produce identical
 * output.
 */
final class SpacingSupportTest extends TestCase {

    private AbstractSupport $support;

    protected function set_up(): void {
        parent::set_up();

        $dir      = dirname( __DIR__, 3 ) . '/supports/spacing/';
        $metadata = json_decode( (string) file_get_contents( $dir . 'support.json' ), true );

        $this->support = require $dir . 'support.php';
        $this->support->boot( $metadata, new ValueSanitizer() );
    }

    /**
     * @dataProvider provideRenderCases
     *
     * @param array<string, mixed>                                            $value
     * @param array{classes: list<string>, styles: array<string, string>} $expected
     */
    public function test_renders_stored_values( array $value, array $expected ): void {
        self::assertSame( $expected, $this->support->output( $value ) );
    }

    /**
     * @dataProvider provideStylesheetCases
     *
     * @param array{tablet: int, mobile: int} $breakpoints
     */
    public function test_builds_the_stylesheet( array $breakpoints, string $css ): void {
        Functions\when( 'get_option' )->justReturn( $breakpoints );

        $styles = new StyleGenerator( new Breakpoints(), new ValueSanitizer() );
        $styles->addSupport( $this->support );

        self::assertSame( $css, $styles->css() );
    }

    public function test_replaces_core_padding_and_margin(): void {
        self::assertSame( [ 'spacing' => [ 'padding', 'margin' ] ], $this->support->replacedCoreSupports() );
    }

    public function test_is_at_version_1(): void {
        self::assertSame( 1, $this->support->version() );
    }

    /**
     * @return iterable<string, array{0: array<string, mixed>, 1: array<string, mixed>}>
     */
    public static function provideRenderCases(): iterable {
        foreach ( self::fixtures()['render'] as $case ) {
            yield $case['label'] => [ $case['value'], $case['expected'] ];
        }
    }

    /**
     * @return iterable<string, array{0: array<string, int>, 1: string}>
     */
    public static function provideStylesheetCases(): iterable {
        foreach ( self::fixtures()['stylesheet'] as $case ) {
            yield $case['label'] => [ $case['breakpoints'], $case['css'] ];
        }
    }

    /**
     * @return array<string, mixed>
     */
    private static function fixtures(): array {
        return json_decode( (string) file_get_contents( dirname( __DIR__, 2 ) . '/fixtures/supports/spacing.json' ), true );
    }
}
