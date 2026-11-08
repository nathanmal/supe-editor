<?php

declare(strict_types=1);

// No WordPress here at all — Brain Monkey (via each TestCase's set_up/tear_down)
// fakes add_action/do_action/apply_filters etc. for the duration of each test.
require dirname(__DIR__) . '/vendor/autoload.php';

// Files like supports/*/support.php exit without it (direct-access guard).
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', sys_get_temp_dir() . '/' );
}
