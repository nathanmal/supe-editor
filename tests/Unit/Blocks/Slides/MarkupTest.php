<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Blocks\Slides;

use Brain\Monkey\Functions;
use Supe\Editor\Blocks\Slides\Markup;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class MarkupTest extends TestCase {

    protected function set_up(): void {
        parent::set_up();

        Functions\when( '__' )->returnArg( 1 );
    }

    public function test_type_accepts_only_known_types(): void {
        self::assertSame( 'images', Markup::type( [ 'type' => 'images' ] ) );
        self::assertSame( 'content', Markup::type( [ 'type' => 'content' ] ) );
        self::assertSame( '', Markup::type( [ 'type' => 'posts' ] ) );
        self::assertSame( '', Markup::type( [ 'type' => [ 'images' ] ] ) );
        self::assertSame( '', Markup::type( [] ) );
    }

    public function test_name_reads_the_block_rename_metadata(): void {
        self::assertSame( 'Summer', Markup::name( [ 'metadata' => [ 'name' => '  Summer ' ] ] ) );
        self::assertSame( '', Markup::name( [ 'metadata' => [ 'name' => 42 ] ] ) );
        self::assertSame( '', Markup::name( [] ) );
    }

    public function test_vertical_alignment_accepts_only_known_values(): void {
        self::assertSame( 'center', Markup::verticalAlignment( [ 'verticalAlignment' => 'center' ] ) );
        self::assertSame( '', Markup::verticalAlignment( [ 'verticalAlignment' => 'middle' ] ) );
        self::assertSame( '', Markup::verticalAlignment( [] ) );
    }

    public function test_slide_attributes_mark_a_labelled_group(): void {
        self::assertSame(
            [
                'class'                => 'supe-slides__slide is-vertically-aligned-top',
                'role'                 => 'group',
                'aria-roledescription' => 'slide',
                'aria-label'           => 'Summer',
            ],
            Markup::slideAttributes( 'Summer', [ 'is-vertically-aligned-top' ] )
        );
    }

    public function test_slide_attributes_leave_out_an_empty_label(): void {
        self::assertArrayNotHasKey( 'aria-label', Markup::slideAttributes( '' ) );
    }

    public function test_label_gives_the_position_and_the_name_when_there_is_one(): void {
        self::assertSame( '3 of 7', Markup::label( 3, 7 ) );
        self::assertSame( '3 of 7: Summer', Markup::label( 3, 7, 'Summer' ) );
    }

    public function test_image_settings_fall_back_from_slide_to_slider_defaults_to_built_ins(): void {
        $sizes = [ 'thumbnail', 'medium', 'large' ];

        self::assertSame(
            [ 'size' => 'large', 'fit' => 'cover', 'captionPosition' => 'below' ],
            array_intersect_key( Markup::image( [], [], $sizes ), Markup::IMAGE_DEFAULTS )
        );
        self::assertSame(
            [ 'size' => 'medium', 'fit' => 'contain', 'captionPosition' => 'overlay' ],
            array_intersect_key( Markup::image(
                [ 'size' => 'medium', 'fit' => 'bogus' ],
                [ 'size' => 'thumbnail', 'fit' => 'contain', 'captionPosition' => 'overlay' ],
                $sizes
            ), Markup::IMAGE_DEFAULTS )
        );
        self::assertSame( 'full', Markup::image( [ 'size' => 'full' ], [], $sizes )['size'] );
        self::assertSame( 'large', Markup::image( [ 'size' => 'huge' ], [ 'size' => 'huge' ], $sizes )['size'] );
    }

    public function test_image_settings_clean_up_text_and_link_values(): void {
        $image = Markup::image(
            [ 'alt' => ' A field ', 'caption' => ' <em>Hi</em> ', 'href' => ' https://example.com ', 'linkTarget' => '_blank' ],
            [],
            []
        );

        self::assertSame( 'A field', $image['alt'] );
        self::assertSame( '<em>Hi</em>', $image['caption'] );
        self::assertSame( 'https://example.com', $image['href'] );
        self::assertTrue( $image['newTab'] );
        self::assertFalse( Markup::image( [ 'linkTarget' => '_self' ], [], [] )['newTab'] );
        self::assertSame( '', Markup::image( [ 'alt' => [ 'x' ] ], [], [] )['alt'] );
    }

    public function test_object_position_comes_from_a_valid_focal_point(): void {
        self::assertSame( '25% 70%', Markup::objectPosition( [ 'x' => 0.25, 'y' => 0.7 ] ) );
        self::assertSame( '0% 100%', Markup::objectPosition( [ 'x' => -1, 'y' => 3 ] ) );
        self::assertSame( '33.33% 50%', Markup::objectPosition( [ 'x' => 0.333333, 'y' => 0.5 ] ) );
        self::assertNull( Markup::objectPosition( [ 'x' => '0.5;color:red', 'y' => 0.5 ] ) );
        self::assertNull( Markup::objectPosition( [ 'x' => 0.5 ] ) );
        self::assertNull( Markup::objectPosition( null ) );
    }
}
