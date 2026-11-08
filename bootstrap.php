<?php
// bootstrap.php
//
// Composer's "files" autoload runs this the instant vendor/autoload.php is
// required, including outside WordPress (tests, WP-CLI early boot, static
// analysis). Guard against calling add_action() before WP's hook system
// exists — in real WordPress this is always already loaded by the time any
// plugin's autoloader runs, so the guard is a no-op there.
if ( function_exists( 'add_action' ) ) {
    add_action( 'supe/before_boot', function ( \Supe\Core\Registry\ModuleRegistry $registry ): void {
        $registry->register( \Supe\Editor\Module::class );
    } );
}
