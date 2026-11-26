const THRESHOLD = 6;

/** Velocity is measured over this many ms before release. */
const SAMPLE_MS = 100;

const FIELDS =
    'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

/**
 * Drag and swipe: Pointer Events, along the slider's axis. Touch (and pen)
 * and mouse are separate settings; only transitions that support it can be
 * dragged (`supportsDrag`). A gesture becomes a drag once it has gone
 * THRESHOLD px along the axis — one that goes across first is left to the
 * page (scrolling; `touch-action` in style.scss lets the browser have that
 * axis). A drag suppresses the click that ends it, so links in slides don't
 * fire.
 *
 * @param {import('./Slider').default} slider
 */
export default function drag( slider ) {
    const { touch, mouse } = slider.config.drag;
    const { root, track } = slider;

    if ( ! ( touch || mouse ) || ! slider.transition.supportsDrag ) {
        return;
    }

    root.classList.add( 'is-draggable' );
    root.classList.toggle( 'is-mouse-draggable', mouse );

    let gesture = null;
    let suppressClick = false;

    const along = ( event ) =>
        slider.vertical
            ? [ event.clientY - gesture.y, event.clientX - gesture.x ]
            : [ event.clientX - gesture.x, event.clientY - gesture.y ];

    track.addEventListener( 'pointerdown', ( event ) => {
        if (
            ! event.isPrimary ||
            event.button !== 0 ||
            ! ( event.pointerType === 'mouse' ? mouse : touch ) ||
            ! slider.navigable ||
            // A nested slider drags its own slides.
            event.target.closest( '[data-supe-slides]' ) !== root ||
            event.target.closest( FIELDS )
        ) {
            return;
        }

        gesture = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            dragging: false,
            shift: 0,
            samples: [],
        };
    } );

    track.addEventListener( 'pointermove', ( event ) => {
        if ( ! gesture || event.pointerId !== gesture.id ) {
            return;
        }

        const [ main, cross ] = along( event );

        if ( ! gesture.dragging ) {
            if (
                Math.abs( cross ) > THRESHOLD &&
                Math.abs( cross ) > Math.abs( main )
            ) {
                gesture = null;
                return;
            }
            if ( Math.abs( main ) < THRESHOLD ) {
                return;
            }

            gesture.dragging = true;
            gesture.slot = slider.slotSize() || 1;
            track.setPointerCapture( event.pointerId );
            root.classList.add( 'is-dragging' );
            slider.settle();
            slider.autoplay?.hold( 'drag', true );
        }

        event.preventDefault();
        gesture.shift = slider.drag( ( main * slider.sign ) / gesture.slot );
        gesture.samples = [
            ...gesture.samples.filter(
                ( [ time ] ) => event.timeStamp - time <= SAMPLE_MS
            ),
            [ event.timeStamp, main ],
        ];
    } );

    const end = ( event, cancelled ) => {
        if ( ! gesture || event.pointerId !== gesture.id ) {
            return;
        }

        const { dragging, shift, samples } = gesture;
        gesture = null;

        if ( ! dragging ) {
            return;
        }

        const [ first, last ] = [ samples[ 0 ], samples[ samples.length - 1 ] ];
        const elapsed = last[ 0 ] - first[ 0 ];
        // Towards the next slide: against the direction slides move.
        const velocity =
            cancelled || elapsed <= 0
                ? 0
                : ( -( last[ 1 ] - first[ 1 ] ) * slider.sign ) / elapsed;

        root.classList.remove( 'is-dragging' );
        slider.release( shift, velocity );
        slider.autoplay?.hold( 'drag', false );

        suppressClick = true;
        window.setTimeout( () => {
            suppressClick = false;
        } );
    };

    track.addEventListener( 'pointerup', ( event ) => end( event, false ) );
    track.addEventListener( 'pointercancel', ( event ) => end( event, true ) );
    root.addEventListener(
        'click',
        ( event ) => {
            if ( suppressClick ) {
                suppressClick = false;
                event.preventDefault();
                event.stopPropagation();
            }
        },
        true
    );
    if ( mouse ) {
        // Images and links would start the browser's own drag.
        track.addEventListener( 'dragstart', ( event ) =>
            event.preventDefault()
        );
    }
}
