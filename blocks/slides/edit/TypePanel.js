import { store as blockEditorStore } from '@wordpress/block-editor';
import {
    createBlocksFromInnerBlocksTemplate,
    store as blocksStore,
} from '@wordpress/blocks';
import {
    // No stable confirm dialog or segmented control in @wordpress/components
    // yet; core's own sidebars use these.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalConfirmDialog as ConfirmDialog,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControl as ToggleGroupControl,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControlOption as ToggleGroupControlOption,
    PanelBody,
} from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { starterSlides } from '../variations';

/** Short labels for the type buttons (variation titles are longer). */
const TYPE_LABELS = {
    images: __( 'Images', 'supe-editor' ),
    content: __( 'Content', 'supe-editor' ),
};

/**
 * Changes the slide type. Slides of one type can't live in another type's
 * track, so the track's contents are replaced with the new type's starter
 * slides — after a confirmation when there are slides to lose.
 *
 * @param {Object}   props
 * @param {string}   props.clientId
 * @param {string}   props.type
 * @param {Function} props.setAttributes
 */
export default function TypePanel( { clientId, type, setAttributes } ) {
    const [ pendingType, setPendingType ] = useState( null );
    const registry = useRegistry();
    const { replaceInnerBlocks } = useDispatch( blockEditorStore );
    const { variations, track } = useSelect(
        ( select ) => ( {
            variations: select( blocksStore ).getBlockVariations(
                'supe/slides',
                'block'
            ),
            track: select( blockEditorStore )
                .getBlocks( clientId )
                .find( ( block ) => block.name === 'supe/slides-track' ),
        } ),
        [ clientId ]
    );

    const changeType = ( nextType ) => {
        registry.batch( () => {
            setAttributes( { type: nextType } );
            if ( track ) {
                replaceInnerBlocks(
                    track.clientId,
                    createBlocksFromInnerBlocksTemplate(
                        starterSlides( nextType )
                    ),
                    false
                );
            }
        } );
    };

    const onChange = ( nextType ) => {
        if ( ! nextType || nextType === type ) {
            return;
        }
        if ( track?.innerBlocks.length ) {
            setPendingType( nextType );
        } else {
            changeType( nextType );
        }
    };

    return (
        <PanelBody title={ __( 'Slides', 'supe-editor' ) }>
            <ToggleGroupControl
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                isBlock
                label={ __( 'Type', 'supe-editor' ) }
                value={ type }
                onChange={ onChange }
            >
                { variations.map( ( variation ) => (
                    <ToggleGroupControlOption
                        key={ variation.name }
                        value={ variation.attributes.type }
                        label={ TYPE_LABELS[ variation.attributes.type ] }
                    />
                ) ) }
            </ToggleGroupControl>
            <ConfirmDialog
                isOpen={ null !== pendingType }
                confirmButtonText={ __( 'Change type', 'supe-editor' ) }
                onConfirm={ () => {
                    changeType( pendingType );
                    setPendingType( null );
                } }
                onCancel={ () => setPendingType( null ) }
            >
                { __(
                    'Changing the type replaces the current slides. Continue?',
                    'supe-editor'
                ) }
            </ConfirmDialog>
        </PanelBody>
    );
}
