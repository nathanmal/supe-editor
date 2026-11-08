<?php

declare(strict_types=1);

namespace Supe\Editor;

use Composer\InstalledVersions;
use Supe\Core\Support\AbstractModule;
use Supe\Editor\Admin\BlocksPage;
use Supe\Editor\Responsive\Breakpoints;
use Supe\Editor\Responsive\StyleGenerator;
use Supe\Editor\Responsive\ValueSanitizer;
use Supe\Editor\Services\BlockCategory;
use Supe\Editor\Services\BlockRegistrar;
use Supe\Editor\Services\EditorAssets;
use Supe\Editor\Services\HeaderBehavior;
use Supe\Editor\Services\PageTemplateMode;
use Supe\Editor\Supports\Renderer;
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
 *  - Editor modifications that aren't blocks (editor/, e.g. the page title
 *    prompt), built to build/editor/ and enqueued by EditorAssets
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
        return 'editor';
    }

    public static function version(): string {
        return '1.0.0';
    }

    public function boot(): void {
        if ( ! defined( 'SUPE_EDITOR_DIR' ) ) {
            define( 'SUPE_EDITOR_DIR', dirname( __DIR__ ) . '/' );
        }

        $this->mapSymlinkedInstall();

        $this->singleton( 'supe.editor.category',    fn( $c ) => new BlockCategory() );
        $this->singleton( 'supe.editor.registrar',   fn( $c ) => new BlockRegistrar( SUPE_EDITOR_DIR . 'build/' ) );
        $this->singleton( 'supe.editor.breakpoints', fn( $c ) => new Breakpoints() );
        $this->singleton( 'supe.editor.sanitizer',   fn( $c ) => new ValueSanitizer() );
        $this->singleton( 'supe.editor.styles',      fn( $c ) => new StyleGenerator( $c->make( 'supe.editor.breakpoints' ), $c->make( 'supe.editor.sanitizer' ) ) );
        $this->singleton( 'supe.editor.supports',    fn( $c ) => new SupportRegistry( SUPE_EDITOR_DIR . 'supports/', $c->make( 'supe.editor.sanitizer' ), $c->make( 'supe.editor.styles' ) ) );
        $this->singleton( 'supe.editor.renderer',    fn( $c ) => new Renderer( $c->make( 'supe.editor.supports' ), $c->make( 'supe.editor.styles' ) ) );
        $this->singleton( 'supe.editor.assets',      fn( $c ) => new EditorAssets( SUPE_EDITOR_DIR . 'build/', SUPE_EDITOR_DIR . 'bootstrap.php' ) );
        $this->singleton( 'supe.editor.header',      fn( $c ) => new HeaderBehavior( SUPE_EDITOR_DIR . 'build/', SUPE_EDITOR_DIR . 'bootstrap.php' ) );
        $this->singleton( 'supe.editor.page_mode',   fn( $c ) => new PageTemplateMode() );

        $this->make( 'supe.editor.category' )->register();
        $this->make( 'supe.editor.registrar' )->register();
        $this->make( 'supe.editor.breakpoints' )->register();
        $this->make( 'supe.editor.styles' )->register();
        $this->make( 'supe.editor.supports' )->register();
        $this->make( 'supe.editor.renderer' )->register();
        $this->make( 'supe.editor.assets' )->register();
        $this->make( 'supe.editor.header' )->register();
        $this->make( 'supe.editor.page_mode' )->register();

        $this->addAdminPage( BlocksPage::class );
    }

    /**
     * When this package is symlinked in via a Composer path repository, the
     * real path of every block asset (WordPress realpath()s them) lives
     * outside wp-content, so plugin_basename() can't turn it into a URL —
     * worse, a sibling symlinked plugin whose real path is a string prefix of
     * ours (e.g. ../supe vs ../supe-editor) rewrites it to a bogus
     * plugins/supe-editor/ URL. Register the Composer install path ↔ real
     * path pair, the same way wp_register_plugin_realpath() does for
     * symlinked plugins. A no-op when the package isn't symlinked.
     */
    private function mapSymlinkedInstall(): void {
        global $wp_plugin_paths;

        if ( ! class_exists( InstalledVersions::class ) || ! InstalledVersions::isInstalled( 'nathanmal/supe-editor' ) ) {
            return;
        }

        $installPath = InstalledVersions::getInstallPath( 'nathanmal/supe-editor' );
        $realPath    = realpath( dirname( __DIR__ ) );

        if ( null === $installPath || false === $realPath ) {
            return;
        }

        $installPath = self::collapseDotSegments( wp_normalize_path( $installPath ) );
        $realPath    = wp_normalize_path( $realPath );

        if ( $installPath !== $realPath ) {
            $wp_plugin_paths[ $installPath ] = $realPath;
        }
    }

    /**
     * Resolves ./.. segments lexically — unlike realpath(), without
     * following the symlink we're trying to preserve.
     */
    private static function collapseDotSegments( string $path ): string {
        $segments = [];

        foreach ( explode( '/', $path ) as $segment ) {
            if ( '..' === $segment ) {
                array_pop( $segments );
            } elseif ( '.' !== $segment && ( '' !== $segment || [] === $segments ) ) {
                $segments[] = $segment;
            }
        }

        return implode( '/', $segments );
    }
}
