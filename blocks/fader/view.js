/**
 * Front end: cycles each fader's images. The next image becomes
 * `is-active` and fades in (style.scss) over the current one, which turns
 * `is-previous` and stays opaque until the next change. Waits while the tab
 * is hidden or the fader is off screen; with reduced motion the first image
 * just stays. A script module, so it runs after the document has parsed.
 */
import { timing } from './timing';

const SLIDE = '.supe-fader__slide';

/**
 * @param {HTMLElement} root A fader.
 */
function start( root ) {
    const slides = [ ...root.children ].filter( ( child ) =>
        child.matches( SLIDE )
    );
    if ( slides.length < 2 ) {
        return;
    }

    const motion = window.matchMedia( '(prefers-reduced-motion: reduce)' );

    let config = {};
    try {
        config = JSON.parse( root.dataset.supeFader || '{}' );
    } catch {}
    const { duration, fade } = timing( config );
    const paused = new Set();
    let current = Math.max(
        0,
        slides.findIndex( ( slide ) => slide.classList.contains( 'is-active' ) )
    );
    let timer = null;

    const show = ( index ) => {
        slides.forEach( ( slide ) => slide.classList.remove( 'is-previous' ) );
        // The incoming image has to be seen transparent before it turns
        // active, or there's nothing to fade: with two images it was the
        // opaque one underneath until now. Measuring it applies the change
        // (it's under the current image, so this doesn't show).
        slides[ index ].getBoundingClientRect();
        slides[ current ].classList.replace( 'is-active', 'is-previous' );
        slides[ current ].setAttribute( 'aria-hidden', 'true' );
        current = index;
        slides[ current ].classList.add( 'is-active' );
        slides[ current ].removeAttribute( 'aria-hidden' );
    };

    // Each image stays at least as long as its fade-in.
    const schedule = () => {
        window.clearTimeout( timer );
        timer =
            paused.size || motion.matches
                ? null
                : window.setTimeout(
                      () => {
                          show( ( current + 1 ) % slides.length );
                          schedule();
                      },
                      Math.max( duration, fade )
                  );
    };
    const pause = ( reason, on ) => {
        if ( on ) {
            paused.add( reason );
        } else {
            paused.delete( reason );
        }
        schedule();
    };

    document.addEventListener( 'visibilitychange', () =>
        pause( 'hidden', document.hidden )
    );
    new window.IntersectionObserver( ( [ entry ] ) =>
        pause( 'offscreen', ! entry.isIntersecting )
    ).observe( root );
    motion.addEventListener( 'change', schedule );
    schedule();
}

document.querySelectorAll( '[data-supe-fader]' ).forEach( start );
