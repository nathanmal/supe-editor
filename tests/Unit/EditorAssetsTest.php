<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit;

use Brain\Monkey\Functions;
use Supe\Editor\Services\EditorAssets;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class EditorAssetsTest extends TestCase {

    private string $buildDir;

    protected function set_up(): void {
        parent::set_up();

        $this->buildDir = sys_get_temp_dir() . '/supe-editor-assets-' . uniqid( '', true ) . '/';
        mkdir( $this->buildDir . 'editor', 0777, true );
        file_put_contents(
            $this->buildDir . 'editor/index.asset.php',
            "<?php return array( 'dependencies' => array( 'wp-plugins', 'wp-editor' ), 'version' => 'abc123' );"
        );
    }

    protected function tear_down(): void {
        unlink( $this->buildDir . 'editor/index.asset.php' );
        rmdir( $this->buildDir . 'editor' );
        rmdir( $this->buildDir );

        parent::tear_down();
    }

    public function test_hooks_into_the_block_editor(): void {
        $assets = new EditorAssets( $this->buildDir, '/plugin/bootstrap.php' );
        $assets->register();

        self::assertNotFalse( has_action( 'enqueue_block_editor_assets', [ $assets, 'enqueue' ] ) );
    }

    public function test_enqueues_the_bundle_with_its_asset_file_dependencies(): void {
        Functions\expect( 'plugins_url' )
            ->once()
            ->with( 'build/editor/index.js', '/plugin/bootstrap.php' )
            ->andReturn( 'https://example.test/build/editor/index.js' );
        Functions\expect( 'wp_enqueue_script' )
            ->once()
            ->with(
                EditorAssets::HANDLE,
                'https://example.test/build/editor/index.js',
                [ 'wp-plugins', 'wp-editor' ],
                'abc123',
                [ 'in_footer' => true ]
            );
        Functions\expect( 'wp_set_script_translations' )
            ->once()
            ->with( EditorAssets::HANDLE, 'supe-editor' );

        ( new EditorAssets( $this->buildDir, '/plugin/bootstrap.php' ) )->enqueue();
    }

    public function test_enqueues_nothing_before_the_bundle_is_built(): void {
        Functions\expect( 'wp_enqueue_script' )->never();

        $empty = sys_get_temp_dir() . '/supe-editor-empty-' . uniqid( '', true ) . '/';
        mkdir( $empty );

        ( new EditorAssets( $empty, '/plugin/bootstrap.php' ) )->enqueue();

        rmdir( $empty );
    }
}
