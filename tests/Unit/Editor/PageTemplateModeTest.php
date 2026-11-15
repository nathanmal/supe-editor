<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Editor;

use Brain\Monkey\Functions;
use Supe\Editor\Editor\PageTemplateMode;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class PageTemplateModeTest extends TestCase {

    public function test_hooks_into_init(): void {
        $mode = new PageTemplateMode();
        $mode->register();

        self::assertNotFalse( has_action( 'init', [ $mode, 'setDefaultMode' ] ) );
    }

    public function test_opens_pages_template_locked_when_the_theme_asks(): void {
        Functions\when( 'current_theme_supports' )->justReturn( true );
        Functions\expect( 'add_post_type_support' )
            ->once()
            ->with( 'page', 'editor', [ 'default-mode' => 'template-locked' ] );

        ( new PageTemplateMode() )->setDefaultMode();
    }

    public function test_leaves_the_editor_alone_for_other_themes(): void {
        Functions\expect( 'current_theme_supports' )
            ->once()
            ->with( PageTemplateMode::THEME_SUPPORT )
            ->andReturn( false );
        Functions\expect( 'add_post_type_support' )->never();

        ( new PageTemplateMode() )->setDefaultMode();
    }
}
