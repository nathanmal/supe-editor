<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Supports;

use Brain\Monkey\Functions;
use Supe\Editor\Supports\Responsive\Breakpoints;
use Supe\Editor\Supports\SupportAssets;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class SupportAssetsTest extends TestCase {

    private string $buildDir;

    protected function set_up(): void {
        parent::set_up();

        $this->buildDir = sys_get_temp_dir() . '/supe-editor-support-assets-' . uniqid( '', true ) . '/';
        mkdir( $this->buildDir . 'supports', 0777, true );
        file_put_contents(
            $this->buildDir . 'supports/index.asset.php',
            "<?php return array( 'dependencies' => array( 'supe-editor-components', 'wp-hooks' ), 'version' => 'abc123' );"
        );

        Functions\when( 'get_option' )->justReturn( [ 'tablet' => 900, 'mobile' => 480 ] );
        Functions\when( 'wp_json_encode' )->alias( 'json_encode' );
    }

    protected function tear_down(): void {
        unlink( $this->buildDir . 'supports/index.asset.php' );
        rmdir( $this->buildDir . 'supports' );
        rmdir( $this->buildDir );

        parent::tear_down();
    }

    public function test_hooks_into_the_block_editor(): void {
        $assets = $this->assets( $this->buildDir );
        $assets->register();

        self::assertNotFalse( has_action( 'enqueue_block_editor_assets', [ $assets, 'enqueue' ] ) );
    }

    public function test_enqueues_the_script_with_the_site_settings(): void {
        Functions\expect( 'plugins_url' )
            ->once()
            ->with( 'build/supports/index.js', '/plugin/bootstrap.php' )
            ->andReturn( 'https://example.test/build/supports/index.js' );
        Functions\expect( 'wp_enqueue_script' )
            ->once()
            ->with(
                SupportAssets::HANDLE,
                'https://example.test/build/supports/index.js',
                [ 'supe-editor-components', 'wp-hooks' ],
                'abc123',
                [ 'in_footer' => true ]
            );
        Functions\expect( 'wp_add_inline_script' )
            ->once()
            ->with(
                SupportAssets::HANDLE,
                'window.supeEditor=window.supeEditor||{};window.supeEditor.settings={"breakpoints":{"tablet":900,"mobile":480}};',
                'before'
            );
        Functions\expect( 'wp_set_script_translations' )
            ->once()
            ->with( SupportAssets::HANDLE, 'supe-editor' );

        $this->assets( $this->buildDir )->enqueue();
    }

    public function test_enqueues_nothing_before_the_script_is_built(): void {
        Functions\expect( 'wp_enqueue_script' )->never();

        $empty = sys_get_temp_dir() . '/supe-editor-empty-' . uniqid( '', true ) . '/';
        mkdir( $empty );

        $this->assets( $empty )->enqueue();

        rmdir( $empty );
    }

    private function assets( string $buildDir ): SupportAssets {
        return new SupportAssets( $buildDir, '/plugin/bootstrap.php', new Breakpoints() );
    }
}
