<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Supports;

use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Supe\Editor\Supports\AbstractSupport;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * Exercises AbstractResponsiveSupport through the real spacing support.
 */
final class SpacingSupportTest extends TestCase {

    private AbstractSupport $support;

    protected function set_up(): void {
        parent::set_up();

        $dir      = dirname( __DIR__, 3 ) . '/supports/spacing/';
        $metadata = json_decode( (string) file_get_contents( $dir . 'support.json' ), true );

        $this->support = require $dir . 'support.php';
        $this->support->boot( $metadata, new ValueSanitizer() );
    }

    public function test_renders_a_class_and_variable_per_set_viewport_value(): void {
        $output = $this->support->render( [
            'padding' => [
                'desktop' => [ 'top' => 'var:preset|spacing|40', 'left' => '2rem' ],
                'mobile'  => [ 'top' => '1rem' ],
            ],
            'margin'  => [
                'tablet' => [ 'bottom' => '-1rem' ],
            ],
        ] );

        self::assertSame(
            [ 'has-supe-pt', 'has-supe-pl', 'has-supe-pt-m', 'has-supe-mb-t' ],
            $output['classes']
        );
        self::assertSame(
            [
                '--supe-pt'   => 'var(--wp--preset--spacing--40)',
                '--supe-pl'   => '2rem',
                '--supe-pt-m' => '1rem',
                '--supe-mb-t' => '-1rem',
            ],
            $output['styles']
        );
    }

    public function test_skips_invalid_values_and_unknown_properties(): void {
        $output = $this->support->render( [
            'padding' => [ 'desktop' => [ 'top' => '-1rem', 'right' => 'red' ] ],
            'border'  => [ 'desktop' => [ 'top' => '1px' ] ],
        ] );

        self::assertSame( [ 'classes' => [], 'styles' => [] ], $output );
    }

    public function test_rules_cover_every_side_and_viewport(): void {
        $rules = $this->support->rules();

        self::assertCount( 8, $rules['desktop'] );
        self::assertCount( 8, $rules['tablet'] );
        self::assertCount( 8, $rules['mobile'] );
        self::assertContains( '.has-supe-pt{padding-top:var(--supe-pt)}', $rules['desktop'] );
        self::assertContains( '.has-supe-ml-m{margin-left:var(--supe-ml-m)}', $rules['mobile'] );
    }
}
