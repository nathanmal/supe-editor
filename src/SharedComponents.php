<?php

declare(strict_types=1);

namespace Supe\Editor;

/**
 * SharedComponents
 *
 * Registers build/components/index.js (built from components/) as the
 * `supe-editor-components` script, exposing window.supeEditor.components.
 * Blocks, supports and editor modifications import it as
 * `@supe-editor/components`; webpack.config.js turns that import into a
 * dependency on this handle, so every bundle shares one copy. Registered
 * only: WordPress loads it when something that depends on it is enqueued.
 */
class SharedComponents {

    public const HANDLE = 'supe-editor-components';

    private const SCRIPT = 'components/index.js';
    private const ASSET  = 'components/index.asset.php';

    /**
     * @param string $buildDir   Absolute path to build/, with a trailing slash.
     * @param string $pluginFile A file in the package root, for plugins_url().
     */
    public function __construct(
        private readonly string $buildDir,
        private readonly string $pluginFile
    ) {}

    public function register(): void {
        add_action( 'init', [ $this, 'registerScript' ] );
    }

    public function registerScript(): void {
        $assetFile = $this->buildDir . self::ASSET;

        if ( ! is_readable( $assetFile ) ) {
            return;
        }

        $asset = require $assetFile;

        wp_register_script(
            self::HANDLE,
            plugins_url( 'build/' . self::SCRIPT, $this->pluginFile ),
            $asset['dependencies'] ?? [],
            $asset['version'] ?? false,
            [ 'in_footer' => true ]
        );
        wp_set_script_translations( self::HANDLE, 'supe-editor' );
    }
}
