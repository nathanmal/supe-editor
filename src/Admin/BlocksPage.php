<?php

declare(strict_types=1);

namespace Supe\Editor\Admin;

use Supe\Editor\Blocks\BlockRegistrar;
use Supe\Core\Admin\DashboardPage;
use Supe\Core\Support\AbstractAdminPage;

/**
 * BlocksPage
 *
 * Read-only diagnostic page listing every block in BlockRegistrar's
 * build/blocks-manifest.php, since blocks are added by dropping in a directory rather than
 * any PHP registration a developer would otherwise see.
 */
final class BlocksPage extends AbstractAdminPage {

    public static function slug(): string {
        return 'supe-editor-blocks';
    }

    public function pageTitle(): string {
        return __( 'Supe Blocks', 'supe-editor' );
    }

    public function menuTitle(): string {
        return __( 'Blocks', 'supe-editor' );
    }

    public function parentSlug(): ?string {
        return DashboardPage::slug();
    }

    public function render(): void {
        /** @var BlockRegistrar $registrar */
        $registrar = $this->make( 'supe.editor.registrar' );
        $blocks    = $this->describeBlocks( $registrar );

        echo '<div class="wrap">';
        echo '<h1>' . esc_html( $this->pageTitle() ) . '</h1>';

        if ( empty( $blocks ) ) {
            echo '<p>' . esc_html__( 'No compiled blocks found in build/. Run npm run build.', 'supe-editor' ) . '</p>';
            echo '</div>';
            return;
        }

        echo '<table class="widefat striped"><thead><tr>';
        echo '<th>' . esc_html__( 'Title', 'supe-editor' ) . '</th>';
        echo '<th>' . esc_html__( 'Block Name', 'supe-editor' ) . '</th>';
        echo '<th>' . esc_html__( 'Category', 'supe-editor' ) . '</th>';
        echo '</tr></thead><tbody>';

        foreach ( $blocks as $block ) {
            echo '<tr>';
            echo '<td>' . esc_html( $block['title'] ) . '</td>';
            echo '<td><code>' . esc_html( $block['name'] ) . '</code></td>';
            echo '<td>' . esc_html( $block['category'] ) . '</td>';
            echo '</tr>';
        }

        echo '</tbody></table></div>';
    }

    /**
     * @return list<array{name: string, title: string, category: string}>
     */
    private function describeBlocks( BlockRegistrar $registrar ): array {
        $blocks = [];

        foreach ( $registrar->discover() as $dir => $meta ) {
            $blocks[] = [
                'name'     => $meta['name']     ?? $dir,
                'title'    => $meta['title']    ?? '',
                'category' => $meta['category'] ?? '',
            ];
        }

        return $blocks;
    }
}
