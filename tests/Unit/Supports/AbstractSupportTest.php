<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Supports;

use Supe\Editor\Supports\AbstractSupport;
use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * Upgrading stored values between shape versions. Mirrored by
 * supports/_framework/test/upgrade.test.js.
 */
final class AbstractSupportTest extends TestCase {

    public function test_a_value_at_the_current_version_is_kept(): void {
        self::assertSame( [ 'size' => 1, 'v' => 3 ], $this->support()->upgrade( [ 'size' => 1, 'v' => 3 ] ) );
    }

    public function test_runs_every_migration_from_the_stored_version(): void {
        // v1 { size } → v2 { width } → v3 { width, unit }.
        self::assertSame(
            [ 'width' => 4, 'unit' => 'px', 'v' => 3 ],
            $this->support()->upgrade( [ 'size' => 4, 'v' => 1 ] )
        );
    }

    public function test_a_value_without_a_version_is_version_1(): void {
        self::assertSame( [ 'width' => 4, 'unit' => 'px', 'v' => 3 ], $this->support()->upgrade( [ 'size' => 4 ] ) );
    }

    public function test_unreadable_versions_give_null(): void {
        $support = $this->support();

        self::assertNull( $support->upgrade( [ 'v' => 4 ] ) );
        self::assertNull( $support->upgrade( [ 'v' => 0 ] ) );
        self::assertNull( $support->upgrade( [ 'v' => '1' ] ) );
    }

    public function test_a_missing_migration_gives_null(): void {
        $support = $this->support( [ 2 => static fn( array $value ): array => $value ] );

        self::assertNull( $support->upgrade( [ 'v' => 1 ] ) );
    }

    public function test_output_renders_nothing_for_unreadable_values(): void {
        self::assertSame( [ 'classes' => [], 'styles' => [] ], $this->support()->output( [ 'v' => 9 ] ) );
        self::assertSame( [ 'classes' => [ 'width-4px' ], 'styles' => [] ], $this->support()->output( [ 'size' => 4 ] ) );
    }

    public function test_version_defaults_to_1(): void {
        $support = $this->support();
        $support->boot( [ 'name' => 'fake' ], new ValueSanitizer() );

        self::assertSame( 1, $support->version() );
    }

    /**
     * A version 3 support whose migrations rename `size` to `width` (1 → 2)
     * and add `unit` (2 → 3).
     *
     * @param array<int, callable>|null $migrations
     */
    private function support( ?array $migrations = null ): AbstractSupport {
        $support = new class( $migrations ) extends AbstractSupport {

            /** @param array<int, callable>|null $migrations */
            public function __construct( private readonly ?array $migrations ) {}

            public function render( array $value ): array {
                return [ 'classes' => [ 'width-' . $value['width'] . $value['unit'] ], 'styles' => [] ];
            }

            protected function migrations(): array {
                return $this->migrations ?? [
                    1 => static fn( array $value ): array => [ 'width' => $value['size'] ?? 0 ],
                    2 => static fn( array $value ): array => $value + [ 'unit' => 'px' ],
                ];
            }
        };
        $support->boot( [ 'name' => 'fake', 'version' => 3 ], new ValueSanitizer() );

        return $support;
    }
}
