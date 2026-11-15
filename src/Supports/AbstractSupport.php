<?php

declare(strict_types=1);

namespace Supe\Editor\Supports;

use Supe\Editor\Supports\Responsive\Viewport;
use Supe\Editor\Supports\Responsive\ValueSanitizer;

/**
 * AbstractSupport
 *
 * Base for a custom block support. Each support lives in its own
 * supports/{name}/ folder: support.json holds its metadata (shared with the
 * editor script), and support.php returns an instance of a subclass, which
 * SupportRegistry loads and boots.
 *
 * Stored values carry the version of their shape (`v`), separate from the
 * package version: support.json's `version` is bumped only when old stored
 * values would be misread under a new shape. Readers upgrade older values
 * through migrations() before using them, so saved content never needs a
 * bulk rewrite. supports/_framework/upgrade.js mirrors this for the editor
 * and headless front ends.
 */
abstract class AbstractSupport {

    /** Key holding a stored value's shape version. */
    public const VERSION_KEY = 'v';

    /** @var array<string, mixed> */
    protected array $metadata = [];

    protected ValueSanitizer $sanitizer;

    /**
     * Called once by SupportRegistry after loading the support's file.
     *
     * @param array<string, mixed> $metadata Decoded support.json.
     */
    public function boot( array $metadata, ValueSanitizer $sanitizer ): void {
        $this->metadata  = $metadata;
        $this->sanitizer = $sanitizer;
    }

    public function name(): string {
        return (string) ( $this->metadata['name'] ?? '' );
    }

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array {
        return $this->metadata;
    }

    /**
     * Current version of this support's stored value shape (support.json
     * `version`, default 1).
     */
    public function version(): int {
        $version = $this->metadata['version'] ?? 1;

        return is_int( $version ) && $version > 0 ? $version : 1;
    }

    /**
     * Classes and inline styles for a stored value of any known version:
     * upgraded to the current shape first, then rendered. Values that can't
     * be upgraded render nothing.
     *
     * @param  array<string, mixed> $value
     * @return array{classes: list<string>, styles: array<string, string>}
     */
    final public function output( array $value ): array {
        $upgraded = $this->upgrade( $value );

        return null === $upgraded ? [ 'classes' => [], 'styles' => [] ] : $this->render( $upgraded );
    }

    /**
     * A stored value in the current shape, or null when it can't be read: an
     * invalid version, one newer than this code knows, or a missing
     * migration. A value without a version is version 1.
     *
     * @param  array<string, mixed> $value
     * @return array<string, mixed>|null
     */
    final public function upgrade( array $value ): ?array {
        $from = $value[ self::VERSION_KEY ] ?? 1;

        if ( ! is_int( $from ) || $from < 1 || $from > $this->version() ) {
            return null;
        }

        $migrations = $this->migrations();

        for ( $version = $from; $version < $this->version(); $version++ ) {
            if ( ! isset( $migrations[ $version ] ) ) {
                return null;
            }

            $value = ( $migrations[ $version ] )( $value );
        }

        $value[ self::VERSION_KEY ] = $this->version();

        return $value;
    }

    /**
     * Upgrades between stored shapes, keyed by the version each one upgrades
     * from: `[ 1 => fn( array $value ): array => …version 2 shape… ]`. Every
     * migration needs a matching one in the support's JS.
     *
     * @return array<int, callable(array<string, mixed>): array<string, mixed>>
     */
    protected function migrations(): array {
        return [];
    }

    /**
     * Core block supports this support replaces, from support.json
     * `replaces`, e.g. `[ 'spacing' => [ 'padding', 'margin' ] ]`. Blocks
     * that opt in themselves get these turned off, so the two never style
     * the same property.
     *
     * @return array<string, list<string>>
     */
    public function replacedCoreSupports(): array {
        $replaced = [];

        foreach ( (array) ( $this->metadata['replaces'] ?? [] ) as $feature => $keys ) {
            if ( ! is_string( $feature ) || ! is_array( $keys ) ) {
                continue;
            }

            $keys = array_values( array_filter( $keys, 'is_string' ) );

            if ( [] !== $keys ) {
                $replaced[ $feature ] = $keys;
            }
        }

        return $replaced;
    }

    /**
     * Core blocks this support is added to automatically.
     *
     * @return list<string>
     */
    public function coreBlocks(): array {
        return array_values( array_filter( (array) ( $this->metadata['coreBlocks'] ?? [] ), 'is_string' ) );
    }

    /**
     * Classes and inline style declarations for one block's stored value
     * (its `supe.{name}` attribute), already in the current shape — call
     * output() for stored values. Both empty when nothing applies.
     *
     * @param  array<string, mixed> $value
     * @return array{classes: list<string>, styles: array<string, string>}
     */
    abstract public function render( array $value ): array;

    /**
     * Stylesheet rules shared by every block using this support, keyed by
     * Viewport value. StyleGenerator wraps tablet and mobile rules in their
     * breakpoint's media query.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array {
        return [];
    }

    /**
     * @return array<string, list<string>>
     */
    protected static function emptyRules(): array {
        return array_fill_keys( array_map( static fn( Viewport $viewport ): string => $viewport->value, Viewport::cases() ), [] );
    }
}
