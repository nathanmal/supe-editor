<?php

declare(strict_types=1);

namespace Supe\Editor;

use Supe\Core\Support\AbstractModule;
use Supe\Core\Support\PackageAssets;
use Supe\Editor\Admin\BlocksPage;
use Supe\Editor\Blocks\BlockCategory;
use Supe\Editor\Blocks\BlockRegistrar;
use Supe\Editor\Editor\EditorAssets;
use Supe\Editor\Editor\HeaderBehavior;
use Supe\Editor\Editor\PageTemplateMode;
use Supe\Editor\Supports\Renderer;
use Supe\Editor\Supports\Responsive\Breakpoints;
use Supe\Editor\Supports\Responsive\StyleGenerator;
use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Supe\Editor\Supports\SupportAssets;
use Supe\Editor\Supports\SupportRegistry;

/**
 * Module
 *
 * Block editor module for the Supe ecosystem: custom Gutenberg blocks plus
 * modifications to the editor itself.
 *
 * Provides:
 *  - Auto-discovery and registration of every compiled block in build/
 *  - A shared "Supe" block category
 *  - Custom block supports (supports/{name}/) with responsive, per-viewport
 *    values and site-wide breakpoints
 *  - Shared editor components (components/), one script used by blocks,
 *    supports and editor modifications (SharedComponents)
 *  - Editor modifications that aren't blocks (editor/, e.g. the page title
 *    prompt) plus editor UI and canvas styles, built to build/editor/ and
 *    enqueued by EditorAssets
 *  - Header behavior: sticky / hide-on-scroll header, set on the header and
 *    overridable per page (HeaderBehavior)
 *  - Template-locked page editing for themes that declare
 *    `supe-blank-page-template` support (PageTemplateMode)
 *
 * Add a new block by dropping its source into blocks/{name}/ (block.json,
 * index.js, edit.js, save.js) and running `npm run build` — no PHP changes
 * are needed; BlockRegistrar picks up every block listed in build/blocks-manifest.php.
 */
final class Module extends AbstractModule {
    public static function id(): string {
        return 'nathanmal/supe-editor';
    }

    public static function version(): string {
        return '1.0.0';
    }

    public function boot(): void {
        if ( ! defined( 'SUPE_EDITOR_DIR' ) ) {
            define( 'SUPE_EDITOR_DIR', dirname( __DIR__ ) . '/' );
        }

        // Map the symlinked Composer install so WordPress can build URLs for
        // build/ assets (incl. the block.json ones it realpath()s itself).
        $this->singleton( 'supe.editor.package', fn( $c ) => new PackageAssets( 'nathanmal/supe-editor', dirname( __DIR__ ) ) );
        $this->make( 'supe.editor.package' )->register();

        $this->singleton( 'supe.editor.components',     fn( $c ) => new SharedComponents( SUPE_EDITOR_DIR . 'build/', SUPE_EDITOR_DIR . 'bootstrap.php' ) );
        $this->singleton( 'supe.editor.category',       fn( $c ) => new BlockCategory() );
        $this->singleton( 'supe.editor.registrar',      fn( $c ) => new BlockRegistrar( SUPE_EDITOR_DIR . 'build/' ) );
        $this->singleton( 'supe.editor.breakpoints',    fn( $c ) => new Breakpoints() );
        $this->singleton( 'supe.editor.sanitizer',      fn( $c ) => new ValueSanitizer() );
        $this->singleton( 'supe.editor.styles',         fn( $c ) => new StyleGenerator( $c->make( 'supe.editor.breakpoints' ), $c->make( 'supe.editor.sanitizer' ) ) );
        $this->singleton( 'supe.editor.supports',       fn( $c ) => new SupportRegistry( SUPE_EDITOR_DIR . 'supports/', $c->make( 'supe.editor.sanitizer' ), $c->make( 'supe.editor.styles' ) ) );
        $this->singleton( 'supe.editor.renderer',       fn( $c ) => new Renderer( $c->make( 'supe.editor.supports' ), $c->make( 'supe.editor.styles' ) ) );
        $this->singleton( 'supe.editor.support_assets', fn( $c ) => new SupportAssets( SUPE_EDITOR_DIR . 'build/', SUPE_EDITOR_DIR . 'bootstrap.php', $c->make( 'supe.editor.breakpoints' ) ) );
        $this->singleton( 'supe.editor.assets',         fn( $c ) => new EditorAssets( SUPE_EDITOR_DIR . 'build/', SUPE_EDITOR_DIR . 'bootstrap.php' ) );
        $this->singleton( 'supe.editor.header',         fn( $c ) => new HeaderBehavior( SUPE_EDITOR_DIR . 'build/', SUPE_EDITOR_DIR . 'bootstrap.php' ) );
        $this->singleton( 'supe.editor.page_mode',      fn( $c ) => new PageTemplateMode() );

        $this->make( 'supe.editor.components' )->register();
        $this->make( 'supe.editor.category' )->register();
        $this->make( 'supe.editor.registrar' )->register();
        $this->make( 'supe.editor.breakpoints' )->register();
        $this->make( 'supe.editor.styles' )->register();
        $this->make( 'supe.editor.supports' )->register();
        $this->make( 'supe.editor.renderer' )->register();
        $this->make( 'supe.editor.support_assets' )->register();
        $this->make( 'supe.editor.assets' )->register();
        $this->make( 'supe.editor.header' )->register();
        $this->make( 'supe.editor.page_mode' )->register();

        $this->addAdminPage( BlocksPage::class );
    }
}
