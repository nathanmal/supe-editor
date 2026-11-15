<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Blocks;

use Brain\Monkey\Functions;
use Supe\Editor\Blocks\BlockCategory;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class BlockCategoryTest extends TestCase {

    public function test_adds_the_supe_category_when_missing(): void {
        Functions\when( '__' )->returnArg( 1 );

        $result = ( new BlockCategory() )->addCategory( [
            [ 'slug' => 'text', 'title' => 'Text' ],
        ] );

        self::assertSame( 'supe', $result[0]['slug'] );
        self::assertCount( 2, $result );
    }

    public function test_does_not_duplicate_an_existing_supe_category(): void {
        $existing = [
            [ 'slug' => 'supe', 'title' => 'Already there' ],
        ];

        self::assertSame( $existing, ( new BlockCategory() )->addCategory( $existing ) );
    }
}
