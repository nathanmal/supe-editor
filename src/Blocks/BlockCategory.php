<?php

declare(strict_types=1);

namespace Supe\Editor\Blocks;

/**
 * BlockCategory
 *
 * Registers the shared "Supe" block category, unless something else in the
 * stack (e.g. supe-theme's EditorModule) has already added it.
 */
class BlockCategory {

    public function register(): void {
        add_filter( 'block_categories_all', [ $this, 'addCategory' ] );
    }

    public function addCategory( array $categories ): array {
        foreach ( $categories as $category ) {
            if ( ( $category['slug'] ?? null ) === 'supe' ) {
                return $categories;
            }
        }

        return array_merge(
            [
                [
                    'slug'  => 'supe',
                    'title' => __( 'Supe', 'supe-editor' ),
                    'icon'  => 'superhero-alt',
                ],
            ],
            $categories
        );
    }
}
