<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Blocks;

use Supe\Editor\Blocks\ContainerBackground;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * Overlay cases live in tests/fixtures/container-background.json, shared
 * with Jest (blocks/container-background/test/overlay.test.js).
 */
final class ContainerBackgroundTest extends TestCase {

    public function test_overlay_fixture_cases(): void {
        $fixtures = json_decode( (string) file_get_contents( dirname( __DIR__, 2 ) . '/fixtures/container-background.json' ), true );

        foreach ( $fixtures['overlay'] as $case ) {
            self::assertSame( $case['expected'], ContainerBackground::overlay( $case['attributes'] ), $case['label'] );
        }
    }

    public function test_style_joins_declarations(): void {
        self::assertSame(
            'background-color:#000;opacity:0.5',
            ContainerBackground::style( [ 'background-color' => '#000', 'opacity' => '0.5' ] )
        );
    }

    public function test_type_defaults_to_image(): void {
        self::assertSame( 'video', ContainerBackground::type( [ 'type' => 'video' ] ) );
        self::assertSame( 'image', ContainerBackground::type( [ 'type' => 'image' ] ) );
        self::assertSame( 'image', ContainerBackground::type( [] ), 'Saved before types existed.' );
        self::assertSame( 'block', ContainerBackground::type( [ 'type' => 'block' ] ) );
        self::assertSame( 'image', ContainerBackground::type( [ 'type' => 'slides' ] ), 'Not a type.' );
        self::assertSame( 'image', ContainerBackground::type( [ 'type' => [ 'video' ] ] ) );
    }
}
