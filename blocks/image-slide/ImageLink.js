import {
    // Core's link picker (search, URL, "open in new tab"); no stable export.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalLinkControl as LinkControl,
} from '@wordpress/block-editor';
import { Popover, ToolbarButton } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { link } from '@wordpress/icons';

const NEW_TAB_SETTING = [
    { id: 'opensInNewTab', title: __( 'Open in new tab', 'supe-editor' ) },
];

/**
 * Toolbar button + popover for the image slide's optional link.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 */
export default function ImageLink( { attributes, setAttributes } ) {
    const { href, linkTarget } = attributes;
    const [ anchor, setAnchor ] = useState( null );
    const [ isOpen, setIsOpen ] = useState( false );

    return (
        <>
            <ToolbarButton
                ref={ setAnchor }
                icon={ link }
                label={ __( 'Link', 'supe-editor' ) }
                isPressed={ !! href }
                onClick={ () => setIsOpen( ( open ) => ! open ) }
            />
            { isOpen && (
                <Popover
                    anchor={ anchor }
                    placement="bottom"
                    onClose={ () => setIsOpen( false ) }
                    focusOnMount="firstElement"
                >
                    <LinkControl
                        value={ {
                            url: href,
                            opensInNewTab: linkTarget === '_blank',
                        } }
                        settings={ NEW_TAB_SETTING }
                        onChange={ ( { url, opensInNewTab } ) =>
                            setAttributes( {
                                href: url || undefined,
                                linkTarget: opensInNewTab
                                    ? '_blank'
                                    : undefined,
                            } )
                        }
                        onRemove={ () => {
                            setAttributes( {
                                href: undefined,
                                linkTarget: undefined,
                            } );
                            setIsOpen( false );
                        } }
                    />
                </Popover>
            ) }
        </>
    );
}
