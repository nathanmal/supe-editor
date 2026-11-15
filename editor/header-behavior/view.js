/**
 * Header behavior — front end. Built to build/header-behavior/view.{js,css}
 * and enqueued by Editor\HeaderBehavior only where the header is sticky
 * (CSS) or hides on scroll (CSS + this script).
 *
 * Hides the sticky header while scrolling down and shows it again when
 * scrolling up.
 */
import './view.scss';

// Ignore small scroll jitter.
const THRESHOLD = 10;

const marker = document.querySelector( '.supe-header-hide-on-scroll' );
// The <header> template-part wrapper is what sticks and slides.
const header = marker?.parentElement;

if ( header ) {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
        ticking = false;
        const y = window.scrollY;

        // Always show the header near the top of the page.
        if ( y <= header.offsetHeight ) {
            header.classList.remove( 'is-header-hidden' );
            lastY = y;
            return;
        }

        if ( Math.abs( y - lastY ) < THRESHOLD ) {
            return;
        }

        header.classList.toggle( 'is-header-hidden', y > lastY );
        lastY = y;
    };

    window.addEventListener(
        'scroll',
        () => {
            if ( ! ticking ) {
                ticking = true;
                window.requestAnimationFrame( update );
            }
        },
        { passive: true }
    );
}
