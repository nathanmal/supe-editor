<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Feature;

use WP_Block_Type_Registry;
use Yoast\WPTestUtils\WPIntegration\TestCase;

final class ResponsiveSupportsTest extends TestCase {

    private const BLOCK = 'supe-test/box';

    public function set_up(): void {
        parent::set_up();

        register_block_type( self::BLOCK, [
            'supports'        => [ 'supe' => [ 'spacing' => true ] ],
            'render_callback' => static fn(): string => '<div class="box" style="color:red;">hi</div>',
        ] );
    }

    public function tear_down(): void {
        unregister_block_type( self::BLOCK );

        parent::tear_down();
    }

    public function test_blocks_that_opt_in_get_the_supe_attribute(): void {
        $type = WP_Block_Type_Registry::get_instance()->get_registered( self::BLOCK );

        self::assertSame( [ 'type' => 'object' ], $type->attributes['supe'] );
    }

    public function test_renders_classes_and_variables_onto_the_wrapper(): void {
        $html = render_block( $this->parsedBlock( self::BLOCK, [
            'padding' => [ 'desktop' => [ 'top' => 'var:preset|spacing|40' ], 'mobile' => [ 'top' => '1rem' ] ],
            'margin'  => [ 'tablet' => [ 'bottom' => '1px;background:red' ] ],
        ] ) );

        self::assertSame(
            '<div class="box has-supe-pt has-supe-pt-m" style="color:red;--supe-pt:var(--wp--preset--spacing--40);--supe-pt-m:1rem">hi</div>',
            $html
        );
        self::assertTrue( wp_style_is( 'supe-responsive', 'enqueued' ) );
    }

    /**
     * The editor collects the canvas iframe's styles in temporary WP_Styles
     * instances, running `enqueue_block_assets` again each time — the
     * stylesheet has to make it into every collection.
     */
    public function test_the_stylesheet_reaches_every_editor_canvas_collection(): void {
        set_current_screen( 'post' );

        do_action( 'enqueue_block_assets' );
        $first  = _wp_get_iframed_editor_assets();
        $second = _wp_get_iframed_editor_assets();

        self::assertStringContainsString( '.has-supe-pt{padding-top:var(--supe-pt)!important}', $first['styles'] );
        self::assertStringContainsString( '.has-supe-pt{padding-top:var(--supe-pt)!important}', $second['styles'] );

        set_current_screen( 'front' );
    }

    public function test_leaves_blocks_without_the_support_untouched(): void {
        $html = render_block( $this->parsedBlock( 'core/separator', [
            'padding' => [ 'desktop' => [ 'top' => '1rem' ] ],
        ], '<hr class="wp-block-separator"/>' ) );

        self::assertStringNotContainsString( 'supe-', $html );
    }

    /**
     * @param  array<string, mixed> $spacing
     * @return array<string, mixed>
     */
    private function parsedBlock( string $name, array $spacing, string $html = '' ): array {
        return [
            'blockName'    => $name,
            'attrs'        => [ 'supe' => [ 'spacing' => $spacing ] ],
            'innerBlocks'  => [],
            'innerHTML'    => $html,
            'innerContent' => [ $html ],
        ];
    }
}
