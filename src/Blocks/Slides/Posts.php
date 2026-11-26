<?php

declare(strict_types=1);

namespace Supe\Editor\Blocks\Slides;

use WP_Block;
use WP_Query;

/**
 * Posts
 *
 * Post slides. A posts slider's track holds a locked Query Loop
 * (`core/query` → `core/post-template`), so Query Loop's own settings pick
 * the posts and the post template is the slide's design. On the front end
 * the track renders the posts itself, each as a slide directly in the track
 * (render()), and core's render of that Query Loop is skipped (skipQuery()),
 * so the layout, labels and engine work exactly as for the other types.
 *
 * "Selected posts" are stored in the Query Loop's own `query` attribute as
 * `include` (post IDs, in order) with `orderBy: include`: core forwards
 * unknown query keys to the REST API in the editor, whose posts endpoint
 * supports both, so the editor preview shows the same posts (queryVars()
 * applies them on the front end).
 */
final class Posts {

    public const TRACK = 'supe/slides-track';
    public const QUERY = 'core/query';

    public function register(): void {
        add_filter( 'pre_render_block', [ $this, 'skipQuery' ], 10, 3 );
    }

    /**
     * Core's render of a Query Loop in a slider track is skipped: the track
     * renders its posts (and would otherwise run the query twice).
     *
     * @param string|null $pre    Short-circuit markup so far.
     * @param array       $parsed The block being rendered.
     * @param mixed       $parent Its parent block, if any.
     */
    public function skipQuery( ?string $pre, array $parsed, mixed $parent = null ): ?string {
        if ( self::QUERY === ( $parsed['blockName'] ?? null ) && $parent instanceof WP_Block && self::TRACK === $parent->name ) {
            return '';
        }

        return $pre;
    }

    /**
     * The selected posts' IDs, in order — empty unless the query is in
     * "Selected posts" mode.
     *
     * @param mixed $query The Query Loop's `query` attribute.
     * @return int[]
     */
    public static function selected( mixed $query ): array {
        if ( ! is_array( $query ) || 'include' !== ( $query['orderBy'] ?? null ) || ! is_array( $query['include'] ?? null ) ) {
            return [];
        }

        $ids = array_filter(
            array_map( static fn ( mixed $id ): int => is_numeric( $id ) ? (int) $id : 0, $query['include'] ),
            static fn ( int $id ): bool => $id > 0
        );

        return array_values( array_unique( $ids ) );
    }

    /**
     * WP_Query vars for the slider: Query Loop's own (from
     * build_query_vars_from_query_block()), with "Selected posts" applied —
     * exactly those posts in that order, or none when nothing's picked yet.
     *
     * @param array $vars  From build_query_vars_from_query_block().
     * @param mixed $query The Query Loop's `query` attribute.
     */
    public static function queryVars( array $vars, mixed $query ): array {
        if ( ! is_array( $query ) || 'include' !== ( $query['orderBy'] ?? null ) ) {
            return $vars;
        }

        $ids = self::selected( $query );

        unset( $vars['offset'], $vars['post__not_in'], $vars['tax_query'], $vars['author'], $vars['s'] );

        return [
            ...$vars,
            'post__in'            => $ids ?: [ 0 ],
            'orderby'             => 'post__in',
            'posts_per_page'      => max( 1, count( $ids ) ),
            'ignore_sticky_posts' => true,
        ];
    }

    /**
     * The track's posts as slides: each post through the post template's
     * blocks (as core/post-template does), wrapped in a slide element with
     * the post's classes and its title as the slide name.
     */
    public function render( WP_Block $track ): string {
        $query    = $this->child( $track, self::QUERY );
        $template = $query ? $this->child( $query, 'core/post-template' ) : null;

        if ( null === $template ) {
            return '';
        }

        $settings = $query->attributes['query'] ?? [];

        if ( ! empty( $settings['inherit'] ) ) {
            // Like core: the page's own query (archives, search).
            global $wp_query;
            $posts = clone $wp_query;
        } else {
            $posts = new WP_Query( self::queryVars( build_query_vars_from_query_block( $template, 1 ), $settings ) );
        }

        $html = '';
        while ( $posts->have_posts() ) {
            $posts->the_post();

            $item              = $template->parsed_block;
            $item['blockName'] = 'core/null';

            $content = ( new WP_Block( $item, [
                'postType' => get_post_type(),
                'postId'   => get_the_ID(),
            ] ) )->render( [ 'dynamic' => false ] );

            $attributes = Markup::slideAttributes(
                wp_strip_all_tags( get_the_title() ),
                [ 'wp-block-post', ...get_post_class() ]
            );

            $html .= sprintf( '<div %s>%s</div>', self::attributes( $attributes ), $content );
        }
        wp_reset_postdata();

        return $html;
    }

    /**
     * @param array<string, string> $attributes
     */
    private static function attributes( array $attributes ): string {
        return implode( ' ', array_map(
            static fn ( string $name, string $value ): string => sprintf( '%s="%s"', $name, esc_attr( $value ) ),
            array_keys( $attributes ),
            $attributes
        ) );
    }

    private function child( WP_Block $block, string $name ): ?WP_Block {
        foreach ( $block->inner_blocks as $child ) {
            if ( $name === $child->name ) {
                return $child;
            }
        }

        return null;
    }
}
