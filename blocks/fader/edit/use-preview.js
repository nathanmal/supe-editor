import { useEffect, useRef, useState } from '@wordpress/element';

const STILL = { active: null, previous: null };

/**
 * The editor preview: cycles the fader's images in the canvas, as on the
 * front end, while it's playing. Nothing is saved.
 *
 * Each step shows the next image (`active`) fading in over the one before
 * (`previous`); Edit.js turns that into the canvas styles. Stopping cancels
 * the next step, so a fade already running finishes and the canvas stays on
 * its image; playing again waits a full turn before the next step.
 *
 * Adding, removing or reordering images while it plays keeps the image
 * showing and the time to the next step (it moves on to whatever follows
 * that image now); if the showing image is removed, the first shows. While
 * stopped, a change of order goes back to the first, like the canvas
 * without a preview.
 *
 * @param {string[]} ids             The images' client IDs, in order.
 * @param {Object}   timing
 * @param {number}   timing.duration Milliseconds each image shows.
 * @param {number}   timing.fade     Milliseconds a fade takes.
 * @return {Object} { playing, setPlaying, active, previous }; `active` is null
 *                  until the first step, and when it's back to the first.
 */
export default function usePreview( ids, { duration, fade } ) {
    const [ playing, setPlaying ] = useState( false );
    const [ shown, setShown ] = useState( STILL );
    const canPlay = ids.length > 1;
    const order = ids.join();

    // Read by the timer and the order effect without restarting either.
    const latest = useRef( {} );
    latest.current = { ids, playing };

    useEffect( () => {
        if ( ! latest.current.playing ) {
            setShown( STILL );
        }
    }, [ order ] );

    useEffect( () => {
        if ( ! playing || ! canPlay ) {
            return;
        }

        const timer = window.setTimeout(
            () => {
                const list = latest.current.ids;
                const current = Math.max( 0, list.indexOf( shown.active ) );

                setShown( {
                    previous: list[ current ],
                    active: list[ ( current + 1 ) % list.length ],
                } );
            },
            Math.max( duration, fade )
        );

        return () => window.clearTimeout( timer );
    }, [ playing, canPlay, shown, duration, fade ] );

    return {
        playing: playing && canPlay,
        setPlaying,
        active: ids.includes( shown.active ) ? shown.active : null,
        previous: ids.includes( shown.previous ) ? shown.previous : null,
    };
}
