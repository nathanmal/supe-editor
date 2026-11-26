<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Feature;

use Supe\Editor\Editor\SvgUploads;
use Yoast\WPTestUtils\WPIntegration\TestCase;

/**
 * SVG uploads through WordPress's own upload path, and custom control icons.
 */
final class SvgUploadsTest extends TestCase {

    private const EVIL = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="alert(1)"><script>alert(2)</script><path d="M2 2l20 20" stroke="currentColor"/></svg>';

    public function set_up(): void {
        parent::set_up();

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
    }

    public function test_users_who_can_upload_files_can_upload_svgs_and_others_cant(): void {
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'author' ] ) );
        self::assertArrayHasKey( 'svg', get_allowed_mime_types() );

        wp_set_current_user( self::factory()->user->create( [ 'role' => 'subscriber' ] ) );
        self::assertArrayNotHasKey( 'svg', get_allowed_mime_types() );
    }

    public function test_an_uploaded_svg_is_sanitized_and_used_as_an_icon(): void {
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );

        $id = $this->upload( self::EVIL );

        self::assertIsInt( $id );
        self::assertSame( SvgUploads::MIME, get_post_mime_type( $id ) );

        $stored = (string) file_get_contents( (string) get_attached_file( $id ) );
        self::assertStringNotContainsString( 'script', $stored );
        self::assertStringNotContainsString( 'onload', $stored );
        self::assertStringContainsString( 'M2 2l20 20', $stored );

        $icon = supe( 'supe.editor.svg' )->icon( $id, 'supe-slides__icon is-pause' );
        self::assertStringStartsWith( '<svg', $icon );
        self::assertStringContainsString( 'class="supe-slides__icon is-pause"', $icon );
        self::assertStringContainsString( 'aria-hidden="true"', $icon );

        // Cached against the file's version.
        self::assertIsArray( get_post_meta( $id, SvgUploads::META, true ) );

        // The next button inlines it instead of the preset.
        $html = do_blocks(
            '<!-- wp:supe/slides {"type":"content"} --><!-- wp:supe/slides-track --><!-- wp:supe/slide --><!-- /wp:supe/slide --><!-- wp:supe/slide --><!-- /wp:supe/slide --><!-- /wp:supe/slides-track -->'
            . '<!-- wp:supe/slides-overlay --><!-- wp:supe/slides-next {"iconId":' . $id . '} /--><!-- wp:supe/slides-prev {"iconId":999999} /--><!-- /wp:supe/slides-overlay --><!-- /wp:supe/slides -->'
        );
        self::assertSame( 1, substr_count( $html, 'M2 2l20 20' ), 'Custom icon on next; prev falls back to the chevron preset.' );
        self::assertStringContainsString( 'M9 5l7 7-7 7', $html, 'The preset on prev.' );
        self::assertStringNotContainsString( 'alert', $html );
    }

    public function test_a_file_changed_outside_wordpress_is_sanitized_again(): void {
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );
        $id = $this->upload( '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1"/></svg>' );
        supe( 'supe.editor.svg' )->markup( $id );

        $file = (string) get_attached_file( $id );
        file_put_contents( $file, '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M1 1h2"/></svg>' );
        touch( $file, time() + 10 );
        clearstatcache();

        $markup = supe( 'supe.editor.svg' )->markup( $id );
        self::assertStringContainsString( 'M1 1h2', $markup );
        self::assertStringNotContainsString( 'script', $markup );
    }

    public function test_a_broken_svg_is_rejected(): void {
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );

        $result = $this->upload( '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"' );

        self::assertWPError( $result );
    }

    public function test_the_rest_api_gives_svgs_their_sanitized_markup(): void {
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );
        $id = $this->upload( self::EVIL );

        $response = rest_do_request( new \WP_REST_Request( 'GET', '/wp/v2/media/' . $id ) );
        $markup   = $response->get_data()['supe_svg'] ?? null;

        self::assertIsString( $markup );
        self::assertStringStartsWith( '<svg', $markup );
        self::assertStringNotContainsString( 'alert', $markup );
    }

    /**
     * @return int|\WP_Error The attachment ID.
     */
    private function upload( string $svg ): int|\WP_Error {
        $tmp = wp_tempnam( 'icon.svg' );
        file_put_contents( $tmp, $svg );

        return media_handle_sideload( [ 'name' => 'icon.svg', 'tmp_name' => $tmp ], 0 );
    }
}
