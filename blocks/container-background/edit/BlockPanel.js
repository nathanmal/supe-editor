import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button, PanelBody } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * A block background's panel: what's in it and a way to its settings (the
 * Fader's images and timing are on the Fader).
 *
 * @param {Object}  props
 * @param {?Object} props.inner The background's block (a Fader).
 */
export default function BlockPanel( { inner } ) {
    const { selectBlock } = useDispatch( blockEditorStore );
    const count = inner?.innerBlocks.length ?? 0;

    return (
        <PanelBody title={ __( 'Fader', 'supe-editor' ) }>
            <p>
                { count
                    ? sprintf(
                          /* translators: %d: number of images. */
                          _n(
                              '%d image, fading from one to the next.',
                              '%d images, fading from one to the next.',
                              count,
                              'supe-editor'
                          ),
                          count
                      )
                    : __( 'No images yet.', 'supe-editor' ) }
            </p>
            { inner && (
                <Button
                    variant="secondary"
                    size="compact"
                    onClick={ () => selectBlock( inner.clientId ) }
                >
                    { __( 'Edit images and timing', 'supe-editor' ) }
                </Button>
            ) }
        </PanelBody>
    );
}
