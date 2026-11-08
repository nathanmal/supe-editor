<?php

declare(strict_types=1);

namespace Supe\Editor\Supports;

use Supe\Editor\Responsive\Viewport;
use Supe\Editor\Responsive\ValueSanitizer;

/**
 * AbstractSupport
 *
 * Base for a custom block support. Each support lives in its own
 * supports/{name}/ folder: support.json holds its metadata (shared with the
 * editor script), and support.php returns an instance of a subclass, which
 * SupportRegistry loads and boots.
 */
abstract class AbstractSupport {

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
     * Core blocks this support is added to automatically.
     *
     * @return list<string>
     */
    public function coreBlocks(): array {
        return array_values( array_filter( (array) ( $this->metadata['coreBlocks'] ?? [] ), 'is_string' ) );
    }

    /**
     * Classes and inline style declarations for one block's stored value
     * (its `supe.{name}` attribute). Both empty when nothing applies.
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
