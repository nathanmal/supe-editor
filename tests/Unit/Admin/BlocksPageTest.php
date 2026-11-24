<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Admin;

use Brain\Monkey\Functions;
use Supe\Core\Support\Container;
use Supe\Editor\Admin\BlocksPage;
use Supe\Editor\Blocks\BlockRegistrar;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class BlocksPageTest extends TestCase {

    private string $buildDir;

    protected function set_up(): void {
        parent::set_up();

        $this->stubTranslationFunctions();
        $this->stubEscapeFunctions();
        Functions\when( 'current_user_can' )->justReturn( true );

        $this->buildDir = sys_get_temp_dir() . '/supe-editor-page-test-' . uniqid( '', true ) . '/';
        mkdir( $this->buildDir );
        file_put_contents(
            $this->buildDir . 'blocks-manifest.php',
            '<?php return ' . var_export( [ 'callout' => [ 'name' => 'supe/callout', 'title' => 'Callout', 'category' => 'supe' ] ], true ) . ';'
        );
    }

    protected function tear_down(): void {
        unlink( $this->buildDir . 'blocks-manifest.php' );
        rmdir( $this->buildDir );

        parent::tear_down();
    }

    public function test_page_metadata(): void {
        $page = new BlocksPage( new Container() );

        // The slug predates the "Block Editor" name; kept so links still work.
        self::assertSame( 'supe-editor-blocks', BlocksPage::slug() );
        self::assertSame( 'Block Editor', $page->menuTitle() );
        self::assertSame( 'Block Editor', $page->pageTitle() );
        self::assertSame( 'Custom blocks, block supports and changes to the block editor itself.', $page->description() );
        self::assertSame( 'supe', $page->parentSlug() );
        self::assertSame( 'manage_options', $page->capability() );
    }

    public function test_render_lists_every_discovered_block(): void {
        $container = new Container();
        $container->instance( 'supe.editor.registrar', new BlockRegistrar( $this->buildDir ) );

        $page = new BlocksPage( $container );

        ob_start();
        $page->render();
        $output = ob_get_clean();

        self::assertStringContainsString( 'supe-admin', $output ); // rendered inside the shared Supe shell
        self::assertStringContainsString( '<td>Callout</td>', $output );
        self::assertStringContainsString( '<code class="supe-admin__code">supe/callout</code>', $output );
        self::assertStringContainsString( 'supe-admin__badge--neutral">supe</span>', $output );
        self::assertStringContainsString( '1 block available in the editor.', $output );
    }

    public function test_render_shows_a_message_when_no_blocks_are_compiled(): void {
        $empty = sys_get_temp_dir() . '/supe-editor-page-empty-' . uniqid( '', true ) . '/';
        mkdir( $empty );

        $container = new Container();
        $container->instance( 'supe.editor.registrar', new BlockRegistrar( $empty ) );

        $page = new BlocksPage( $container );

        ob_start();
        $page->render();
        $output = ob_get_clean();

        rmdir( $empty );

        self::assertStringContainsString( 'No compiled blocks found', $output );
    }
}
