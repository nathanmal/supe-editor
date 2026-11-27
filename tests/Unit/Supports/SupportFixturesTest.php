<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Supports;

use Brain\Monkey\Functions;
use Supe\Editor\Supports\AbstractSupport;
use Supe\Editor\Supports\Responsive\Breakpoints;
use Supe\Editor\Supports\Responsive\StyleGenerator;
use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Supe\Editor\Supports\SupportRegistry;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * Exercises AbstractResponsiveSupport through the real supports. Each
 * support's render and stylesheet cases live in
 * tests/fixtures/supports/{name}.json, shared with the JS port
 * (supports/_framework/) so both produce identical output.
 */
final class SupportFixturesTest extends TestCase {

    /**
     * @dataProvider provideRenderCases
     *
     * @param array<string, mixed>                                        $value
     * @param array{classes: list<string>, styles: array<string, string>} $expected
     */
    public function test_renders_stored_values( string $name, array $value, array $expected ): void {
        self::assertSame( $expected, self::support( $name )->output( $value ) );
    }

    /**
     * @dataProvider provideStylesheetCases
     *
     * @param array{tablet: int, mobile: int} $breakpoints
     */
    public function test_builds_the_stylesheet( string $name, array $breakpoints, string $css ): void {
        Functions\when( 'get_option' )->justReturn( $breakpoints );

        $styles = new StyleGenerator( new Breakpoints(), new ValueSanitizer() );
        $styles->addSupport( self::support( $name ) );

        self::assertSame( $css, $styles->css() );
    }

    /**
     * @dataProvider provideSupports
     */
    public function test_replaces_core_features( string $name ): void {
        self::assertSame( self::fixtures( $name )['replaces'], self::support( $name )->replacedCoreSupports() );
    }

    /**
     * @dataProvider provideSupports
     */
    public function test_is_at_version_1( string $name ): void {
        self::assertSame( 1, self::support( $name )->version() );
    }

    public function test_every_support_has_fixtures(): void {
        foreach ( SupportRegistry::SUPPORTS as $name ) {
            self::assertFileExists( self::fixturePath( $name ) );
        }
    }

    /**
     * @return iterable<string, array{0: string}>
     */
    public static function provideSupports(): iterable {
        foreach ( SupportRegistry::SUPPORTS as $name ) {
            yield $name => [ $name ];
        }
    }

    /**
     * @return iterable<string, array{0: string, 1: array<string, mixed>, 2: array<string, mixed>}>
     */
    public static function provideRenderCases(): iterable {
        foreach ( SupportRegistry::SUPPORTS as $name ) {
            foreach ( self::fixtures( $name )['render'] as $case ) {
                yield $name . ': ' . $case['label'] => [ $name, $case['value'], $case['expected'] ];
            }
        }
    }

    /**
     * @return iterable<string, array{0: string, 1: array<string, int>, 2: string}>
     */
    public static function provideStylesheetCases(): iterable {
        foreach ( SupportRegistry::SUPPORTS as $name ) {
            foreach ( self::fixtures( $name )['stylesheet'] as $case ) {
                yield $name . ': ' . $case['label'] => [ $name, $case['breakpoints'], $case['css'] ];
            }
        }
    }

    private static function support( string $name ): AbstractSupport {
        $dir      = dirname( __DIR__, 3 ) . '/supports/' . $name . '/';
        $metadata = json_decode( (string) file_get_contents( $dir . 'support.json' ), true );
        $support  = require $dir . 'support.php';
        $support->boot( $metadata, new ValueSanitizer() );

        return $support;
    }

    /**
     * @return array<string, mixed>
     */
    private static function fixtures( string $name ): array {
        return json_decode( (string) file_get_contents( self::fixturePath( $name ) ), true );
    }

    private static function fixturePath( string $name ): string {
        return dirname( __DIR__, 2 ) . '/fixtures/supports/' . $name . '.json';
    }
}
