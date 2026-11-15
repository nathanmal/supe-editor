<?php

declare(strict_types=1);

namespace Supe\Editor\Editor;

/**
 * EditorAssets
 *
 * Loads the editor modifications bundle, built from editor/ via
 * webpack.config.js:
 *
 *  - build/editor/index.js — modifications that aren't blocks or block
 *    supports (e.g. the page title prompt), in every block editor.
 *  - build/editor/index.css — styles for the editor UI (sidebars, panels,
 *    dialogs), emitted when editor/index.js imports a stylesheet.
 *  - build/editor/canvas.css — styles inside the editor canvas (the iframe
 *    that shows the content), from editor/canvas.scss. Editor only; the
 *    front end never loads it.
 *
 * Script dependencies and version come from the generated .asset.php;
 * stylesheets are versioned by modification time. Nothing is loaded until
 * `npm run build` has produced the file.
 */
class EditorAssets {

    public const HANDLE        = 'supe-editor';
    public const CANVAS_HANDLE = 'supe-editor-canvas';

    private const SCRIPT   = 'editor/index.js';
    private const ASSET    = 'editor/index.asset.php';
    private const UI_STYLE = 'editor/index.css';
    private const CANVAS   = 'editor/canvas.css';

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
        add_action( 'enqueue_block_assets', [ $this, 'enqueueCanvas' ] );
    }

    public function enqueue(): void {
        $assetFile = $this->buildDir . self::ASSET;

        if ( ! is_readable( $assetFile ) ) {
            return;
        }

        $asset = require $assetFile;

        wp_enqueue_script(
            self::HANDLE,
            $this->url( self::SCRIPT ),
            $asset['dependencies'] ?? [],
            $asset['version'] ?? false,
            [ 'in_footer' => true ]
        );
        wp_set_script_translations( self::HANDLE, 'supe-editor' );

        $this->enqueueStyle( self::HANDLE, self::UI_STYLE );
    }

    /**
     * `enqueue_block_assets` also runs on the front end, so only act in the
     * editor (same check as StyleGenerator::enqueueInEditor()).
     */
    public function enqueueCanvas(): void {
        if ( is_admin() ) {
            $this->enqueueStyle( self::CANVAS_HANDLE, self::CANVAS );
        }
    }

    private function enqueueStyle( string $handle, string $file ): void {
        $path = $this->buildDir . $file;

        if ( ! is_readable( $path ) ) {
            return;
        }

        wp_enqueue_style( $handle, $this->url( $file ), [], (string) filemtime( $path ) );
    }

    private function url( string $file ): string {
        return plugins_url( 'build/' . $file, $this->pluginFile );
    }
}
