import {
    FIT_OPTIONS,
    imageSlideAttributes,
    resolveImageSettings,
    resolveLightbox,
    withDefaultOption,
} from '../image-settings';

describe( 'resolveImageSettings', () => {
    it( 'falls back from the slide to the slider defaults to built-ins', () => {
        expect( resolveImageSettings( {} ) ).toEqual( {
            size: 'large',
            fit: 'cover',
            captionPosition: 'below',
        } );
        expect(
            resolveImageSettings(
                { size: 'medium' },
                { size: 'thumbnail', fit: 'contain' }
            )
        ).toEqual( {
            size: 'medium',
            fit: 'contain',
            captionPosition: 'below',
        } );
    } );
} );

describe( 'withDefaultOption', () => {
    it( 'prepends a "Default" option naming the fallback', () => {
        const options = withDefaultOption( FIT_OPTIONS, 'contain' );

        expect( options[ 0 ] ).toEqual( {
            value: '',
            label: 'Default (Contain)',
        } );
        expect( options.slice( 1 ) ).toEqual( FIT_OPTIONS );
    } );

    it( 'shows the raw value when no option matches it', () => {
        expect( withDefaultOption( [], 'huge' )[ 0 ].label ).toBe(
            'Default (huge)'
        );
    } );
} );

describe( 'imageSlideAttributes', () => {
    it( 'keeps the id and a non-empty library caption', () => {
        expect( imageSlideAttributes( { id: 4, caption: 'Hi' } ) ).toEqual( {
            id: 4,
            caption: 'Hi',
        } );
        expect( imageSlideAttributes( { id: 4, caption: '' } ) ).toEqual( {
            id: 4,
            caption: undefined,
        } );
    } );
} );

describe( 'resolveLightbox', () => {
    it( 'falls back to the slider default, then off', () => {
        expect( resolveLightbox( {} ) ).toBe( false );
        expect( resolveLightbox( {}, { lightbox: true } ) ).toBe( true );
        expect(
            resolveLightbox( { lightbox: false }, { lightbox: true } )
        ).toBe( false );
    } );

    it( 'never opens a linked image', () => {
        expect(
            resolveLightbox( { lightbox: true, href: 'https://example.com' } )
        ).toBe( false );
    } );
} );
