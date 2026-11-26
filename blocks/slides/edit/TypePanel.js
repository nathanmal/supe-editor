import { store as blockEditorStore } from '@wordpress/block-editor';
import {
    createBlocksFromInnerBlocksTemplate,
    store as blocksStore,
} from '@wordpress/blocks';
import {
    // No stable confirm dialog in @wordpress/components yet.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalConfirmDialog as ConfirmDialog,
    PanelBody,
    SelectControl,
} from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { starterSlides } from '../variations';

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
        if ( track?.innerBlocks.length ) {
            setPendingType( nextType );
        } else {
            changeType( nextType );
        }
    };

    return (
        <PanelBody title={ __( 'Slides', 'supe-editor' ) }>
            <SelectControl
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                label={ __( 'Type', 'supe-editor' ) }
                value={ type }
                options={ variations.map( ( variation ) => ( {
                    label: variation.title,
                    value: variation.attributes.type,
                } ) ) }
                onChange={ onChange }
            />
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
