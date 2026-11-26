<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Supports\Responsive;

use Brain\Monkey\Functions;
use Supe\Editor\Supports\Responsive\Breakpoints;
use Supe\Editor\Supports\Responsive\StyleGenerator;
use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Supe\Editor\Supports\AbstractSupport;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class StyleGeneratorTest extends TestCase {

    private StyleGenerator $styles;

    /** Whether the handle is registered in the (fake) current WP_Styles. */
    private bool $registered = false;

    protected function set_up(): void {
        parent::set_up();

        Functions\when( 'get_option' )->justReturn( [ 'tablet' => 900, 'mobile' => 480 ] );
        Functions\when( 'wp_style_is' )->alias( fn(): bool => $this->registered );

        $this->styles = new StyleGenerator( new Breakpoints(), new ValueSanitizer() );
    }

    public function test_wraps_support_rules_in_breakpoint_media_queries(): void {
        $this->styles->addSupport( $this->supportWithRules( [
            'desktop' => [ '.a{x:1}' ],
            'tablet'  => [ '.b{x:2}' ],
            'mobile'  => [ '.c{x:3}' ],
        ] ) );

        self::assertSame(
            '.a{x:1}@media (max-width:900px){.b{x:2}}@media (max-width:480px){.c{x:3}}',
            $this->styles->css()
        );
    }

    public function test_omits_empty_viewports(): void {
        $this->styles->addSupport( $this->supportWithRules( [ 'mobile' => [ '.c{x:3}' ] ] ) );

        self::assertSame( '@media (max-width:480px){.c{x:3}}', $this->styles->css() );
    }

    public function test_resolves_responsive_variables_with_fallbacks(): void {
        $this->styles->registerVariables( '.wp-block-x', [ 'x-per-view' => 'int', 'x-gap' => 'spacing' ] );

        self::assertSame(
            '.wp-block-x{--x-per-view:var(--x-per-view-d);--x-gap:var(--x-gap-d)}'
            . '@media (max-width:900px){.wp-block-x{--x-per-view:var(--x-per-view-t,var(--x-per-view-d));--x-gap:var(--x-gap-t,var(--x-gap-d))}}'
            . '@media (max-width:480px){.wp-block-x{--x-per-view:var(--x-per-view-m,var(--x-per-view-t,var(--x-per-view-d)));--x-gap:var(--x-gap-m,var(--x-gap-t,var(--x-gap-d)))}}',
            $this->styles->css()
        );
    }

    public function test_variable_styles_write_unset_viewports_as_initial_and_enqueue(): void {
        Functions\expect( 'wp_register_style' )->once()->andReturnUsing( fn(): bool => $this->registered = true );
        Functions\expect( 'wp_add_inline_style' )->once();
        Functions\expect( 'wp_enqueue_style' )->twice()->with( StyleGenerator::HANDLE );

        $this->styles->registerVariables( '.wp-block-x', [ 'x-per-view' => [ 'type' => 'int', 'min' => 1, 'max' => 12 ] ] );

        self::assertSame(
            [ '--x-per-view-d' => '3', '--x-per-view-t' => 'initial', '--x-per-view-m' => '1' ],
            $this->styles->variableStyles( 'x-per-view', [ 'desktop' => 3, 'tablet' => 99, 'mobile' => '1' ] )
        );

        // Registered once per request.
        $this->styles->variableStyles( 'x-per-view', [ 'desktop' => 2 ] );
    }

    public function test_variable_styles_are_empty_when_nothing_is_valid_or_registered(): void {
        Functions\expect( 'wp_enqueue_style' )->never();

        $this->styles->registerVariables( '.wp-block-x', [ 'x-gap' => 'spacing' ] );

        self::assertSame( [], $this->styles->variableStyles( 'x-gap', [ 'desktop' => 'red' ] ) );
        self::assertSame( [], $this->styles->variableStyles( 'unregistered', [ 'desktop' => '1px' ] ) );
    }

    public function test_ignores_invalid_variable_names(): void {
        $this->styles->registerVariables( '.wp-block-x', [ 'bad;name' => 'int' ] );

        self::assertSame( '', $this->styles->css() );
    }

    public function test_enqueue_does_nothing_without_css(): void {
        Functions\expect( 'wp_enqueue_style' )->never();

        $this->styles->enqueue();
    }

    public function test_registers_once_per_wp_styles_instance_and_enqueues_on_every_call(): void {
        Functions\expect( 'wp_register_style' )->twice()->andReturnUsing( fn(): bool => $this->registered = true );
        Functions\expect( 'wp_add_inline_style' )->twice();
        Functions\expect( 'wp_enqueue_style' )->times( 3 )->with( StyleGenerator::HANDLE );

        $this->styles->addSupport( $this->supportWithRules( [ 'desktop' => [ '.a{x:1}' ] ] ) );
        $this->styles->enqueue();
        $this->styles->enqueue();

        // The editor collects the canvas iframe's styles in a fresh WP_Styles
        // that doesn't have registrations made in an earlier temporary one.
        $this->registered = false;
        $this->styles->enqueue();
    }

    public function test_enqueues_in_the_editor_only(): void {
        Functions\when( 'is_admin' )->justReturn( false );
        Functions\expect( 'wp_enqueue_style' )->never();

        $this->styles->addSupport( $this->supportWithRules( [ 'desktop' => [ '.a{x:1}' ] ] ) );
        $this->styles->enqueueInEditor();
    }

    /**
     * Shared with Jest (supports/_framework/test/variables.test.js).
     */
    public function test_responsive_variable_fixtures(): void {
        $fixtures = json_decode( (string) file_get_contents( dirname( __DIR__, 3 ) . '/fixtures/responsive-variables.json' ), true );
        $this->registered = true;
        Functions\when( 'wp_enqueue_style' )->justReturn( null );

        foreach ( $fixtures['styles'] as $case ) {
            $this->styles->registerVariables( '.wp-block-x', [ $case['name'] => $case['type'] ] );

            self::assertSame( $case['expected'], $this->styles->variableStyles( $case['name'], $case['values'] ), $case['label'] );
        }

        foreach ( $fixtures['stylesheet'] as $case ) {
            Functions\when( 'get_option' )->justReturn( $case['breakpoints'] );
            $styles = new StyleGenerator( new Breakpoints(), new ValueSanitizer() );

            foreach ( $case['variables'] as $name => $variable ) {
                $styles->registerVariables( $variable['selector'], [ $name => $variable['type'] ] );
            }

            self::assertSame( $case['expected'], $styles->css(), $case['label'] );
        }
    }

    public function test_inline_joins_declarations(): void {
        self::assertSame( '--a:1;--b:2px', StyleGenerator::inline( [ '--a' => '1', '--b' => '2px' ] ) );
    }

    /**
     * @param array<string, list<string>> $rules
     */
    private function supportWithRules( array $rules ): AbstractSupport {
        return new class( $rules ) extends AbstractSupport {

            /** @param array<string, list<string>> $fixedRules */
            public function __construct( private readonly array $fixedRules ) {}

            public function render( array $value ): array {
                return [ 'classes' => [], 'styles' => [] ];
            }

            public function rules(): array {
                return $this->fixedRules;
            }
        };
    }
}
