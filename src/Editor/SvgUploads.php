<?php

declare(strict_types=1);

namespace Supe\Editor\Editor;

use enshrined\svgSanitize\Sanitizer;
use WP_HTML_Tag_Processor;
use WP_Post;
use WP_User;

/**
 * SvgUploads
 *
 * SVG uploads, site-wide (control icons are the first use): the `svg` file
 * type for users who can upload files (filter
 * `supe/editor/svg_uploads/can_upload`), sanitized with enshrined/svg-sanitize
 * when uploaded and again whenever the markup is used (markup()), with the
 * sanitized markup cached in post meta per file version. The editor gets it
 * as the `supe_svg` field on media REST responses, so previews never inline
 * the raw file.
 */
final class SvgUploads {

    public const MIME = 'image/svg+xml';
    public const META = '_supe_svg_markup';

    public function register(): void {
        add_filter( 'upload_mimes', [ $this, 'mimes' ], 10, 2 );
        add_filter( 'wp_check_filetype_and_ext', [ $this, 'checkFiletype' ], 10, 4 );
        add_filter( 'wp_handle_upload_prefilter', [ $this, 'sanitizeUpload' ] );
        add_filter( 'wp_handle_sideload_prefilter', [ $this, 'sanitizeUpload' ] );
        add_filter( 'wp_prepare_attachment_for_js', [ $this, 'prepareForJs' ], 10, 2 );
        add_action( 'rest_api_init', [ $this, 'registerRestField' ] );
    }

    /**
     * Whether a user may upload SVGs: anyone who can upload files, unless
     * the filter says otherwise.
     *
     * @param mixed $user A WP_User, or null for the current user.
     */
    public function canUpload( mixed $user = null ): bool {
        $user    = $user instanceof WP_User ? $user : wp_get_current_user();
        $allowed = $user->exists() && user_can( $user, 'upload_files' );

        return (bool) apply_filters( 'supe/editor/svg_uploads/can_upload', $allowed, $user );
    }

    /**
     * @param array<string, string> $mimes
     * @param mixed                 $user
     * @return array<string, string>
     */
    public function mimes( array $mimes, mixed $user = null ): array {
        if ( $this->canUpload( $user ) ) {
            $mimes['svg'] = self::MIME;
        }

        return $mimes;
    }

