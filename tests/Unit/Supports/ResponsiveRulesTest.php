<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Supports;

use Supe\Editor\Supports\AbstractResponsiveSupport;
use Supe\Editor\Supports\Responsive\ValueSanitizer;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

/**
 * support.json `rules` and typed options, beyond what the real supports'
 * fixtures cover. Mirrored by supports/_framework/test/rules.test.js.
 */
final class ResponsiveRulesTest extends TestCase {

    public function test_unsafe_rules_are_skipped(): void {
        $support = self::support( [
            'safe'   => [ 'var' => 's', 'rules' => [
                [ 'css' => 'gap', 'selector' => '.a{color:red}' ],
                [ 'css' => 'gap', 'selector' => '.a,.b' ],
                [ 'css' => 'gap;color', 'selector' => '' ],
                [ 'css' => [ 'gap' ] ],
                [ 'css' => 'gap', 'selector' => '.is-layout-flex>*+*', 'important' => false ],
            ] ],
            'unsafe' => [ 'var' => 'u', 'rules' => [ [ 'css' => 'gap', 'selector' => '}' ] ] ],
        ] );

        self::assertSame( [ '.has-supe-s.is-layout-flex>*+*{gap:var(--supe-s)}' ], $support->rules()['desktop'] );
    }

    public function test_a_property_type_can_be_an_options_object(): void {
        $support = self::support( [
            'direction' => [ 'var' => 'fd', 'css' => 'flex-direction', 'type' => [ 'type' => 'keyword', 'values' => [ 'column' ] ] ],
        ] );

        self::assertSame(
            [ 'classes' => [ 'has-supe-fd-m' ], 'styles' => [ '--supe-fd-m' => 'column' ] ],
            $support->render( [ 'direction' => [ 'desktop' => 'row', 'mobile' => 'column' ] ] )
        );
    }

    /**
     * @param array<string, mixed> $properties
     */
    private static function support( array $properties ): AbstractResponsiveSupport {
        $support = new class extends AbstractResponsiveSupport {};
        $support->boot( [ 'name' => 'fake', 'properties' => $properties ], new ValueSanitizer() );

        return $support;
    }
}
