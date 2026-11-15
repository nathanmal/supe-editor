<?php

declare(strict_types=1);

namespace Supe\Editor\Editor;

/**
 * PageTemplateMode
 *
 * Opens pages in the editor with "Show template" on (template-locked
 * rendering mode) when the active theme declares
 * `add_theme_support( 'supe-blank-page-template' )` — i.e. its page template
 * has no Post Title block, so the editor should show the page the way the
 * front end does. The page title prompt (editor/page-title-prompt) covers
 * naming the page in that mode.
 *
 * A user's own "Show template" choice still wins: it's saved per user and
 * read before the post type default.
 */
class PageTemplateMode {

    public const THEME_SUPPORT = 'supe-blank-page-template';

    public function register(): void {
        // After themes' after_setup_theme, before the editor reads post type supports.
        add_action( 'init', [ $this, 'setDefaultMode' ] );
    }

    public function setDefaultMode(): void {
        if ( ! current_theme_supports( self::THEME_SUPPORT ) ) {
            return;
        }

        add_post_type_support( 'page', 'editor', [ 'default-mode' => 'template-locked' ] );
    }
}
