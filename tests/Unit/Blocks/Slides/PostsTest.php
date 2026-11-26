<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Blocks\Slides;

use Brain\Monkey\Filters;
use Supe\Editor\Blocks\Slides\Posts;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class PostsTest extends TestCase {

    public function test_registers_the_query_loop_short_circuit(): void {
        $posts = new Posts();

        Filters\expectAdded( 'pre_render_block' )->once()->with( [ $posts, 'skipQuery' ], 10, 3 );

        $posts->register();
    }

    public function test_only_query_loops_in_a_track_are_skipped(): void {
        $posts = new Posts();
        $track = $this->block( 'supe/slides-track' );
        $group = $this->block( 'core/group' );

        self::assertSame( '', $posts->skipQuery( null, [ 'blockName' => 'core/query' ], $track ) );
        self::assertNull( $posts->skipQuery( null, [ 'blockName' => 'core/query' ], $group ) );
        self::assertNull( $posts->skipQuery( null, [ 'blockName' => 'core/query' ] ) );
        self::assertNull( $posts->skipQuery( null, [ 'blockName' => 'core/paragraph' ], $track ) );
        self::assertSame( 'kept', $posts->skipQuery( 'kept', [ 'blockName' => 'core/paragraph' ], $track ) );
    }

    public function test_selected_posts_are_clean_ids_in_order_and_only_in_that_mode(): void {
        self::assertSame( [ 7, 3, 9 ], Posts::selected( [ 'orderBy' => 'include', 'include' => [ 7, '3', 0, -2, 'x', 7, 9 ] ] ) );
        self::assertSame( [], Posts::selected( [ 'orderBy' => 'date', 'include' => [ 7 ] ] ) );
        self::assertSame( [], Posts::selected( [ 'orderBy' => 'include', 'include' => '7' ] ) );
        self::assertSame( [], Posts::selected( null ) );
    }

    public function test_query_vars_are_left_alone_outside_selected_mode(): void {
        $vars = [ 'post_type' => 'post', 'posts_per_page' => 6, 'offset' => 2 ];

        self::assertSame( $vars, Posts::queryVars( $vars, [ 'orderBy' => 'date' ] ) );
        self::assertSame( $vars, Posts::queryVars( $vars, null ) );
    }

    public function test_selected_posts_replace_the_query(): void {
        $vars = Posts::queryVars(
            [ 'post_type' => 'page', 'posts_per_page' => 6, 'offset' => 2, 'post__not_in' => [ 1 ], 'tax_query' => [ [] ], 's' => 'x' ],
            [ 'orderBy' => 'include', 'include' => [ 5, 2 ] ]
        );

        self::assertEquals( [
            'post_type'           => 'page',
            'post__in'            => [ 5, 2 ],
            'orderby'             => 'post__in',
            'posts_per_page'      => 2,
            'ignore_sticky_posts' => true,
        ], $vars );
    }

    public function test_selected_mode_with_nothing_picked_finds_nothing(): void {
        $vars = Posts::queryVars( [ 'post_type' => 'post' ], [ 'orderBy' => 'include', 'include' => [] ] );

        self::assertSame( [ 0 ], $vars['post__in'] );
    }

    private function block( string $name ): \WP_Block {
        $block       = \Mockery::mock( \WP_Block::class );
        $block->name = $name;

        return $block;
    }
}
