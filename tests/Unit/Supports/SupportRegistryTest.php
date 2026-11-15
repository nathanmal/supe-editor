<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Supports;

use Brain\Monkey\Functions;
use Supe\Editor\Supports\Responsive\Breakpoints;
use Supe\Editor\Supports\Responsive\StyleGenerator;
use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Supe\Editor\Supports\AbstractResponsiveSupport;
use Supe\Editor\Supports\SupportRegistry;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class SupportRegistryTest extends TestCase {

    private string $supportsDir;

    protected function set_up(): void {
        parent::set_up();

        Functions\when( 'wp_json_file_decode' )->alias(
            static fn( string $file, array $options ) => json_decode( (string) file_get_contents( $file ), $options['associative'] ?? false )
        );
        Functions\when( 'esc_html' )->returnArg( 1 );
        Functions\when( 'get_option' )->returnArg( 2 );

        $this->supportsDir = sys_get_temp_dir() . '/supe-editor-supports-' . uniqid( '', true ) . '/';

        $this->writeSupport( 'gap', [
            'name'       => 'gap',
            'properties' => [ 'gap' => [ 'css' => 'gap', 'var' => 'g', 'type' => 'spacing' ] ],
            'replaces'   => [ 'spacing' => [ 'blockGap' ] ],
            'coreBlocks' => [ 'core/group' ],
        ], '<?php return new class extends \Supe\Editor\Supports\AbstractResponsiveSupport {};' );
        $this->writeSupport( 'mismatched', [ 'name' => 'other' ], '<?php return new stdClass();' );
        $this->writeSupport( 'not-a-support', [ 'name' => 'not-a-support' ], '<?php return new stdClass();' );
    }

    protected function tear_down(): void {
        foreach ( glob( $this->supportsDir . '*/*' ) ?: [] as $file ) {
            unlink( $file );
        }

        foreach ( glob( $this->supportsDir . '*' ) ?: [] as $dir ) {
            rmdir( $dir );
        }

        rmdir( $this->supportsDir );

        parent::tear_down();
    }

    public function test_loads_supports_and_hands_them_to_the_style_generator(): void {
        $styles   = $this->styles();
        $registry = new SupportRegistry( $this->supportsDir, new ValueSanitizer(), $styles, [ 'gap' ] );

        $registry->load();

        self::assertInstanceOf( AbstractResponsiveSupport::class, $registry->get( 'gap' ) );
        self::assertSame( 'gap', $registry->get( 'gap' )->name() );
        self::assertStringContainsString( '.has-supe-g{gap:var(--supe-g)!important}', $styles->css() );
    }

    public function test_skips_misconfigured_supports(): void {
        Functions\expect( '_doing_it_wrong' )->times( 3 );

        $registry = new SupportRegistry( $this->supportsDir, new ValueSanitizer(), $this->styles(), [ 'mismatched', 'not-a-support', 'missing' ] );
        $registry->load();

        self::assertSame( [], $registry->all() );
    }

    public function test_loads_the_bundled_supports(): void {
        $registry = new SupportRegistry( dirname( __DIR__, 3 ) . '/supports/', new ValueSanitizer(), $this->styles() );
        $registry->load();

        self::assertSame( SupportRegistry::SUPPORTS, array_keys( $registry->all() ) );
    }

    public function test_opts_listed_core_blocks_in_and_adds_the_attribute(): void {
        $registry = $this->loadedRegistry();

        $args = $registry->addToBlockType( [ 'attributes' => [ 'tagName' => [ 'type' => 'string' ] ] ], 'core/group' );

        self::assertSame( [ 'gap' => true ], $args['supports']['supe'] );
        self::assertSame( [ 'type' => 'object' ], $args['attributes']['supe'] );
        self::assertArrayHasKey( 'tagName', $args['attributes'] );
    }

    public function test_adds_the_attribute_to_blocks_that_opt_in_themselves(): void {
        $args = $this->loadedRegistry()->addToBlockType( [ 'supports' => [ 'supe' => [ 'spacing' => true ] ] ], 'supe/callout' );

        self::assertSame( [ 'type' => 'object' ], $args['attributes']['supe'] );
    }

    public function test_turns_off_the_core_features_a_support_replaces_on_blocks_that_opt_in(): void {
        $args = $this->loadedRegistry()->addToBlockType(
            [ 'supports' => [ 'supe' => [ 'gap' => true ], 'spacing' => [ 'blockGap' => true, 'padding' => true ] ] ],
            'supe/box'
        );

        self::assertSame( [ 'blockGap' => false, 'padding' => true ], $args['supports']['spacing'] );
    }

    public function test_leaves_core_features_alone_on_blocks_without_them(): void {
        $args = $this->loadedRegistry()->addToBlockType( [ 'supports' => [ 'supe' => [ 'gap' => true ] ] ], 'supe/box' );

        self::assertArrayNotHasKey( 'spacing', $args['supports'] );
    }

    public function test_core_blocks_opted_in_through_core_blocks_keep_the_core_feature(): void {
        // Their saved markup depends on it; the support's bridge handles them.
        $args = $this->loadedRegistry()->addToBlockType( [ 'supports' => [ 'spacing' => [ 'blockGap' => true ] ] ], 'core/group' );

        self::assertSame( [ 'blockGap' => true ], $args['supports']['spacing'] );
        self::assertSame( [ 'gap' => true ], $args['supports']['supe'] );
    }

    public function test_respects_a_block_opting_out_of_a_core_support(): void {
        $args = $this->loadedRegistry()->addToBlockType( [ 'supports' => [ 'supe' => [ 'gap' => false ] ] ], 'core/group' );

        self::assertArrayNotHasKey( 'supe', $args['supports'] );
        self::assertArrayNotHasKey( 'attributes', $args );
    }

    public function test_leaves_other_blocks_untouched(): void {
        $args = [ 'supports' => [ 'anchor' => true ] ];

        self::assertSame( $args, $this->loadedRegistry()->addToBlockType( $args, 'core/paragraph' ) );
    }

    private function loadedRegistry(): SupportRegistry {
        $registry = new SupportRegistry( $this->supportsDir, new ValueSanitizer(), $this->styles(), [ 'gap' ] );
        $registry->load();

        return $registry;
    }

    private function styles(): StyleGenerator {
        return new StyleGenerator( new Breakpoints(), new ValueSanitizer() );
    }

    /**
     * @param array<string, mixed> $metadata
     */
    private function writeSupport( string $name, array $metadata, string $php ): void {
        mkdir( $this->supportsDir . $name, 0777, true );
        file_put_contents( $this->supportsDir . $name . '/support.json', (string) json_encode( $metadata ) );
        file_put_contents( $this->supportsDir . $name . '/support.php', $php );
    }
}
