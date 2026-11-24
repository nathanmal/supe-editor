<?php

declare(strict_types=1);

namespace Supe\Editor\Admin;

use Supe\Core\Admin\DashboardPage;
use Supe\Core\Support\AbstractAdminPage;
use Supe\Core\Support\AdminUi;
use Supe\Editor\Blocks\BlockRegistrar;
use Supe\Editor\Module;

/**
 * BlocksPage
 *
 * The module's "Block Editor" page under the Supe menu. Today it lists every
 * block in BlockRegistrar's build/blocks-manifest.php, since blocks are added
 * by dropping in a directory rather than any PHP registration a developer
 * would otherwise see. The slug keeps its original `supe-editor-blocks` so
 * existing links and bookmarks still work.
 */
final class BlocksPage extends AbstractAdminPage {

    public static function slug(): string {
        return 'supe-editor-blocks';
    }

    public function pageTitle(): string {
        return __( 'Block Editor', 'supe-editor' );
    }

    public function menuTitle(): string {
        return __( 'Block Editor', 'supe-editor' );
    }

    public function parentSlug(): ?string {
        return DashboardPage::slug();
    }

    public function description(): string {
        return __( 'Custom blocks, block supports and changes to the block editor itself.', 'supe-editor' );
    }

    public function version(): string {
        return Module::version();
    }

    protected function renderContent(): void {
        /** @var BlockRegistrar $registrar */
        $registrar = $this->make( 'supe.editor.registrar' );
        $blocks    = $this->describeBlocks( $registrar );

        if ( empty( $blocks ) ) {
            AdminUi::emptyState(
                __( 'No blocks yet', 'supe-editor' ),
                __( 'No compiled blocks found in build/. Run npm run build.', 'supe-editor' ),
                'dashicons-block-default'
            );
            return;
        }

        $rows = [];

        foreach ( $blocks as $block ) {
            $rows[] = [
                'title'    => $block['title'],
                'name'     => AdminUi::code( $block['name'] ),
                'category' => $block['category'] !== '' ? AdminUi::badge( $block['category'] ) : '',
            ];
        }

        AdminUi::cardStart(
            __( 'Registered Blocks', 'supe-editor' ),
            sprintf(
                /* translators: %d: number of blocks */
                _n( '%d block available in the editor.', '%d blocks available in the editor.', count( $blocks ), 'supe-editor' ),
                count( $blocks )
            ),
            'dashicons-block-default'
        );

        AdminUi::table(
            [
                'title'    => __( 'Title', 'supe-editor' ),
                'name'     => __( 'Block Name', 'supe-editor' ),
                'category' => __( 'Category', 'supe-editor' ),
            ],
            $rows
        );

        AdminUi::cardEnd();
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
