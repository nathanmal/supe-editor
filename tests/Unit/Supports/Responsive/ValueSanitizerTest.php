<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Supports\Responsive;

use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * Cases live in tests/fixtures/value-sanitizer.json, shared with the JS port
 * (supports/_framework/sanitize.js) so both sanitize identically.
 */
final class ValueSanitizerTest extends TestCase {

    /**
     * @dataProvider provideValues
     *
     * @param string|array{type: string, min?: int, max?: int} $type
     */
    public function test_sanitizes( string|array $type, mixed $value, ?string $expected ): void {
        self::assertSame( $expected, ( new ValueSanitizer() )->sanitize( $value, $type ) );
    }

    /**
     * @return iterable<string, array{0: string|array<string, mixed>, 1: mixed, 2: ?string}>
     */
    public static function provideValues(): iterable {
        $fixtures = json_decode( (string) file_get_contents( dirname( __DIR__, 3 ) . '/fixtures/value-sanitizer.json' ), true );

        foreach ( $fixtures['cases'] as [ $label, $type, $value, $expected ] ) {
            yield $label => [ $type, $value, $expected ];
        }
    }
}
