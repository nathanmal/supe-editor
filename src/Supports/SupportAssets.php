<?php

declare(strict_types=1);

namespace Supe\Editor\Supports;

use Supe\Editor\Supports\Responsive\Breakpoints;

/**
 * SupportAssets
 *
 * Enqueues the block supports editor script (build/supports/index.js, built
 * from supports/index.js) in every block editor: the panels, the `supe`
 * attribute and the canvas preview for each support. Passes the site's
 * breakpoints along as window.supeEditor.settings. Nothing is enqueued until
 * `npm run build` has produced the script.
 */
final class SupportAssets {

    public const HANDLE = 'supe-editor-supports';

    private const SCRIPT = 'supports/index.js';
    private const ASSET  = 'supports/index.asset.php';

    /**
     * @param string $buildDir   Absolute path to build/, with a trailing slash.
     * @param string $pluginFile A file in the package root, for plugins_url().
     */
    public function __construct(
        private readonly string $buildDir,
        private readonly string $pluginFile,
        private readonly Breakpoints $breakpoints
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
        wp_add_inline_script( self::HANDLE, $this->settingsScript(), 'before' );
        wp_set_script_translations( self::HANDLE, 'supe-editor' );
    }

    /**
     * Sets window.supeEditor.settings without replacing anything else on
     * window.supeEditor (the shared components live there too).
     */
    public function settingsScript(): string {
        $settings = [ 'breakpoints' => $this->breakpoints->all() ];

        return sprintf(
            'window.supeEditor=window.supeEditor||{};window.supeEditor.settings=%s;',
            wp_json_encode( $settings, JSON_HEX_TAG | JSON_HEX_AMP )
        );
    }
}
