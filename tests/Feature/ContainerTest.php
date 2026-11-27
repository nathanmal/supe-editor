<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Feature;

use Yoast\WPTestUtils\WPIntegration\TestCase;

/**
 * Renders the Container from build/ (run `npm run build` first). Its save()
 * output is a plain div; layout classes and styles are added by core at
 * render time.
 */
final class ContainerTest extends TestCase {

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function layouts(): array {
        return [
            'constrained (Container)' => [ '{"type":"constrained"}', 'is-layout-constrained' ],
            'flex (Row)'              => [ '{"type":"flex","flexWrap":"nowrap"}', 'is-layout-flex' ],
            'flex vertical (Stack)'   => [ '{"type":"flex","orientation":"vertical"}', 'is-layout-flex' ],
            'grid (Grid)'             => [ '{"type":"grid"}', 'is-layout-grid' ],
        ];
    }

    /**
     * @dataProvider layouts
     */
    public function test_a_layout_adds_core_layout_classes( string $layout, string $class ): void {
        $html = do_blocks(
            '<!-- wp:supe-container/container {"layout":' . $layout . '} -->'
            . '<div class="wp-block-supe-container-container"><!-- wp:paragraph --><p>One</p><!-- /wp:paragraph --></div>'
            . '<!-- /wp:supe-container/container -->'
        );

        $processor = new \WP_HTML_Tag_Processor( $html );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'wp-block-supe-container-container' ] ) );
        self::assertTrue( $processor->has_class( $class ) );
        self::assertTrue( $processor->has_class( 'wp-block-supe-container-container-' . $class ) );
    }

    public function test_a_container_saved_before_layout_support_renders_as_flow(): void {
        // The markup of page 27 on supe.test (saved with 0.1.0).
        $html = do_blocks(
            '<!-- wp:supe-container/container {"supe":{"spacing":{"padding":{"desktop":{"top":"0px","bottom":"0px"}},"v":1}},"align":"full"} -->'
            . '<div class="wp-block-supe-container-container alignfull"></div>'
            . '<!-- /wp:supe-container/container -->'
        );

        $processor = new \WP_HTML_Tag_Processor( $html );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'wp-block-supe-container-container' ] ) );
        self::assertTrue( $processor->has_class( 'is-layout-flow' ) );
        self::assertTrue( $processor->has_class( 'alignfull' ) );
    }

    public function test_colors_are_saved_as_core_classes(): void {
        $html = do_blocks(
            '<!-- wp:supe-container/container {"textColor":"base","backgroundColor":"contrast","layout":{"type":"constrained"}} -->'
            . '<div class="wp-block-supe-container-container has-base-color has-contrast-background-color has-text-color has-background"></div>'
            . '<!-- /wp:supe-container/container -->'
        );

        $processor = new \WP_HTML_Tag_Processor( $html );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'wp-block-supe-container-container' ] ) );
        foreach ( [ 'has-base-color', 'has-contrast-background-color', 'has-text-color', 'has-background' ] as $class ) {
            self::assertTrue( $processor->has_class( $class ), $class );
        }
    }

    public function test_the_block_declares_its_supports(): void {
        $block = \WP_Block_Type_Registry::get_instance()->get_registered( 'supe-container/container' );

        self::assertNotNull( $block );
        self::assertTrue( $block->supports['color']['text'] );
        self::assertTrue( $block->supports['color']['background'] );
        self::assertTrue( $block->supports['layout']['allowSizingOnChildren'] );
        self::assertTrue( $block->supports['supe']['spacing'] );
    }
}
