import { useCallback, useState } from '@wordpress/element';
import { useRegistry, useSelect } from '@wordpress/data';
import { VIEWPORTS } from './utils';

const toDeviceType = ( viewport ) =>
    viewport.charAt( 0 ).toUpperCase() + viewport.slice( 1 );

/**
 * The viewport being edited, kept in sync with the editor's device preview
 * (Desktop / Tablet / Mobile) in both directions, so switching viewports in a
 * control also resizes the canvas.
 *
 * Uses the `core/editor` store by name rather than importing @wordpress/editor:
 * that package must not load in the widgets editor, which has no device
 * preview. There, the viewport is local state instead.
 *
 * @return {[string, Function]} Current viewport and its setter.
 */
export default function useViewport() {
    const registry = useRegistry();
    const deviceType = useSelect(
        ( select ) => select( 'core/editor' )?.getDeviceType?.(),
        []
    );
    const [ localViewport, setLocalViewport ] = useState( VIEWPORTS[ 0 ] );

    const isSynced = typeof deviceType === 'string';
    const viewport = isSynced ? deviceType.toLowerCase() : localViewport;

    const setViewport = useCallback(
        ( next ) => {
            if ( isSynced ) {
                registry
                    .dispatch( 'core/editor' )
                    .setDeviceType( toDeviceType( next ) );
            } else {
                setLocalViewport( next );
            }
        },
        [ isSynced, registry ]
    );

    return [
        VIEWPORTS.includes( viewport ) ? viewport : VIEWPORTS[ 0 ],
        setViewport,
    ];
}
