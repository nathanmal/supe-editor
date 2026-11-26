const ZOOM = '[data-supe-slides-action="lightbox"]';

/**
 * The slider's lightbox: one native `<dialog>` (render.php, only when an
 * image slide opens in it) showing the full-size image and its caption,
 * with previous / next across the slider's lightbox images (wrapping
 * around) and a counter. `showModal()` gives the backdrop and keeps focus
 * inside; Esc, the close button or a click outside the image closes it.
 * Autoplay waits while it's open; on close the slider shows the image last
 * viewed and focus goes back to it.
 *
 * @param {import('./Slider').default} slider
 */
export default function lightbox( slider ) {
    const { root } = slider;
    const dialog = [ ...root.children ].find( ( child ) =>
        child.matches( '.supe-slides__lightbox' )
    );
    const items = slider.slides
        .map( ( slide, index ) => ( {
            index,
            button: slide.querySelector( ZOOM ),
        } ) )
        .filter( ( item ) => item.button );

    if ( ! dialog || items.length === 0 ) {
        return;
    }

    const image = dialog.querySelector( '.supe-slides__lightbox-image' );
    const caption = dialog.querySelector( '.supe-slides__lightbox-caption' );
    const count = dialog.querySelector( '.supe-slides__lightbox-count' );
    let current = 0;

    dialog.classList.toggle( 'has-one-image', items.length === 1 );

    const show = ( position ) => {
        current = ( position + items.length ) % items.length;

        const { button } = items[ current ];
        const { src, srcset, width, height } = button.dataset;

        image.classList.add( 'is-loading' );
        image.removeAttribute( 'srcset' );
        image.src = src;
        if ( srcset ) {
            image.srcset = srcset;
            image.sizes = '100vw';
        }
        image.width = Number( width ) || 0;
        image.height = Number( height ) || 0;
        image.alt = button.querySelector( 'img' )?.alt ?? '';
        // Sanitized by render.php (wp_kses_post).
        caption.innerHTML = button.dataset.caption || '';
        caption.hidden = ! button.dataset.caption;
        count.textContent = `${ current + 1 } / ${ items.length }`;
    };

    image.addEventListener( 'load', () =>
        image.classList.remove( 'is-loading' )
    );

    root.addEventListener( 'click', ( event ) => {
        const button = event.target.closest( ZOOM );
        const position = items.findIndex( ( item ) => item.button === button );

        if ( position < 0 ) {
            return;
        }

        show( position );
        dialog.showModal();
        slider.autoplay?.hold( 'lightbox', true );
    } );

    dialog.addEventListener( 'click', ( event ) => {
        const action =
            event.target.closest( '[data-lightbox]' )?.dataset.lightbox;

        if ( action === 'prev' ) {
            show( current - 1 );
        } else if ( action === 'next' ) {
            show( current + 1 );
        } else if ( action === 'close' || event.target === dialog ) {
            // The dialog itself is only hit outside the image and buttons.
            dialog.close();
        }
    } );

    dialog.addEventListener( 'keydown', ( event ) => {
        const rtl = window.getComputedStyle( dialog ).direction === 'rtl';
        const step = { ArrowRight: 1, ArrowLeft: -1 }[ event.key ];

        if ( step && items.length > 1 ) {
            event.preventDefault();
            show( current + ( rtl ? -step : step ) );
        }
    } );

    dialog.addEventListener( 'close', () => {
        const { index, button } = items[ current ];

        slider.autoplay?.hold( 'lightbox', false );
        if ( slider.slides[ index ].inert ) {
            slider.goTo( index, { source: 'lightbox' } );
        }
        button.focus( { preventScroll: true } );
    } );
}