    /**
     * Core can't sniff an SVG's type (it isn't a bitmap), so it rejects the
     * file even when `svg` is allowed: restore the type for `.svg` files
     * that really are SVG text.
     *
     * @param array  $data     [ ext, type, proper_filename ].
     * @param string $file     Full path to the file.
     * @param string $filename The file's name.
     * @param mixed  $mimes    Allowed types, or null for the defaults.
     */
    public function checkFiletype( array $data, string $file, string $filename, mixed $mimes = null ): array {
        if ( ! empty( $data['ext'] ) || 'svg' !== strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) ) ) {
            return $data;
        }

        $allowed = is_array( $mimes ) ? $mimes : get_allowed_mime_types();
        if ( ! in_array( self::MIME, $allowed, true ) || ! self::looksLikeSvg( (string) @file_get_contents( $file, false, null, 0, 4096 ) ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
            return $data;
        }

        return [ 'ext' => 'svg', 'type' => self::MIME, 'proper_filename' => $data['proper_filename'] ?? false ];
    }

    /**
     * Sanitizes an uploaded SVG in place, or rejects it when it can't be.
     *
     * @param array $file An upload's `$_FILES` entry.
     */
    public function sanitizeUpload( array $file ): array {
        if ( 'svg' !== strtolower( pathinfo( (string) ( $file['name'] ?? '' ), PATHINFO_EXTENSION ) ) || empty( $file['tmp_name'] ) ) {
            return $file;
        }

        $clean = $this->sanitize( (string) @file_get_contents( $file['tmp_name'] ) ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
        if ( null === $clean || false === @file_put_contents( $file['tmp_name'], $clean ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
            $file['error'] = __( 'This SVG file couldn’t be made safe to use, so it wasn’t uploaded.', 'supe-editor' );
        }

        return $file;
    }

    /**
     * An SVG document made safe: no scripts, event handlers, external
     * references or other active content, and no XML prolog, so it can be
     * inlined in HTML. Null when it isn't a usable SVG.
     */
    public function sanitize( string $svg ): ?string {
        if ( ! self::looksLikeSvg( $svg ) ) {
            return null;
        }

        $sanitizer = new Sanitizer();
        $sanitizer->removeRemoteReferences( true );
        $sanitizer->removeXMLTag( true );
        $sanitizer->minify( true );

        $clean = $sanitizer->sanitize( $svg );
        if ( ! is_string( $clean ) ) {
            return null;
        }

        $clean = trim( (string) preg_replace( '/<!DOCTYPE[^>]*>/i', '', $clean ) );

        return 1 === preg_match( '/^<svg[\s>]/i', $clean ) ? $clean : null;
    }

    /**
     * An SVG attachment's markup, sanitized again (the file could have been
     * replaced outside WordPress) and cached against the file's version.
     * Empty for anything that isn't a readable SVG attachment.
     */
    public function markup( int $id ): string {
        $file = $id > 0 && self::MIME === get_post_mime_type( $id ) ? get_attached_file( $id ) : false;
        if ( ! is_string( $file ) || ! is_readable( $file ) ) {
            return '';
        }

        $version = md5( (string) filemtime( $file ) . ':' . (string) filesize( $file ) );
        $cached  = get_post_meta( $id, self::META, true );
        if ( is_array( $cached ) && ( $cached['version'] ?? null ) === $version && is_string( $cached['markup'] ?? null ) ) {
            return $cached['markup'];
        }

        $markup = $this->sanitize( (string) file_get_contents( $file ) ) ?? '';
        update_post_meta( $id, self::META, [ 'version' => $version, 'markup' => $markup ] );

        return $markup;
    }

    /**
     * An SVG attachment as an inline icon: its sanitized markup with `class`,
     * hidden from assistive tech (the control carries the label). Empty when
     * it isn't a usable SVG, so callers can fall back to a preset.
     */
    public function icon( int $id, string $class ): string {
        $processor = new WP_HTML_Tag_Processor( $this->markup( $id ) );
        if ( ! $processor->next_tag( 'svg' ) ) {
            return '';
        }

        foreach ( preg_split( '/\s+/', trim( $class ) ) ?: [] as $name ) {
            $processor->add_class( $name );
        }
        $processor->set_attribute( 'aria-hidden', 'true' );
        $processor->set_attribute( 'focusable', 'false' );
        $processor->remove_attribute( 'role' );

        return $processor->get_updated_html();
    }

    /**
     * The media modal shows SVGs as images rather than file icons.
     *
     * @param array   $response
     * @param WP_Post $attachment
     */
    public function prepareForJs( array $response, mixed $attachment ): array {
        if ( ! $attachment instanceof WP_Post || self::MIME !== $attachment->post_mime_type || empty( $response['url'] ) ) {
            return $response;
        }

        $response['image'] = [ 'src' => $response['url'] ];
        $response['sizes'] = [
            'full' => [
                'url'         => $response['url'],
                'width'       => 96,
                'height'      => 96,
                'orientation' => 'landscape',
            ],
        ];

        return $response;
    }

    public function registerRestField(): void {
        register_rest_field( 'attachment', 'supe_svg', [
            'get_callback' => fn ( array $attachment ): string => $this->markup( (int) ( $attachment['id'] ?? 0 ) ),
            'schema'       => [
                'description' => __( 'Sanitized markup of an SVG attachment, empty for other files.', 'supe-editor' ),
                'type'        => 'string',
                'context'     => [ 'view', 'edit' ],
                'readonly'    => true,
            ],
        ] );
    }

    /** Whether text starts like an SVG document (after any prolog or comments). */
    private static function looksLikeSvg( string $text ): bool {
        return 1 === preg_match( '/^\s*(<\?xml[^>]*>\s*)?(<!--.*?-->\s*|<!DOCTYPE[^>]*>\s*)*<svg[\s>]/is', $text );
    }
}
