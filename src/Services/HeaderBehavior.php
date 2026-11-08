<?php

declare(strict_types=1);

namespace Supe\Editor\Services;

use WP_HTML_Tag_Processor;

/**
 * HeaderBehavior
 *
 * Sticky / hide-on-scroll options for the site header.
 *
 *  - Default: set on the header's root Group block (`supeSticky`,
 *    `supeHideOnScroll` attributes), in a "Header behavior" panel that only
 *    appears on the top-level Group of a header template part.
 *  - Override: a page or post can replace the default with the
 *    `_supe_header_behavior` meta ('' | static | sticky | hide-on-scroll),
 *    from a "Header" panel in the document sidebar.
 *
 * Editor UI: editor/header-behavior/ (in the editor bundle). Front end:
 * build/header-behavior/view.{js,css}, enqueued only on pages where the
 * header is sticky / hides. The options live on the Group rather than the
 * template-part block because every template has its own template-part block
 * but they all share the part's content — set once, used everywhere.
 */
class HeaderBehavior {

    public const META_KEY     = '_supe_header_behavior';
    public const OVERRIDES    = [ 'static', 'sticky', 'hide-on-scroll' ];
    public const STICKY_CLASS = 'supe-header-sticky';
    public const HIDE_CLASS   = 'supe-header-hide-on-scroll';
    public const HANDLE       = 'supe-header-behavior';

    private const VIEW = 'header-behavior/view';

    /**
     * @param string $buildDir   Absolute path to build/, with a trailing slash.
     * @param string $pluginFile A file in the package root, for plugins_url().
     */
    public function __construct(
        private readonly string $buildDir,
        private readonly string $pluginFile
    ) {}

    public function register(): void {
        add_filter( 'register_block_type_args', [ $this, 'addGroupAttributes' ], 10, 2 );
        add_action( 'init', [ $this, 'registerMeta' ] );
        add_action( 'init', [ $this, 'registerAssets' ] );
        add_filter( 'render_block_core/group', [ $this, 'markHeaderDefault' ], 10, 2 );
        add_filter( 'render_block_core/template-part', [ $this, 'apply' ] );
    }

    /**
     * Post types that get the per-page override.
     *
     * @return string[]
     */
    public function postTypes(): array {
        /**
         * Filters the post types whose posts can override the header behavior.
         *
         * @param string[] $postTypes Post type names.
         */
        return (array) apply_filters( 'supe/editor/header_behavior/post_types', [ 'page', 'post' ] );
    }

    /**
     * Register the Group attributes server-side so they survive the REST API.
     */
    public function addGroupAttributes( array $args, string $blockType ): array {
        if ( 'core/group' === $blockType ) {
            $args['attributes']['supeSticky']       = [ 'type' => 'boolean', 'default' => false ];
            $args['attributes']['supeHideOnScroll'] = [ 'type' => 'boolean', 'default' => false ];
        }

        return $args;
    }

    public function registerMeta(): void {
        foreach ( $this->postTypes() as $postType ) {
            register_post_meta( $postType, self::META_KEY, [
                'type'              => 'string',
                'single'            => true,
                'default'           => '',
                'show_in_rest'      => [
                    'schema' => [ 'enum' => array_merge( [ '' ], self::OVERRIDES ) ],
                ],
                'sanitize_callback' => [ $this, 'sanitize' ],
                'auth_callback'     => [ $this, 'canEdit' ],
            ] );
        }
    }

    public function sanitize( mixed $value ): string {
        return in_array( $value, self::OVERRIDES, true ) ? $value : '';
    }

    /**
     * Meta auth callback. WordPress passes the post ID loosely typed, so it's
     * cast here rather than type-hinted.
     */
    public function canEdit( mixed $allowed, mixed $metaKey, mixed $postId ): bool {
        return current_user_can( 'edit_post', (int) $postId );
    }

    /**
     * Register the front-end assets; apply() enqueues them only when needed.
     */
    public function registerAssets(): void {
        $assetFile = $this->buildDir . self::VIEW . '.asset.php';

        if ( ! is_readable( $assetFile ) ) {
            return;
        }

        $asset = require $assetFile;

        wp_register_style(
            self::HANDLE,
            plugins_url( 'build/' . self::VIEW . '.css', $this->pluginFile ),
            [],
            $asset['version'] ?? false
        );
        wp_register_script(
            self::HANDLE,
            plugins_url( 'build/' . self::VIEW . '.js', $this->pluginFile ),
            $asset['dependencies'] ?? [],
            $asset['version'] ?? false,
            [ 'in_footer' => true, 'strategy' => 'defer' ]
        );
    }

    /**
     * Mark the header's default on its root Group. Only marks it: apply()
     * decides the final classes, so a page can override the default.
     */
    public function markHeaderDefault( string $blockContent, array $block ): string {
        if ( empty( $block['attrs']['supeSticky'] ) ) {
            return $blockContent;
        }

        $processor = new WP_HTML_Tag_Processor( $blockContent );
        if ( ! $processor->next_tag() ) {
            return $blockContent;
        }

        $processor->add_class( self::STICKY_CLASS );
        if ( ! empty( $block['attrs']['supeHideOnScroll'] ) ) {
            $processor->add_class( self::HIDE_CLASS );
        }

        return $processor->get_updated_html();
    }

    /**
     * On the header template part (<header> wrapping a root Group): combine
     * the header's default with the current page's override, set the final
     * classes and enqueue what they need.
     */
    public function apply( string $blockContent ): string {
        $processor = new WP_HTML_Tag_Processor( $blockContent );

        if ( ! $processor->next_tag() || 'HEADER' !== $processor->get_tag() || ! $processor->next_tag() ) {
            return $blockContent;
        }

        $behavior = $this->resolve(
            (bool) $processor->has_class( self::STICKY_CLASS ),
            (bool) $processor->has_class( self::HIDE_CLASS ),
            $this->currentOverride()
        );

        $processor->remove_class( self::STICKY_CLASS );
        $processor->remove_class( self::HIDE_CLASS );

        if ( $behavior['sticky'] ) {
            $processor->add_class( self::STICKY_CLASS );
            wp_enqueue_style( self::HANDLE );
        }
        if ( $behavior['hide'] ) {
            $processor->add_class( self::HIDE_CLASS );
            wp_enqueue_script( self::HANDLE );
        }

        return $processor->get_updated_html();
    }

    /**
     * The final behavior: the override wins when set; hiding needs sticky.
     *
     * @return array{sticky: bool, hide: bool}
     */
    public function resolve( bool $sticky, bool $hide, string $override ): array {
        if ( in_array( $override, self::OVERRIDES, true ) ) {
            $sticky = 'static' !== $override;
            $hide   = 'hide-on-scroll' === $override;
        }

        return [ 'sticky' => $sticky, 'hide' => $sticky && $hide ];
    }

    private function currentOverride(): string {
        if ( ! is_singular( $this->postTypes() ) ) {
            return '';
        }

        return (string) get_post_meta( (int) get_queried_object_id(), self::META_KEY, true );
    }
}
