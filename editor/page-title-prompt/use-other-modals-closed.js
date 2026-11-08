import { useEffect, useState } from '@wordpress/element';

// Every `Modal` and `Guide` from @wordpress/components renders this overlay.
const ANY_MODAL = '.components-modal__screen-overlay';

// Dialogs that open on load (welcome guide, "Choose a pattern") need a moment
// to mount before we can see them.
const MOUNT_DELAY = 300;

/**
 * Whether no other dialog is open. Opening a modal on top of another closes
 * the one underneath, so the prompt waits for the welcome guide or the
 * "Choose a pattern" dialog to be dismissed first.
 *
 * @param {boolean} isEnabled Start checking only once this is true.
 * @return {boolean} True once no other dialog is open.
 */
export default function useOtherModalsClosed( isEnabled ) {
    const [ isClosed, setIsClosed ] = useState( false );

    useEffect( () => {
        if ( ! isEnabled ) {
            return;
        }

        let observer;
        const timer = setTimeout( () => {
            const { document } = window;

            if ( ! document.querySelector( ANY_MODAL ) ) {
                setIsClosed( true );
                return;
            }

            observer = new window.MutationObserver( () => {
                if ( ! document.querySelector( ANY_MODAL ) ) {
                    observer.disconnect();
                    setIsClosed( true );
                }
            } );
            observer.observe( document.body, {
                childList: true,
                subtree: true,
            } );
        }, MOUNT_DELAY );

        return () => {
            clearTimeout( timer );
            if ( observer ) {
                observer.disconnect();
            }
        };
    }, [ isEnabled ] );

    return isClosed;
}
