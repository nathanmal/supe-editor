/**
 * Arrow keys move the slider while focus is in it (not in a nested slider,
 * a field or the lightbox): the arrow pointing to where the next slide comes
 * from goes forward. Home / End jump to the ends when the track itself has focus.
 *
 * @param {import('./Slider').default} slider
 */
export default function keyboard( slider ) {
    if ( ! slider.config.keyboard ) {
        return;
    }

    const { root, track } = slider;

    root.addEventListener( 'keydown', ( event ) => {
        const { target } = event;

        if (
            event.defaultPrevented ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            target.closest( '[data-supe-slides]' ) !== root ||
            // The lightbox has its own arrow keys.
            target.closest( '.supe-slides__lightbox' ) ||
            target.closest( 'input, textarea, select' ) ||
            target.isContentEditable
        ) {
            return;
        }

        const forward = slider.vertical ? 'ArrowDown' : 'ArrowRight';
        const backward = slider.vertical ? 'ArrowUp' : 'ArrowLeft';
        const [ next, prev ] =
            slider.sign > 0 ? [ forward, backward ] : [ backward, forward ];
        const options = { source: 'keyboard' };

        if ( event.key === next ) {
            slider.next( options );
        } else if ( event.key === prev ) {
            slider.prev( options );
        } else if ( event.key === 'Home' && target === track ) {
            slider.goTo( 0, options );
        } else if ( event.key === 'End' && target === track ) {
            slider.goTo( slider.slides.length - 1, options );
        } else {
            return;
        }

        event.preventDefault();
    } );
}
