<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Editor;

use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use Supe\Editor\Editor\HeaderBehavior;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * Covers what HeaderBehavior decides. Applying it to markup
 * (WP_HTML_Tag_Processor) needs real WordPress, so that's for Feature tests.
 */
final class HeaderBehaviorTest extends TestCase {

    private HeaderBehavior $header;

    protected function set_up(): void {
        parent::set_up();

        $this->header = new HeaderBehavior( '/missing/build/', '/plugin/bootstrap.php' );
    }

    public function test_registers_its_hooks(): void {
        $this->header->register();

        self::assertNotFalse( has_filter( 'register_block_type_args', [ $this->header, 'addGroupAttributes' ] ) );
        self::assertNotFalse( has_action( 'init', [ $this->header, 'registerMeta' ] ) );
        self::assertNotFalse( has_action( 'init', [ $this->header, 'registerAssets' ] ) );
        self::assertNotFalse( has_filter( 'render_block_core/group', [ $this->header, 'markHeaderDefault' ] ) );
        self::assertNotFalse( has_filter( 'render_block_core/template-part', [ $this->header, 'apply' ] ) );
    }

    public function test_adds_the_attributes_to_group_only(): void {
        $group = $this->header->addGroupAttributes( [ 'attributes' => [] ], 'core/group' );
        $para  = $this->header->addGroupAttributes( [ 'attributes' => [] ], 'core/paragraph' );

        self::assertSame(
            [ 'supeSticky', 'supeHideOnScroll' ],
            array_keys( $group['attributes'] )
        );
        self::assertSame( [], $para['attributes'] );
    }

    public function test_post_types_are_filterable(): void {
        self::assertSame( [ 'page', 'post' ], $this->header->postTypes() );

        Filters\expectApplied( 'supe/editor/header_behavior/post_types' )
            ->once()
            ->andReturn( [ 'page', 'post', 'product' ] );

        self::assertSame( [ 'page', 'post', 'product' ], $this->header->postTypes() );
    }

    public function test_registers_the_override_meta_for_each_post_type(): void {
        $registered = [];
        Functions\when( 'register_post_meta' )->alias(
            static function ( string $postType, string $key, array $args ) use ( &$registered ): bool {
                $registered[ $postType ] = [ $key, $args['show_in_rest']['schema']['enum'] ];
                return true;
            }
        );

        $this->header->registerMeta();

        $expected = [ HeaderBehavior::META_KEY, [ '', 'static', 'sticky', 'hide-on-scroll' ] ];
        self::assertSame( [ 'page' => $expected, 'post' => $expected ], $registered );
    }

    /**
     * @dataProvider sanitizeCases
     */
    public function test_sanitize_keeps_known_values_only( mixed $input, string $expected ): void {
        self::assertSame( $expected, $this->header->sanitize( $input ) );
    }

    public static function sanitizeCases(): array {
        return [
            'static'         => [ 'static', 'static' ],
            'sticky'         => [ 'sticky', 'sticky' ],
            'hide-on-scroll' => [ 'hide-on-scroll', 'hide-on-scroll' ],
            'empty'          => [ '', '' ],
            'unknown'        => [ 'bogus', '' ],
            'non-string'     => [ [ 'sticky' ], '' ],
        ];
    }

    public function test_only_editors_of_the_post_can_change_it(): void {
        Functions\expect( 'current_user_can' )
            ->once()
            ->with( 'edit_post', 42 )
            ->andReturn( false );

        self::assertFalse( $this->header->canEdit( true, HeaderBehavior::META_KEY, '42' ) );
    }

    /**
     * @dataProvider resolveCases
     */
    public function test_resolve_combines_default_and_override( bool $sticky, bool $hide, string $override, array $expected ): void {
        self::assertSame( $expected, $this->header->resolve( $sticky, $hide, $override ) );
    }

    public static function resolveCases(): array {
        $none   = [ 'sticky' => false, 'hide' => false ];
        $sticky = [ 'sticky' => true, 'hide' => false ];
        $hides  = [ 'sticky' => true, 'hide' => true ];

        return [
            'no default, no override'        => [ false, false, '', $none ],
            'sticky default'                 => [ true, false, '', $sticky ],
            'hiding default'                 => [ true, true, '', $hides ],
            'hide without sticky is ignored' => [ false, true, '', $none ],
            'static overrides hiding'        => [ true, true, 'static', $none ],
            'sticky override on static'      => [ false, false, 'sticky', $sticky ],
            'sticky override drops hiding'   => [ true, true, 'sticky', $sticky ],
            'hide override on static'        => [ false, false, 'hide-on-scroll', $hides ],
            'unknown override is ignored'    => [ true, false, 'bogus', $sticky ],
        ];
    }

    public function test_registers_no_assets_before_the_build(): void {
        Functions\expect( 'wp_register_style' )->never();
        Functions\expect( 'wp_register_script' )->never();

        $this->header->registerAssets();
    }

    public function test_leaves_groups_without_the_option_alone(): void {
        $html = '<div class="wp-block-group">x</div>';

        self::assertSame( $html, $this->header->markHeaderDefault( $html, [ 'attrs' => [] ] ) );
    }
}
