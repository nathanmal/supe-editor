import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { SelectControl } from '@wordpress/components';
import {
    PluginDocumentSettingPanel,
    store as editorStore,
} from '@wordpress/editor';

import { META_KEY } from './constants';

/**
 * "Header" panel in the document sidebar: per-page override of the header's
 * behavior. Shows wherever PHP registered the meta
 * (HeaderBehavior::postTypes(), filterable).
 */
export default function HeaderDocumentPanel() {
    const { isSupported, value } = useSelect( ( select ) => {
        const meta =
            select( editorStore ).getEditedPostAttribute( 'meta' ) || {};

        return {
            isSupported: META_KEY in meta,
            value: meta[ META_KEY ] ?? '',
        };
    }, [] );
    const { editPost } = useDispatch( editorStore );

    if ( ! isSupported ) {
        return null;
    }

    return (
        <PluginDocumentSettingPanel
            name="supe-header-behavior"
            title={ __( 'Header', 'supe-editor' ) }
        >
            <SelectControl
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                label={ __( 'Header behavior', 'supe-editor' ) }
                help={ __(
                    'Override the header’s own setting on this page.',
                    'supe-editor'
                ) }
                value={ value }
                options={ [
                    {
                        value: '',
                        label: __( 'Default (from the header)', 'supe-editor' ),
                    },
                    { value: 'static', label: __( 'Static', 'supe-editor' ) },
                    { value: 'sticky', label: __( 'Sticky', 'supe-editor' ) },
                    {
                        value: 'hide-on-scroll',
                        label: __( 'Sticky, hide on scroll', 'supe-editor' ),
                    },
                ] }
                onChange={ ( newValue ) =>
                    editPost( { meta: { [ META_KEY ]: newValue } } )
                }
            />
        </PluginDocumentSettingPanel>
    );
}
