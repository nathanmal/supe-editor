import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * A child block's way back to its parent (a slide to its slider, an image
 * to its fader): clicking the parent in the canvas selects the child under
 * the pointer, and the child list lives on the parent's sidebar. An icon
 * button with a tooltip; blocks/shared/sidebar.scss lifts it beside the
 * block card's title (BlockCard's own `controls` slot isn't open to blocks).
 *
 * @param {Object} props
 * @param {string} props.clientId   The child.
 * @param {string} props.parentName The parent's block name.
 * @param {string} props.label      e.g. "Select slider".
 * @param {Object} props.icon       The parent's icon.
 */
export default function SelectParentButton( {
    clientId,
    parentName,
    label,
    icon,
} ) {
    const parentId = useSelect(
        ( select ) =>
            select( blockEditorStore ).getBlockParentsByBlockName(
                clientId,
                parentName,
                true
            )[ 0 ],
        [ clientId, parentName ]
    );
    const { selectBlock } = useDispatch( blockEditorStore );

    if ( ! parentId ) {
        return null;
    }

    return (
        <div className="supe-select-parent">
            <Button
                size="small"
                icon={ icon }
                label={ label }
                onClick={ () => selectBlock( parentId ) }
            />
        </div>
    );
}
