<?php

declare(strict_types=1);

namespace Supe\Editor\Services;

/**
 * EditorAssets
 *
 * Enqueues the editor bundle (build/editor/index.js, built from editor/ via
 * webpack.config.js) in every block editor. The bundle holds editor
 * modifications that aren't blocks or block supports — e.g. the page title
 * prompt. Dependencies and version come from the generated index.asset.php;
 * nothing is enqueued until `npm run build` has produced it.
 */
class EditorAssets {

    public const HANDLE = 'supe-editor';

    private const SCRIPT = 'editor/index.js';
    private const ASSET  = 'editor/index.asset.php';

    /**
     * @param string $buildDir   Absolute path to build/, with a trailing slash.
     * @param string $pluginFile A file in the package root, for plugins_url().
     */
    public function __construct(
        private readonly string $buildDir,
        private readonly string $pluginFile
    ) {}

    public function register(): void {
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue' ] );
    }

    public function enqueue(): void {
        $assetFile = $this->buildDir . self::ASSET;

        if ( ! is_readable( $assetFile ) ) {
            return;
        }

        $asset = require $assetFile;

        wp_enqueue_script(
            self::HANDLE,
            plugins_url( 'build/' . self::SCRIPT, $this->pluginFile ),
            $asset['dependencies'] ?? [],
            $asset['version'] ?? false,
            [ 'in_footer' => true ]
        );
        wp_set_script_translations( self::HANDLE, 'supe-editor' );
    }
}
