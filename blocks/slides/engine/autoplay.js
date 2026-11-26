/**
 * Autoplay: moves to the next slide every `delay` ms (rewinding at the end
 * without loop). It waits while anything pauses it: the pointer over the
 * slider (pauseOnHover), focus inside it, a hidden tab, the slider being
 * off screen, or a `pause()` call (the pause control, phase 5). Off for
 * reduced motion. Any move restarts the wait, so it never cuts one short.
 *
 * @param {import('./Slider').default} slider
 * @return {?{pause: Function, resume: Function, paused: Function}} Controls,
 *         or null when autoplay is off.
 */
export default function autoplay( slider ) {
    const { enabled, delay, pauseOnHover } = slider.config.autoplay;

    if ( ! enabled ) {
        return null;
    }

    const { root } = slider;
    const reasons = new Set();
    let timer = null;

    const schedule = () => {
        window.clearTimeout( timer );
        timer = null;
        if (
            reasons.size === 0 &&
            ! slider.reducedMotion.matches &&
            slider.navigable
        ) {
            timer = window.setTimeout(
                () => slider.next( { source: 'autoplay', rewind: true } ),
                delay + slider.duration
            );
        }
    };
    const pause = ( reason, paused = true ) => {
        if ( paused ) {
            reasons.add( reason );
        } else {
            reasons.delete( reason );
        }
        root.classList.toggle( 'is-paused', reasons.size > 0 );
        schedule();
    };

    if ( pauseOnHover ) {
        // Touch fires pointerenter without a matching leave.
        root.addEventListener( 'pointerenter', ( event ) => {
            if ( event.pointerType === 'mouse' ) {
                pause( 'hover' );
            }
        } );
        root.addEventListener( 'pointerleave', () => pause( 'hover', false ) );
    }
    root.addEventListener( 'focusin', () => pause( 'focus' ) );
    root.addEventListener( 'focusout', ( event ) => {
        if ( ! root.contains( event.relatedTarget ) ) {
            pause( 'focus', false );
        }
    } );
    document.addEventListener( 'visibilitychange', () =>
        pause( 'hidden', document.hidden )
    );
    new window.IntersectionObserver( ( [ entry ] ) =>
        pause( 'offscreen', ! entry.isIntersecting )
    ).observe( root );
    slider.reducedMotion.addEventListener( 'change', schedule );
    root.addEventListener( 'supe-slides:change', schedule );
    root.addEventListener( 'supe-slides:layout', schedule );

    root.classList.add( 'is-autoplay' );
    schedule();

    return {
        pause: () => pause( 'user' ),
        resume: () => pause( 'user', false ),
        paused: () => reasons.has( 'user' ),
    };
}
