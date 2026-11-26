import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { getTransition } from '../engine/transitions';

/**
 * How visitors move the slider themselves: arrow keys, swiping on touch
 * screens, dragging with a mouse. Dragging needs a transition that supports
 * it (slide, not fade).
 *
 * @param {Object}   props
 * @param {Object}   props.config        From configFrom().
 * @param {Object}   props.drag          The stored attribute.
 * @param {Function} props.setAttributes
 */
export default function InteractionPanel( {
    config,
    drag = {},
    setAttributes,
} ) {
    const { supportsDrag } = getTransition( config.transition.name );
    const updateDrag = ( changes ) =>
        setAttributes( { drag: { ...drag, ...changes } } );
    const noDrag = supportsDrag
        ? undefined
        : __( "This transition can't be dragged.", 'supe-editor' );

    return (
        <PanelBody title={ __( 'Interaction', 'supe-editor' ) }>
            <div className="supe-slides-panel">
                <ToggleControl
                    __nextHasNoMarginBottom
                    label={ __( 'Arrow keys', 'supe-editor' ) }
                    help={ __(
                        'Arrow keys move the slider while it has focus.',
                        'supe-editor'
                    ) }
                    checked={ config.keyboard }
                    onChange={ ( keyboard ) => setAttributes( { keyboard } ) }
                />
                <ToggleControl
                    __nextHasNoMarginBottom
                    label={ __( 'Swipe on touch screens', 'supe-editor' ) }
                    help={ noDrag }
                    disabled={ ! supportsDrag }
                    checked={ supportsDrag && config.drag.touch }
                    onChange={ ( touch ) => updateDrag( { touch } ) }
                />
                <ToggleControl
                    __nextHasNoMarginBottom
                    label={ __( 'Drag with a mouse', 'supe-editor' ) }
                    help={
                        noDrag ??
                        __(
                            'Clicks still reach links in the slides unless the mouse moved.',
                            'supe-editor'
                        )
                    }
                    disabled={ ! supportsDrag }
                    checked={ supportsDrag && config.drag.mouse }
                    onChange={ ( mouse ) => updateDrag( { mouse } ) }
                />
            </div>
        </PanelBody>
    );
}
