import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button, Icon } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp, close, dragHandle } from '@wordpress/icons';

import { dropIndex } from './drop-index';

/** Drag data type, so the editor's own drop zones ignore row drags. */
const DRAG_TYPE = 'application/x-supe-block-row';

/**
 * A parent block's children as sidebar rows, in order: drag a row (or use
 * its up/down buttons) to reorder, click it to select that block, and
 * optionally remove it. Moves go through moveBlockToPosition(), so undo
 * works. Styles: blocks/shared/sidebar.scss.
 *
 * Rows are `div[role=button]`, not `<button>`s: browsers won't start a drag
 * that begins on a button.
 *
 * @param {Object}   props
 * @param {string}   props.rootClientId    The parent holding `blocks`.
 * @param {Array}    props.blocks          Its child blocks, in order.
 * @param {Function} props.label           ( block, position ) → row label.
 * @param {Function} [props.thumbnail]     ( block ) → image URL, if any.
 * @param {Function} [props.isHighlighted] ( block ) → whether to mark it.
 * @param {Function} [props.onMove]        ( block ) → after moving it.
 * @param {boolean}  [props.removable]     Show a remove button per row.
 */
export default function SortableBlockList( {
    rootClientId,
    blocks,
    label,
    thumbnail = () => null,
    isHighlighted = () => false,
    onMove = () => {},
    removable = false,
} ) {
    const [ drag, setDrag ] = useState( null );
    const { moveBlockToPosition, removeBlock, selectBlock } =
        useDispatch( blockEditorStore );

    const move = ( from, to ) => {
        if ( to < 0 || to >= blocks.length || from === to ) {
            return;
        }
        moveBlockToPosition(
            blocks[ from ].clientId,
            rootClientId,
            rootClientId,
            to
        );
        onMove( blocks[ from ] );
    };

    const rowDragProps = ( index ) => ( {
        draggable: true,
        onDragStart: ( event ) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData( DRAG_TYPE, String( index ) );
            setDrag( { from: index, over: null, before: true } );
        },
        onDragOver: ( event ) => {
            if ( ! drag ) {
                return;
            }
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            const rect = event.currentTarget.getBoundingClientRect();
            const before = event.clientY < rect.top + rect.height / 2;
            if ( drag.over !== index || drag.before !== before ) {
                setDrag( { ...drag, over: index, before } );
            }
        },
        onDrop: ( event ) => {
            if ( ! drag ) {
                return;
            }
            event.preventDefault();
            move( drag.from, dropIndex( drag.from, index, drag.before ) );
            setDrag( null );
        },
        onDragEnd: () => setDrag( null ),
    } );

    // The indicator is hidden where the drop wouldn't move anything.
    const indicatorClass = ( index ) => {
        if (
            ! drag ||
            drag.over !== index ||
            dropIndex( drag.from, index, drag.before ) === drag.from
        ) {
            return null;
        }

        return drag.before ? 'is-drop-before' : 'is-drop-after';
    };

    if ( blocks.length === 0 ) {
        return null;
    }

    return (
        <ol className="supe-block-list">
            { blocks.map( ( block, index ) => {
                const text = label( block, index + 1 );
                const image = thumbnail( block );
                const highlighted = isHighlighted( block );

                return (
                    <li
                        key={ block.clientId }
                        className={ [
                            'supe-block-list__row',
                            highlighted && 'is-highlighted',
                            drag?.from === index && 'is-dragging',
                            indicatorClass( index ),
                        ]
                            .filter( Boolean )
                            .join( ' ' ) }
                        { ...rowDragProps( index ) }
                    >
                        <Icon
                            className="supe-block-list__handle"
                            icon={ dragHandle }
                        />
                        <div
                            role="button"
                            tabIndex={ 0 }
                            className="supe-block-list__select"
                            aria-current={ highlighted || undefined }
                            title={ text }
                            onClick={ () => selectBlock( block.clientId ) }
                            onKeyDown={ ( event ) => {
                                if (
                                    event.key === 'Enter' ||
                                    event.key === ' '
                                ) {
                                    event.preventDefault();
                                    selectBlock( block.clientId );
                                }
                            } }
                        >
                            <span className="supe-block-list__number">
                                { index + 1 }
                            </span>
                            { image && <img src={ image } alt="" /> }
                            <span className="supe-block-list__name">
                                { text }
                            </span>
                        </div>
                        <Button
                            size="small"
                            icon={ chevronUp }
                            label={ sprintf(
                                /* translators: %s: row label. */
                                __( 'Move up: %s', 'supe-editor' ),
                                text
                            ) }
                            showTooltip={ false }
                            disabled={ index === 0 }
                            accessibleWhenDisabled
                            onClick={ () => move( index, index - 1 ) }
                        />
                        <Button
                            size="small"
                            icon={ chevronDown }
                            label={ sprintf(
                                /* translators: %s: row label. */
                                __( 'Move down: %s', 'supe-editor' ),
                                text
                            ) }
                            showTooltip={ false }
                            disabled={ index === blocks.length - 1 }
                            accessibleWhenDisabled
                            onClick={ () => move( index, index + 1 ) }
                        />
                        { removable && (
                            <Button
                                size="small"
                                icon={ close }
                                label={ sprintf(
                                    /* translators: %s: row label. */
                                    __( 'Remove: %s', 'supe-editor' ),
                                    text
                                ) }
                                showTooltip={ false }
                                onClick={ () =>
                                    removeBlock( block.clientId, false )
                                }
                            />
                        ) }
                    </li>
                );
            } ) }
        </ol>
    );
}
