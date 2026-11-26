<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Blocks\Slides;

use Supe\Editor\Blocks\Slides\Config;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * Cases live in tests/fixtures/slides-config.json, shared with Jest
 * (blocks/slides/shared/test/config.test.js).
 */
final class ConfigTest extends TestCase {

    public function test_fixture_cases(): void {
        $fixtures = json_decode( (string) file_get_contents( dirname( __DIR__, 3 ) . '/fixtures/slides-config.json' ), true );

        foreach ( $fixtures['cases'] as $case ) {
            $config = Config::from( $case['attributes'] );

            self::assertSame( $case['expected']['config'], $config, $case['label'] );
            self::assertSame( $case['expected']['classes'], Config::classes( $config ), $case['label'] );
        }
    }
}
