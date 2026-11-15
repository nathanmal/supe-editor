<?php

declare(strict_types=1);

namespace Supe\Editor\Blocks;

/**
 * BlockRegistrar
 *
 * Registers every compiled block in one call from build/blocks-manifest.php,
 * which `wp-scripts build --blocks-manifest` generates from each
 * build/{block}/block.json. Reading one PHP array instead of a JSON file per
 * block saves the filesystem reads and json_decode() on every request.
 */
class BlockRegistrar {

    public const MANIFEST = 'blocks-manifest.php';

    public function __construct(
        private readonly string $buildDir
    ) {}

    public function register(): void {
        add_action( 'init', [ $this, 'registerBlocks' ] );
    }

    public function registerBlocks(): void {
        if ( ! is_file( $this->manifestPath() ) ) {
            return;
        }

        wp_register_block_types_from_metadata_collection( $this->buildDir, $this->manifestPath() );
    }

    /**
     * Every compiled block's metadata, keyed by its build/ directory name.
     * Shared with the admin page so both read from the same source of truth.
     *
     * @return array<string, array<string, mixed>>
     */
    public function discover(): array {
        if ( ! is_file( $this->manifestPath() ) ) {
            return [];
        }

        $manifest = require $this->manifestPath();

        return is_array( $manifest ) ? $manifest : [];
    }

    public function manifestPath(): string {
        return $this->buildDir . self::MANIFEST;
    }
}
