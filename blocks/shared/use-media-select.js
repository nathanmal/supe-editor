import { useRef } from '@wordpress/element';

/**
 * Wraps a media modal `onSelect` so it runs once per selection.
 *
 * Core's gallery flow registers the modal's listeners twice
 * (`MediaUpload.openModal()` calls `initializeListeners()` after
 * `buildAndSetGalleryFrame()` already has, WordPress 7.1), so `onSelect`
 * fires twice in a row for one insert. Core's Gallery block doesn't notice —
 * it overwrites its image list — but inserting slides would duplicate them.
 * Both calls happen in the same tick, so a repeat of the same selection
 * before the next tick is dropped; choosing the same images again later
 * still works.
 *
 * @param {Function} onSelect Receives one media object or an array.
 * @return {Function} The wrapped handler.
 */
export function oncePerSelection( onSelect ) {
    let last = null;

    return ( media ) => {
        const key = [ media ]
            .flat()
            .map( ( item ) => item.id )
            .join( ',' );
        if ( last === key ) {
            return;
        }
        last = key;
        setTimeout( () => ( last = null ) );
        onSelect( media );
    };
}

/**
 * oncePerSelection() as a stable handler that always calls the latest
 * `onSelect`.
 *
 * @param {Function} onSelect
 * @return {Function} The wrapped handler.
 */
export default function useMediaSelect( onSelect ) {
    const latest = useRef( onSelect );
    latest.current = onSelect;
    const handler = useRef( null );
    handler.current ??= oncePerSelection( ( media ) =>
        latest.current( media )
    );

    return handler.current;
}
