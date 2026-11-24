<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit;

use Supe\Editor\Module;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class ModuleTest extends TestCase {

    public function test_module_identifies_itself_by_package_name(): void {
        self::assertSame( 'nathanmal/supe-editor', Module::id() );
    }

    public function test_module_version_matches_composer_json(): void {
        $composer = json_decode( (string) file_get_contents( dirname( __DIR__, 2 ) . '/composer.json' ), true );

        self::assertSame( $composer['version'], Module::version() );
    }
}
