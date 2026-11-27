import { renderSupport, supportRules } from '../render';

// Same cases as PHP's ResponsiveRulesTest.
const support = ( properties ) => ( { name: 'fake', properties } );

describe( 'support rules', () => {
    it( 'skips unsafe rules', () => {
        const rules = supportRules(
            support( {
                safe: {
                    var: 's',
                    rules: [
                        { css: 'gap', selector: '.a{color:red}' },
                        { css: 'gap', selector: '.a,.b' },
                        { css: 'gap;color', selector: '' },
                        { css: [ 'gap' ] },
                        {
                            css: 'gap',
                            selector: '.is-layout-flex>*+*',
                            important: false,
                        },
                    ],
                },
                unsafe: {
                    var: 'u',
                    rules: [ { css: 'gap', selector: '}' } ],
                },
            } )
        );

        expect( rules.desktop ).toEqual( [
            '.has-supe-s.is-layout-flex>*+*{gap:var(--supe-s)}',
        ] );
    } );

    it( 'takes a property type as an options object', () => {
        const metadata = support( {
            direction: {
                var: 'fd',
                css: 'flex-direction',
                type: { type: 'keyword', values: [ 'column' ] },
            },
        } );

        expect(
            renderSupport( metadata, {
                direction: { desktop: 'row', mobile: 'column' },
            } )
        ).toEqual( {
            classes: [ 'has-supe-fd-m' ],
            styles: { '--supe-fd-m': 'column' },
        } );
    } );
} );
