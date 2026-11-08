<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit;

use Brain\Monkey\Functions;
use Supe\Editor\Services\BlockRegistrar;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class BlockRegistrarTest extends TestCase {

    private string $buildDir;

    protected function set_up(): void {
        parent::set_up();

        $this->buildDir = sys_get_temp_dir() . '/supe-editor-test-' . uniqid( '', true ) . '/';
        mkdir( $this->buildDir );
        file_put_contents(
            $this->buildDir . 'blocks-manifest.php',
            '<?php return ' . var_export( [ 'callout' => [ 'name' => 'supe/callout' ] ], true ) . ';'
        );
    }

    protected function tear_down(): void {
        unlink( $this->buildDir . 'blocks-manifest.php' );
        rmdir( $this->buildDir );

        parent::tear_down();
    }

    public function test_registers_the_manifest_collection(): void {
        Functions\expect( 'wp_register_block_types_from_metadata_collection' )
            ->once()
            ->with( $this->buildDir, $this->buildDir . 'blocks-manifest.php' );

        ( new BlockRegistrar( $this->buildDir ) )->registerBlocks();
    }

    public function test_registers_nothing_when_there_is_no_manifest(): void {
        Functions\expect( 'wp_register_block_types_from_metadata_collection' )->never();

        $empty = sys_get_temp_dir() . '/supe-editor-empty-' . uniqid( '', true ) . '/';
        mkdir( $empty );

        ( new BlockRegistrar( $empty ) )->registerBlocks();

        rmdir( $empty );
    }

    public function test_discover_returns_the_manifest_metadata(): void {
        $registrar = new BlockRegistrar( $this->buildDir );

        self::assertSame(
            [ 'callout' => [ 'name' => 'supe/callout' ] ],
            $registrar->discover()
        );
    }
}
