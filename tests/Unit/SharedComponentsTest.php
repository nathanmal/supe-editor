<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit;

use Brain\Monkey\Functions;
use Supe\Editor\SharedComponents;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class SharedComponentsTest extends TestCase {

    private string $buildDir;

    protected function set_up(): void {
        parent::set_up();

        $this->buildDir = sys_get_temp_dir() . '/supe-editor-components-' . uniqid( '', true ) . '/';
        mkdir( $this->buildDir . 'components', 0777, true );
        file_put_contents(
            $this->buildDir . 'components/index.asset.php',
            "<?php return array( 'dependencies' => array( 'wp-components', 'wp-data' ), 'version' => 'abc123' );"
        );
    }

    protected function tear_down(): void {
        unlink( $this->buildDir . 'components/index.asset.php' );
        rmdir( $this->buildDir . 'components' );
        rmdir( $this->buildDir );

        parent::tear_down();
    }

    public function test_registers_on_init(): void {
        $components = new SharedComponents( $this->buildDir, '/plugin/bootstrap.php' );
        $components->register();

        self::assertNotFalse( has_action( 'init', [ $components, 'registerScript' ] ) );
    }

    public function test_registers_the_script_without_enqueueing_it(): void {
        Functions\expect( 'plugins_url' )
            ->once()
            ->with( 'build/components/index.js', '/plugin/bootstrap.php' )
            ->andReturn( 'https://example.test/build/components/index.js' );
        Functions\expect( 'wp_register_script' )
            ->once()
            ->with(
                SharedComponents::HANDLE,
                'https://example.test/build/components/index.js',
                [ 'wp-components', 'wp-data' ],
                'abc123',
                [ 'in_footer' => true ]
            );
        Functions\expect( 'wp_set_script_translations' )
            ->once()
            ->with( SharedComponents::HANDLE, 'supe-editor' );
        Functions\expect( 'wp_enqueue_script' )->never();

        ( new SharedComponents( $this->buildDir, '/plugin/bootstrap.php' ) )->registerScript();
    }

    public function test_registers_nothing_before_the_script_is_built(): void {
        Functions\expect( 'wp_register_script' )->never();

        $empty = sys_get_temp_dir() . '/supe-editor-empty-' . uniqid( '', true ) . '/';
        mkdir( $empty );

        ( new SharedComponents( $empty, '/plugin/bootstrap.php' ) )->registerScript();

        rmdir( $empty );
    }
}
