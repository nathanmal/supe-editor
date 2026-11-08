import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Button, Flex, Modal, TextControl } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';

import useOtherModalsClosed from './use-other-modals-closed';

/**
 * "Name this page" dialog. Shows once per editor load, for an untitled page
 * in template-locked mode ("Show template" on). Sets the title with
 * editPost(), so it's saved with the page as usual.
 */
export default function PageTitlePrompt() {
    const { isReady, needsTitle } = useSelect( ( select ) => {
        const editor = select( editorStore );

        return {
            isReady: editor.__unstableIsEditorReady(),
            needsTitle:
                'page' === editor.getCurrentPostType() &&
                'template-locked' === editor.getRenderingMode() &&
                ! editor.getEditedPostAttribute( 'title' ),
        };
    }, [] );
    const { editPost } = useDispatch( editorStore );
    const [ isDismissed, setIsDismissed ] = useState( false );
    const [ title, setTitle ] = useState( '' );
    const otherModalsClosed = useOtherModalsClosed( isReady && needsTitle );

    if ( isDismissed || ! needsTitle || ! otherModalsClosed ) {
        return null;
    }

    const onSubmit = ( event ) => {
        event.preventDefault();
        if ( title.trim() ) {
            editPost( { title: title.trim() } );
        }
        setIsDismissed( true );
    };

    return (
        <Modal
            title={ __( 'Name this page', 'supe-editor' ) }
            onRequestClose={ () => setIsDismissed( true ) }
            size="small"
        >
            <form onSubmit={ onSubmit }>
                <TextControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    label={ __( 'Title', 'supe-editor' ) }
                    value={ title }
                    onChange={ setTitle }
                    // The dialog exists to collect the title, so focus it.
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                />
                <Flex justify="flex-end" style={ { marginTop: '24px' } }>
                    <Button
                        __next40pxDefaultSize
                        variant="tertiary"
                        onClick={ () => setIsDismissed( true ) }
                    >
                        { __( 'Skip', 'supe-editor' ) }
                    </Button>
                    <Button
                        __next40pxDefaultSize
                        variant="primary"
                        type="submit"
                        disabled={ ! title.trim() }
                    >
                        { __( 'Set title', 'supe-editor' ) }
                    </Button>
                </Flex>
            </form>
        </Modal>
    );
}
