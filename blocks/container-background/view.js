/**
 * Front end: plays Container background videos (enqueued only for videos).
 * A video plays while it's on screen in a visible tab, unless the visitor
 * prefers reduced motion or paused it with the (optional) pause button;
 * if the browser refuses to play it (power saving), it stays on its poster
 * and the button offers Play. A script module, so it runs after the
 * document has parsed.
 */
const motion = window.matchMedia( '(prefers-reduced-motion: reduce)' );

/**
 * @param {HTMLVideoElement} video A background video.
 */
function start( video ) {
    const button = video
        .closest( '.wp-block-supe-container-background' )
        ?.querySelector( '.wp-block-supe-container-background__pause' );
    const pauseLabel = button?.getAttribute( 'aria-label' );
    // Held until the observer first reports it on screen.
    const held = new Set( [ 'offscreen' ] );
    if ( document.hidden ) {
        held.add( 'hidden' );
    }
    // Paused by the visitor (button) or by reduced motion; the button wins
    // once used.
    let paused = motion.matches;
    let chosen = false;

    const label = () => {
        if ( ! button ) {
            return;
        }
        button.hidden = false;
        button.classList.toggle( 'is-paused', paused );
        button.setAttribute(
            'aria-label',
            paused ? button.dataset.labelPlay : pauseLabel
        );
    };

    const update = () => {
        if ( paused || held.size ) {
            video.pause();
        } else {
            video.muted = true;
            video.play()?.catch( () => {
                paused = true;
                label();
            } );
        }
        label();
    };

    const hold = ( reason, on ) => {
        if ( on ) {
            held.add( reason );
        } else {
            held.delete( reason );
        }
        update();
    };

    button?.addEventListener( 'click', () => {
        chosen = true;
        paused = ! paused;
        update();
    } );
    motion.addEventListener( 'change', () => {
        if ( ! chosen ) {
            paused = motion.matches;
            update();
        }
    } );
    document.addEventListener( 'visibilitychange', () =>
        hold( 'hidden', document.hidden )
    );
    new window.IntersectionObserver( ( [ entry ] ) =>
        hold( 'offscreen', ! entry.isIntersecting )
    ).observe( video );
    update();
}

document
    .querySelectorAll( '.wp-block-supe-container-background__video' )
    .forEach( start );
