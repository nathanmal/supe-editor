<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Feature;

use Yoast\WPTestUtils\WPIntegration\TestCase;

/**
 * Renders the fader blocks from build/ (run `npm run build` first).
 */
final class FaderTest extends TestCase {

    public function test_the_first_image_shows_and_the_rest_wait_hidden(): void {
        $id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );

        $html = do_blocks(
            '<!-- wp:supe/fader {"duration":3000,"fade":800,"style":{"dimensions":{"aspectRatio":"16/9"}}} -->'
            . '<!-- wp:supe/fader-image {"id":' . $id . ',"alt":"First","focalPoint":{"x":0.25,"y":0.75}} /-->'
            . '<!-- wp:supe/fader-image {"id":' . $id . '} /-->'
            . '<!-- wp:supe/fader-image {"id":999999} /-->'
            . '<!-- /wp:supe/fader -->'
        );

        $processor = new \WP_HTML_Tag_Processor( $html );
        self::assertTrue( $processor->next_tag( [ 'class_name' => 'supe-fader' ] ) );
        self::assertSame( [ 'duration' => 3000, 'fade' => 800 ], json_decode( (string) $processor->get_attribute( 'data-supe-fader' ), true ) );
        self::assertStringContainsString( '--supe-fader-fade:800ms', (string) $processor->get_attribute( 'style' ) );
        self::assertStringContainsString( 'aspect-ratio:16/9', str_replace( ' ', '', (string) $processor->get_attribute( 'style' ) ) );

        self::assertTrue( $processor->next_tag( [ 'class_name' => 'supe-fader__slide' ] ) );
        self::assertTrue( $processor->has_class( 'is-active' ) );
        self::assertNull( $processor->get_attribute( 'aria-hidden' ) );
        self::assertTrue( $processor->next_tag( 'img' ) );
        self::assertSame( 'First', $processor->get_attribute( 'alt' ) );
        self::assertStringContainsString( 'object-position:25% 75%', (string) $processor->get_attribute( 'style' ) );
        self::assertNotNull( $processor->get_attribute( 'srcset' ) );

        self::assertTrue( $processor->next_tag( [ 'class_name' => 'supe-fader__slide' ] ) );
        self::assertFalse( $processor->has_class( 'is-active' ) );
        self::assertSame( 'true', $processor->get_attribute( 'aria-hidden' ) );

        self::assertFalse( $processor->next_tag( [ 'class_name' => 'supe-fader__slide' ] ), 'A missing image renders nothing.' );
        self::assertContains( 'supe-fader-view-script-module', wp_script_modules()->get_queue() );
    }

    public function test_a_fader_without_images_renders_nothing(): void {
        self::assertSame( '', trim( do_blocks( '<!-- wp:supe/fader --><!-- wp:supe/fader-image /--><!-- /wp:supe/fader -->' ) ) );
    }
}
