<?php

declare(strict_types=1);

namespace Supe\Editor\Supports;

use Supe\Editor\Supports\Responsive\StyleGenerator;
use Supe\Editor\Supports\Responsive\ValueSanitizer;

/**
 * SupportRegistry
 *
 * Loads each custom block support from supports/{name}/ — support.json for
 * its metadata and support.php, which returns the support instance (no
 * autoloading: support folders are lowercase, like blocks/) — and adds the
 * supports to block types.
 *
 * Blocks opt in from block.json with `"supports": { "supe": { "spacing": true } }`;
 * core blocks listed in a support's `coreBlocks` are opted in here. Every
 * block using any support gets the shared `supe` object attribute that
 * holds all support values, keyed by support name.
 *
 * A block never has both a support and the core feature it replaces
 * (support.json `replaces`): blocks that opt in themselves get the core
 * feature turned off. Core blocks opted in through `coreBlocks` keep it —
 * their saved markup depends on it — until the support's bridge hides its
 * controls and migrates their values.
 */
final class SupportRegistry {

    /**
     * Supports to load, in order. Explicit rather than discovered so load
     * order is obvious; switch to globbing supports/{name}/support.json if
     * the list grows. Load order is stylesheet order: spacing comes after
     * layout, so a child's own margin wins over its parent's gap.
     */
    public const SUPPORTS = [ 'layout', 'dimensions', 'spacing' ];

    public const ATTRIBUTE = 'supe';

    /** @var array<string, AbstractSupport> */
    private array $supports = [];

    /**
     * @param list<string> $names
     */
    public function __construct(
        private readonly string $supportsDir,
        private readonly ValueSanitizer $sanitizer,
        private readonly StyleGenerator $styles,
        private readonly array $names = self::SUPPORTS
    ) {}

    public function register(): void {
        $this->load();

        add_filter( 'register_block_type_args', [ $this, 'addToBlockType' ], 10, 2 );
    }

    public function load(): void {
        foreach ( $this->names as $name ) {
            if ( isset( $this->supports[ $name ] ) ) {
                continue;
            }

            $support = $this->loadSupport( $name );

            if ( null === $support ) {
                continue;
            }

            $this->supports[ $name ] = $support;
            $this->styles->addSupport( $support );
        }
    }

    public function get( string $name ): ?AbstractSupport {
        return $this->supports[ $name ] ?? null;
    }

    /**
     * @return array<string, AbstractSupport>
     */
    public function all(): array {
        return $this->supports;
    }

    /**
     * @param  array<string, mixed> $args
     * @return array<string, mixed>
     */
    public function addToBlockType( array $args, string $blockName ): array {
        if ( ! isset( $args['supports'] ) || ! is_array( $args['supports'] ) ) {
            $args['supports'] = [];
        }

        if ( ! isset( $args['supports'][ self::ATTRIBUTE ] ) || ! is_array( $args['supports'][ self::ATTRIBUTE ] ) ) {
            $args['supports'][ self::ATTRIBUTE ] = [];
        }

        $ownSupports = array_keys( array_filter( $args['supports'][ self::ATTRIBUTE ] ) );

        foreach ( $this->supports as $name => $support ) {
            if ( in_array( $name, $ownSupports, true ) ) {
                $args['supports'] = self::withoutReplacedCoreSupports( $args['supports'], $support );
            }

            if ( in_array( $blockName, $support->coreBlocks(), true ) && ! isset( $args['supports'][ self::ATTRIBUTE ][ $name ] ) ) {
                $args['supports'][ self::ATTRIBUTE ][ $name ] = true;
            }
        }

        if ( [] === array_filter( $args['supports'][ self::ATTRIBUTE ] ) ) {
            unset( $args['supports'][ self::ATTRIBUTE ] );

            return $args;
        }

        if ( ! isset( $args['attributes'][ self::ATTRIBUTE ] ) ) {
            $args['attributes'][ self::ATTRIBUTE ] = [ 'type' => 'object' ];
        }

        return $args;
    }

    /**
     * A block's supports with the core features a support replaces turned
     * off, e.g. `spacing.padding` and `spacing.margin` set to false while
     * `spacing.blockGap` stays.
     *
     * @param  array<string, mixed> $supports
     * @return array<string, mixed>
     */
    private static function withoutReplacedCoreSupports( array $supports, AbstractSupport $support ): array {
        foreach ( $support->replacedCoreSupports() as $feature => $keys ) {
            if ( empty( $supports[ $feature ] ) ) {
                continue;
            }

            $current = is_array( $supports[ $feature ] ) ? $supports[ $feature ] : [];

            foreach ( $keys as $key ) {
                $current[ $key ] = false;
            }

            $supports[ $feature ] = $current;
        }

        return $supports;
    }

    private function loadSupport( string $name ): ?AbstractSupport {
        $dir      = $this->supportsDir . $name . '/';
        $metadata = is_file( $dir . 'support.json' )
            ? wp_json_file_decode( $dir . 'support.json', [ 'associative' => true ] )
            : null;

        if ( ! is_array( $metadata ) || ( $metadata['name'] ?? null ) !== $name || ! is_file( $dir . 'support.php' ) ) {
            _doing_it_wrong( __METHOD__, esc_html( "Support \"{$name}\" needs support.json (with a matching name) and support.php." ), '1.0.0' );

            return null;
        }

        // `require`, not `require_once`: a repeat load would return true instead of the instance.
        $support = require $dir . 'support.php';

        if ( ! $support instanceof AbstractSupport ) {
            _doing_it_wrong( __METHOD__, esc_html( "supports/{$name}/support.php must return an AbstractSupport instance." ), '1.0.0' );

            return null;
        }

        $support->boot( $metadata, $this->sanitizer );

        return $support;
    }
}
