<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Editor;

use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use Supe\Editor\Editor\SvgUploads;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class SvgUploadsTest extends TestCase {

    private const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor"/></svg>';

    private SvgUploads $svg;

    /** @var string[] */
    private array $files = [];

    protected function set_up(): void {
        parent::set_up();

        $this->svg = new SvgUploads();
        Functions\when( '__' )->returnArg();
    }

    protected function tear_down(): void {
        array_map( 'unlink', array_filter( $this->files, 'file_exists' ) );

        parent::tear_down();
    }

    public function test_registers_its_hooks(): void {
        Filters\expectAdded( 'upload_mimes' )->once()->with( [ $this->svg, 'mimes' ], 10, 2 );
        Filters\expectAdded( 'wp_check_filetype_and_ext' )->once()->with( [ $this->svg, 'checkFiletype' ], 10, 4 );
        Filters\expectAdded( 'wp_handle_upload_prefilter' )->once()->with( [ $this->svg, 'sanitizeUpload' ] );
        Filters\expectAdded( 'wp_handle_sideload_prefilter' )->once()->with( [ $this->svg, 'sanitizeUpload' ] );
        Filters\expectAdded( 'wp_prepare_attachment_for_js' )->once();

        $this->svg->register();
    }

    public function test_keeps_a_clean_icon_and_drops_the_xml_prolog(): void {
        $clean = $this->svg->sanitize( '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . self::ICON );

        self::assertNotNull( $clean );
        self::assertStringStartsWith( '<svg', $clean );
        self::assertStringContainsString( 'd="M9 5l7 7-7 7"', $clean );
        self::assertStringContainsString( 'stroke="currentColor"', $clean );
    }

    public function test_removes_active_content(): void {
        $clean = (string) $this->svg->sanitize(
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" onload="alert(1)">'
            . '<script>alert(2)</script>'
            . '<a xlink:href="javascript:alert(3)"><path d="M0 0h1" onclick="alert(4)"/></a>'
            . '<image href="https://evil.example/x.png"/>'
            . '<foreignObject><div>hi</div></foreignObject>'
            . '</svg>'
        );

        foreach ( [ 'alert', 'script', 'onload', 'onclick', 'javascript:', 'evil.example', 'foreignObject' ] as $bad ) {
            self::assertStringNotContainsStringIgnoringCase( $bad, $clean, $bad );
        }
        self::assertStringContainsString( '<path d="M0 0h1"', $clean );
    }

    public function test_rejects_what_isnt_an_svg(): void {
        self::assertNull( $this->svg->sanitize( '<html><body>no</body></html>' ) );
        self::assertNull( $this->svg->sanitize( '' ) );
        self::assertNull( $this->svg->sanitize( 'GIF89a' ) );
    }

    public function test_svgs_are_for_users_who_can_upload_files_unless_filtered(): void {
        $user = $this->user( true );
        Functions\when( 'user_can' )->justReturn( true );

        self::assertTrue( $this->svg->canUpload( $user ) );
        self::assertSame( [ 'jpg' => 'image/jpeg', 'svg' => 'image/svg+xml' ], $this->svg->mimes( [ 'jpg' => 'image/jpeg' ], $user ) );

        Filters\expectApplied( 'supe/editor/svg_uploads/can_upload' )->andReturn( false );
        self::assertSame( [ 'jpg' => 'image/jpeg' ], $this->svg->mimes( [ 'jpg' => 'image/jpeg' ], $user ) );
    }

    public function test_users_who_cant_upload_files_get_no_svgs(): void {
        Functions\when( 'user_can' )->justReturn( false );

        self::assertFalse( $this->svg->canUpload( $this->user( true ) ) );
        self::assertFalse( $this->svg->canUpload( $this->user( false ) ) );
    }

    public function test_restores_the_file_type_of_real_svgs_only(): void {
        Functions\when( 'get_allowed_mime_types' )->justReturn( [ 'svg' => SvgUploads::MIME ] );
        $empty = [ 'ext' => false, 'type' => false, 'proper_filename' => false ];

        self::assertSame(
            [ 'ext' => 'svg', 'type' => SvgUploads::MIME, 'proper_filename' => false ],
            $this->svg->checkFiletype( $empty, $this->file( self::ICON ), 'icon.svg' )
        );
        self::assertSame( $empty, $this->svg->checkFiletype( $empty, $this->file( '<?php echo 1;' ), 'icon.svg' ) );
        self::assertSame( $empty, $this->svg->checkFiletype( $empty, $this->file( self::ICON ), 'icon.png' ) );
        self::assertSame( $empty, $this->svg->checkFiletype( $empty, $this->file( self::ICON ), 'icon.svg', [ 'jpg' => 'image/jpeg' ] ) );
    }

    public function test_uploads_are_sanitized_in_place_or_rejected(): void {
        $path = $this->file( '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0"/></svg>' );
        $file = $this->svg->sanitizeUpload( [ 'name' => 'Icon.SVG', 'tmp_name' => $path ] );

        self::assertArrayNotHasKey( 'error', $file );
        self::assertStringNotContainsString( 'script', (string) file_get_contents( $path ) );

        $bad = $this->svg->sanitizeUpload( [ 'name' => 'icon.svg', 'tmp_name' => $this->file( 'not an svg' ) ] );
        self::assertNotEmpty( $bad['error'] );

        $other = [ 'name' => 'photo.jpg', 'tmp_name' => $this->file( 'jpeg bytes' ) ];
        self::assertSame( $other, $this->svg->sanitizeUpload( $other ) );
    }

    private function user( bool $exists ): \WP_User {
        $user = \Mockery::mock( \WP_User::class );
        $user->allows( 'exists' )->andReturn( $exists );

        return $user;
    }

    private function file( string $contents ): string {
        $path          = (string) tempnam( sys_get_temp_dir(), 'supe-svg' );
        $this->files[] = $path;
        file_put_contents( $path, $contents );

        return $path;
    }
}
