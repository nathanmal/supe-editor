<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Feature;

use Supe\Editor\Blocks\ContainerBackground;
use Yoast\WPTestUtils\WPIntegration\TestCase;

/**
 * Renders the Container from build/ (run `npm run build` first). Its save()
 * output is a plain div; layout classes and styles are added by core at
 * render time.
 */
final class ContainerTest extends TestCase {

    public function set_up(): void {
        parent::set_up();

        wp_dequeue_script_module( ContainerBackground::VIEW_MODULE );
    }

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
        self::assertFalse( $block->supports['layout']['allowOrientation'] );
        self::assertFalse( $block->supports['layout']['allowJustification'] );
        self::assertFalse( $block->supports['layout']['allowVerticalAlignment'] );
        self::assertTrue( $block->supports['supe']['layout'] );
        self::assertTrue( $block->supports['supe']['dimensions'] );
        self::assertTrue( $block->supports['supe']['spacing'] );
    }

    public function test_responsive_layout_and_min_height_render_onto_the_wrapper(): void {
        $html = do_blocks(
            '<!-- wp:supe-container/container {"layout":{"type":"flex","orientation":"vertical"},"supe":{"layout":{"v":1,"gap":{"desktop":"var:preset|spacing|40"},"direction":{"mobile":"row"},"align":{"desktop":"stretch"}},"dimensions":{"v":1,"minHeight":{"desktop":"60vh","mobile":"0"}}}} -->'
            . '<div class="wp-block-supe-container-container"><!-- wp:paragraph --><p>One</p><!-- /wp:paragraph --></div>'
            . '<!-- /wp:supe-container/container -->'
        );

        $processor = new \WP_HTML_Tag_Processor( $html );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'wp-block-supe-container-container' ] ) );
        foreach ( [ 'is-layout-flex', 'is-vertical', 'has-supe-g', 'has-supe-fd-m', 'has-supe-ai', 'has-supe-mh', 'has-supe-mh-m' ] as $class ) {
            self::assertTrue( $processor->has_class( $class ), $class );
        }

        $style = (string) $processor->get_attribute( 'style' );
        self::assertStringContainsString( '--supe-g:var(--wp--preset--spacing--40)', $style );
        self::assertStringContainsString( '--supe-fd-m:row', $style );
        self::assertStringContainsString( '--supe-mh:60vh', $style );
        self::assertTrue( wp_style_is( 'supe-responsive', 'enqueued' ) );
    }

    public function test_the_stylesheet_has_the_layout_rules_before_spacing(): void {
        do_blocks( '<!-- wp:supe-container/container {"supe":{"layout":{"v":1,"gap":{"desktop":"1rem"}}}} --><div class="wp-block-supe-container-container"></div><!-- /wp:supe-container/container -->' );
        $css = implode( '', (array) wp_styles()->get_data( 'supe-responsive', 'after' ) );

        self::assertStringContainsString( '.has-supe-fd-m.is-layout-flex{flex-direction:var(--supe-fd-m)!important}', $css );
        self::assertStringContainsString( '.has-supe-g.is-layout-flow>*+*{margin-block-start:var(--supe-g)}', $css );
        self::assertStringContainsString( '.has-supe-mh{min-height:var(--supe-mh)!important}', $css );
        self::assertLessThan( strpos( $css, '.has-supe-mt{' ), strpos( $css, '.has-supe-g{' ) );
    }

    public function test_a_background_renders_its_image_under_an_overlay(): void {
        $id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );

        $html = do_blocks(
            '<!-- wp:supe-container/container {"layout":{"type":"constrained"}} --><div class="wp-block-supe-container-container">'
            . '<!-- wp:supe/container-background {"mediaId":' . $id . ',"focalPoint":{"x":0.2,"y":0.8},"overlayColor":"var:preset|color|contrast","overlayOpacity":70,"lock":{"move":true}} /-->'
            . '<!-- wp:paragraph --><p>On top</p><!-- /wp:paragraph -->'
            . '</div><!-- /wp:supe-container/container -->'
        );

        $processor = new \WP_HTML_Tag_Processor( $html );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'wp-block-supe-container-background' ] ) );
        self::assertTrue( $processor->has_class( 'is-image' ) );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'wp-block-supe-container-background__media' ] ) );
        self::assertSame( 'true', $processor->get_attribute( 'aria-hidden' ) );
        self::assertTrue( $processor->next_tag( 'img' ) );
        self::assertSame( '', $processor->get_attribute( 'alt' ) );
        self::assertNotNull( $processor->get_attribute( 'srcset' ) );
        self::assertStringContainsString( '100vw', (string) $processor->get_attribute( 'sizes' ) );
        self::assertStringContainsString( 'object-position:20% 80%', (string) $processor->get_attribute( 'style' ) );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'wp-block-supe-container-background__overlay' ] ) );
        self::assertSame( 'background-color:var(--wp--preset--color--contrast);opacity:0.7', $processor->get_attribute( 'style' ) );
        self::assertSame( 'true', $processor->get_attribute( 'aria-hidden' ) );
        self::assertTrue( $processor->next_tag( 'p' ), 'The content follows the background.' );
        self::assertTrue( wp_style_is( 'supe-container-background-style', 'enqueued' ) );
        self::assertNotContains( ContainerBackground::VIEW_MODULE, wp_script_modules()->get_queue(), 'Only videos need the script.' );
    }

    public function test_a_video_background_renders_a_muted_looping_video(): void {
        $video  = $this->video();
        $poster = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );

        $html = do_blocks(
            '<!-- wp:supe/container-background {"type":"video","mediaId":' . $video . ',"posterId":' . $poster . ',"focalPoint":{"x":0.25,"y":0.5},"overlayColor":"#000"} /-->'
        );

        $processor = new \WP_HTML_Tag_Processor( $html );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'wp-block-supe-container-background' ] ) );
        self::assertTrue( $processor->has_class( 'is-video' ) );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'wp-block-supe-container-background__media' ] ) );
        self::assertSame( 'true', $processor->get_attribute( 'aria-hidden' ) );
        self::assertTrue( $processor->next_tag( 'video' ) );
        self::assertSame( wp_get_attachment_url( $video ), $processor->get_attribute( 'src' ) );
        self::assertSame( wp_get_attachment_image_url( $poster, 'full' ), $processor->get_attribute( 'poster' ) );
        self::assertSame( 'object-position:25% 50%', $processor->get_attribute( 'style' ) );
        foreach ( [ 'muted', 'loop', 'playsinline' ] as $attribute ) {
            self::assertTrue( $processor->get_attribute( $attribute ), $attribute );
        }
        self::assertNull( $processor->get_attribute( 'autoplay' ), 'view.js starts it (reduced motion).' );
        self::assertNull( $processor->get_attribute( 'controls' ) );
        self::assertSame( 'metadata', $processor->get_attribute( 'preload' ) );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'wp-block-supe-container-background__overlay' ] ) );
        self::assertStringNotContainsString( '__pause', $html, 'No pause button unless turned on.' );
        self::assertContains( ContainerBackground::VIEW_MODULE, wp_script_modules()->get_queue() );
    }

    public function test_a_video_background_can_have_a_pause_button(): void {
        $html = do_blocks( '<!-- wp:supe/container-background {"type":"video","mediaId":' . $this->video() . ',"pauseButton":true} /-->' );

        $processor = new \WP_HTML_Tag_Processor( $html );
        self::assertTrue( $processor->next_tag( 'video' ) );
        self::assertNull( $processor->get_attribute( 'poster' ) );
        self::assertTrue( $processor->next_tag( 'button' ) );
        self::assertTrue( $processor->has_class( 'wp-block-supe-container-background__pause' ) );
        self::assertSame( 'Pause background video', $processor->get_attribute( 'aria-label' ) );
        self::assertSame( 'Play background video', $processor->get_attribute( 'data-label-play' ) );
        self::assertTrue( $processor->get_attribute( 'hidden' ), 'Shown by view.js.' );
        self::assertNull( $processor->get_attribute( 'aria-hidden' ) );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'is-pause' ] ) );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'is-play' ] ) );
    }

    public function test_a_video_background_needs_a_video(): void {
        $image = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );

        $html = do_blocks(
            '<!-- wp:supe/container-background {"type":"video","mediaId":' . $image . '} /-->'
            . '<!-- wp:supe/container-background {"type":"video"} /-->'
            . '<!-- wp:supe/container-background {"mediaId":' . $this->video() . '} /-->'
        );

        self::assertStringNotContainsString( 'wp-block-supe-container-background', $html, 'An image as a video, nothing, a video as an image.' );
        self::assertNotContains( ContainerBackground::VIEW_MODULE, wp_script_modules()->get_queue() );
    }

    public function test_an_image_poster_is_required_for_the_poster(): void {
        $video = $this->video();

        $html = do_blocks( '<!-- wp:supe/container-background {"type":"video","mediaId":' . $video . ',"posterId":' . $this->video() . '} /-->' );

        $processor = new \WP_HTML_Tag_Processor( $html );
        self::assertTrue( $processor->next_tag( 'video' ) );
        self::assertNull( $processor->get_attribute( 'poster' ) );
    }

    public function test_a_background_without_an_image_renders_nothing(): void {
        $html = do_blocks(
            '<!-- wp:supe-container/container --><div class="wp-block-supe-container-container">'
            . '<!-- wp:supe/container-background {"overlayColor":"#000"} /-->'
            . '<!-- wp:supe/container-background {"mediaId":999999,"overlayColor":"#000"} /-->'
            . '</div><!-- /wp:supe-container/container -->'
        );

        self::assertStringNotContainsString( 'wp-block-supe-container-background', $html );
    }

    public function test_an_unsafe_overlay_is_left_out(): void {
        $id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );

        $html = do_blocks( '<!-- wp:supe/container-background {"mediaId":' . $id . ',"overlayColor":"#000\\u0022 onload=\\u0022alert(1)"} /-->' );

        self::assertStringContainsString( 'wp-block-supe-container-background__media', $html );
        self::assertStringNotContainsString( '__overlay', $html );
        self::assertStringNotContainsString( 'onload', $html );
    }

    /**
     * A video attachment (no real file is needed for its URL).
     */
    private function video(): int {
        return self::factory()->attachment->create_object(
            'clip.mp4',
            0,
            [ 'post_mime_type' => 'video/mp4', 'post_type' => 'attachment' ]
        );
    }
}
