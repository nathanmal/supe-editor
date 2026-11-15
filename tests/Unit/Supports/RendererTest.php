<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Supports;

use Brain\Monkey\Functions;
use Supe\Editor\Supports\Responsive\Breakpoints;
use Supe\Editor\Supports\Responsive\StyleGenerator;
use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Supe\Editor\Supports\Renderer;
use Supe\Editor\Supports\SupportRegistry;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * Covers what Renderer decides. Applying it to markup (WP_HTML_Tag_Processor)
 * and the block type lookup need real WordPress, so they belong to Feature tests.
 */
final class RendererTest extends TestCase {

    private Renderer $renderer;

    protected function set_up(): void {
        parent::set_up();

        Functions\when( 'wp_json_file_decode' )->alias(
            static fn( string $file, array $options ) => json_decode( (string) file_get_contents( $file ), $options['associative'] ?? false )
        );
        Functions\when( 'get_option' )->returnArg( 2 );

        $sanitizer = new ValueSanitizer();
        $styles    = new StyleGenerator( new Breakpoints(), $sanitizer );
        $registry  = new SupportRegistry( dirname( __DIR__, 3 ) . '/supports/', $sanitizer, $styles );
        $registry->load();

        $this->renderer = new Renderer( $registry, $styles );
    }

    public function test_collects_output_from_enabled_supports(): void {
        $output = $this->renderer->collect(
            [ 'spacing' => [ 'padding' => [ 'desktop' => [ 'top' => '1rem' ] ] ] ],
            [ 'spacing' ]
        );

        self::assertSame( [ 'has-supe-pt' ], $output['classes'] );
        self::assertSame( [ '--supe-pt' => '1rem' ], $output['styles'] );
    }

    public function test_ignores_supports_the_block_type_does_not_enable(): void {
        $output = $this->renderer->collect(
            [ 'spacing' => [ 'padding' => [ 'desktop' => [ 'top' => '1rem' ] ] ] ],
            []
        );

        self::assertSame( [ 'classes' => [], 'styles' => [] ], $output );
    }

    public function test_ignores_malformed_values(): void {
        self::assertSame(
            [ 'classes' => [], 'styles' => [] ],
            $this->renderer->collect( [ 'spacing' => '1rem' ], [ 'spacing' ] )
        );
    }

    public function test_passes_through_blocks_without_support_values(): void {
        $html = '<div class="wp-block-group"></div>';

        self::assertSame( $html, $this->renderer->renderBlock( $html, [ 'blockName' => 'core/group', 'attrs' => [] ] ) );
        self::assertSame( '', $this->renderer->renderBlock( '', [ 'blockName' => 'core/group', 'attrs' => [ 'supe' => [] ] ] ) );
    }
}
