<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Unit\Responsive;

use Supe\Editor\Responsive\ValueSanitizer;
use Yoast\WPTestUtils\BrainMonkey\TestCase;

final class ValueSanitizerTest extends TestCase {

    /**
     * @dataProvider provideValues
     *
     * @param string|array{type: string, min?: int, max?: int} $type
     */
    public function test_sanitizes( string|array $type, mixed $value, ?string $expected ): void {
        self::assertSame( $expected, ( new ValueSanitizer() )->sanitize( $value, $type ) );
    }

    /**
     * @return iterable<string, array{0: string|array<string, mixed>, 1: mixed, 2: ?string}>
     */
    public static function provideValues(): iterable {
        // spacing
        yield 'preset reference'          => [ 'spacing', 'var:preset|spacing|40', 'var(--wp--preset--spacing--40)' ];
        yield 'resolved preset'           => [ 'spacing', 'var(--wp--preset--spacing--x-large)', 'var(--wp--preset--spacing--x-large)' ];
        yield 'px'                        => [ 'spacing', '12px', '12px' ];
        yield 'decimal rem'               => [ 'spacing', ' 1.5REM ', '1.5rem' ];
        yield 'leading-dot percent'       => [ 'spacing', '.5%', '.5%' ];
        yield 'zero'                      => [ 'spacing', 0, '0' ];
        yield 'negative spacing'          => [ 'spacing', '-1rem', null ];
        yield 'spacing auto'              => [ 'spacing', 'auto', null ];
        yield 'unitless number'           => [ 'spacing', '12', null ];
        yield 'unknown unit'              => [ 'spacing', '2em', null ];
        yield 'css injection'             => [ 'spacing', '1px;background:red', null ];
        yield 'preset injection'          => [ 'spacing', 'var:preset|spacing|4);x:(', null ];
        yield 'empty'                     => [ 'spacing', '', null ];
        yield 'array'                     => [ 'spacing', [ '1px' ], null ];
        // margin
        yield 'negative margin'           => [ 'margin', '-1rem', '-1rem' ];
        yield 'margin auto'               => [ 'margin', 'auto', 'auto' ];
        yield 'margin preset'             => [ 'margin', 'var:preset|spacing|20', 'var(--wp--preset--spacing--20)' ];
        // length
        yield 'vh'                        => [ 'length', '60vh', '60vh' ];
        yield 'length auto'               => [ 'length', 'auto', 'auto' ];
        yield 'length rem'                => [ 'length', '10rem', null ];
        yield 'negative length'           => [ 'length', '-10px', null ];
        // ratio
        yield 'ratio pair'                => [ 'ratio', '16/9', '16 / 9' ];
        yield 'spaced ratio pair'         => [ 'ratio', '4 / 3', '4 / 3' ];
        yield 'single ratio'              => [ 'ratio', '1.5', '1.5' ];
        yield 'zero ratio'                => [ 'ratio', '16/0', null ];
        yield 'ratio junk'                => [ 'ratio', '16/9;color:red', null ];
        // int
        yield 'int in range'              => [ [ 'type' => 'int', 'min' => 1, 'max' => 12 ], '3', '3' ];
        yield 'int below range'           => [ [ 'type' => 'int', 'min' => 1, 'max' => 12 ], 0, null ];
        yield 'int above range'           => [ [ 'type' => 'int', 'min' => 1, 'max' => 12 ], 13, null ];
        yield 'int decimal'               => [ 'int', '2.5', null ];
        // unknown type
        yield 'unknown type'              => [ 'color', 'red', null ];
    }
}
