<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Blocks;

use Supe\Editor\Blocks\Fader;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * Timing cases live in tests/fixtures/fader-timing.json, shared with Jest
 * (blocks/fader/test/timing.test.js).
 */
final class FaderTest extends TestCase {

    public function test_timing_fixture_cases(): void {
        $fixtures = json_decode( (string) file_get_contents( dirname( __DIR__, 2 ) . '/fixtures/fader-timing.json' ), true );

        foreach ( $fixtures['cases'] as $case ) {
            self::assertSame( $case['expected'], Fader::timing( $case['attributes'] ), $case['label'] );
        }
    }
}
