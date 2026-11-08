<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Feature;

use Supe\Core\Core;
use Yoast\WPTestUtils\WPIntegration\TestCase;

final class SupeEditorBootTest extends TestCase {

    public function test_module_registers_and_boots_inside_real_wordpress(): void {
        self::assertTrue(
            Core::getInstance()->getRegistry()->isLoaded( 'nathanmal/supe-editor' )
        );
    }

    public function test_the_supe_block_category_is_registered(): void {
        $categories = apply_filters( 'block_categories_all', [], null );

        self::assertContains( 'supe', array_column( $categories, 'slug' ) );
    }
}
