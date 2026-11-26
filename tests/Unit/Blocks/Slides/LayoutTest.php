<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Blocks\Slides;

use Brain\Monkey\Actions;
use Brain\Monkey\Functions;
use Supe\Editor\Blocks\Slides\Layout;
use Supe\Editor\Supports\Responsive\Breakpoints;
use Supe\Editor\Supports\Responsive\StyleGenerator;
use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * Render cases live in tests/fixtures/slides-layout.json, shared with Jest
 * (blocks/slides/shared/test/layout.test.js) so the editor preview and the
 * front end can't drift apart.
 */
final class LayoutTest extends TestCase {

    private StyleGenerator $styles;

    private Layout $layout;

    protected function set_up(): void {
        parent::set_up();

        Functions\when( 'get_option' )->justReturn( false );
        Functions\when( 'wp_style_is' )->justReturn( true );
        Functions\when( 'wp_enqueue_style' )->justReturn( null );

        $this->styles = new StyleGenerator( new Breakpoints(), new ValueSanitizer() );
        $this->layout = new Layout( $this->styles, new ValueSanitizer() );
        $this->layout->registerVariables();
    }

    public function test_registers_its_variables_on_init(): void {
        Actions\expectAdded( 'init' )->once()->with( [ $this->layout, 'registerVariables' ] );

        $this->layout->register();
    }

    public function test_fixture_cases(): void {
        foreach ( self::fixtures()['cases'] as $case ) {
            self::assertSame( $case['expected']['classes'], Layout::classes( $case['attributes'] ), $case['label'] );
            self::assertSame( $case['expected']['styles'], $this->layout->styles( $case['attributes'] ), $case['label'] );
        }
    }

    public function test_the_stylesheet_resolves_each_variable_through_the_viewports(): void {
        $css = $this->styles->css();

        self::assertStringContainsString(
            '.wp-block-supe-slides{--supe-slides-per-view:var(--supe-slides-per-view-d);--supe-slides-gap:var(--supe-slides-gap-d);--supe-slides-h:var(--supe-slides-h-d);--supe-slides-ar:var(--supe-slides-ar-d)}',
            $css
        );
        self::assertStringContainsString(
            '@media (max-width:600px){.wp-block-supe-slides{--supe-slides-per-view:var(--supe-slides-per-view-m,var(--supe-slides-per-view-t,var(--supe-slides-per-view-d)));',
            $css
        );
    }

    /**
     * @return array{cases: list<array{label: string, attributes: array, expected: array}>}
     */
    private static function fixtures(): array {
        return json_decode( (string) file_get_contents( dirname( __DIR__, 3 ) . '/fixtures/slides-layout.json' ), true );
    }
}
