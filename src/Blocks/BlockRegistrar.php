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
 *
 * Core enqueues a block's view script module whenever the block renders. The
 * blocks in ON_DEMAND_MODULES only need theirs for some content (a Container
 * background only for a video), so their modules stay registered but their
 * render.php enqueues them when needed.
 */
class BlockRegistrar {

    public const MANIFEST = 'blocks-manifest.php';

    public const ON_DEMAND_MODULES = [ 'supe/container-background' ];

    public function __construct(
        private readonly string $buildDir
    ) {}

    public function register(): void {
        add_action( 'init', [ $this, 'registerBlocks' ] );
        add_filter( 'block_type_metadata_settings', [ $this, 'onDemandModules' ], 10, 2 );
    }

    /**
     * Leaves the view script modules of ON_DEMAND_MODULES blocks out of
     * core's automatic enqueue (they're already registered by now).
     *
     * @param  array<string, mixed> $settings
     * @param  array<string, mixed> $metadata
     * @return array<string, mixed>
     */
    public function onDemandModules( array $settings, array $metadata ): array {
        if ( in_array( $metadata['name'] ?? null, self::ON_DEMAND_MODULES, true ) ) {
            unset( $settings['view_script_module_ids'] );
        }

        return $settings;
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
