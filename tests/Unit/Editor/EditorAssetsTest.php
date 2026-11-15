<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Editor;

use Brain\Monkey\Functions;
use Supe\Editor\Editor\EditorAssets;
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

        Functions\when( 'plugins_url' )->alias(
            static fn( string $path ): string => 'https://example.test/' . $path
        );
    }

    protected function tear_down(): void {
        array_map( 'unlink', glob( $this->buildDir . 'editor/*' ) );
        rmdir( $this->buildDir . 'editor' );
        rmdir( $this->buildDir );

        parent::tear_down();
    }

    public function test_hooks_into_the_editor_and_its_canvas(): void {
        $assets = new EditorAssets( $this->buildDir, '/plugin/bootstrap.php' );
        $assets->register();

        self::assertNotFalse( has_action( 'enqueue_block_editor_assets', [ $assets, 'enqueue' ] ) );
        self::assertNotFalse( has_action( 'enqueue_block_assets', [ $assets, 'enqueueCanvas' ] ) );
    }

    public function test_enqueues_the_bundle_with_its_asset_file_dependencies(): void {
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
        Functions\expect( 'wp_enqueue_style' )->never();

        ( new EditorAssets( $this->buildDir, '/plugin/bootstrap.php' ) )->enqueue();
    }

    public function test_enqueues_editor_ui_styles_once_built(): void {
        file_put_contents( $this->buildDir . 'editor/index.css', '.x{}' );

        Functions\when( 'wp_enqueue_script' )->justReturn();
        Functions\when( 'wp_set_script_translations' )->justReturn();
        Functions\expect( 'wp_enqueue_style' )
            ->once()
            ->with(
                EditorAssets::HANDLE,
                'https://example.test/build/editor/index.css',
                [],
                (string) filemtime( $this->buildDir . 'editor/index.css' )
            );

        ( new EditorAssets( $this->buildDir, '/plugin/bootstrap.php' ) )->enqueue();
    }

    public function test_enqueues_canvas_styles_in_the_editor_only(): void {
        file_put_contents( $this->buildDir . 'editor/canvas.css', '.x{}' );
        $assets = new EditorAssets( $this->buildDir, '/plugin/bootstrap.php' );

        Functions\expect( 'is_admin' )->twice()->andReturn( false, true );
        Functions\expect( 'wp_enqueue_style' )
            ->once()
            ->with( EditorAssets::CANVAS_HANDLE, 'https://example.test/build/editor/canvas.css', [], \Mockery::type( 'string' ) );

        $assets->enqueueCanvas();
        $assets->enqueueCanvas();
    }

    public function test_enqueues_nothing_before_the_bundle_is_built(): void {
        Functions\expect( 'wp_enqueue_script' )->never();
        Functions\expect( 'wp_enqueue_style' )->never();
        Functions\when( 'is_admin' )->justReturn( true );

        $empty  = sys_get_temp_dir() . '/supe-editor-empty-' . uniqid( '', true ) . '/';
        mkdir( $empty );
        $assets = new EditorAssets( $empty, '/plugin/bootstrap.php' );

        $assets->enqueue();
        $assets->enqueueCanvas();

        rmdir( $empty );
    }
}
