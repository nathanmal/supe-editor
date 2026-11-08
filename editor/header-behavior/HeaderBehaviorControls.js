import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';

import useIsHeaderRoot from './use-is-header-root';

/**
 * "Header behavior" panel on the header's root Group: the default the whole
 * site uses, unless a page overrides it.
 *
 * @param {Object}   props
 * @param {string}   props.clientId      Block client ID.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Block attribute setter.
 */
export default function HeaderBehaviorControls( {
    clientId,
    attributes,
    setAttributes,
} ) {
    const isHeaderRoot = useIsHeaderRoot( clientId );

    if ( ! isHeaderRoot ) {
        return null;
    }

    return (
        <InspectorControls>
            <PanelBody title={ __( 'Header behavior', 'supe-editor' ) }>
                <ToggleControl
                    __nextHasNoMarginBottom
                    label={ __( 'Sticky', 'supe-editor' ) }
                    help={ __(
                        'Keep the header at the top of the screen while scrolling.',
                        'supe-editor'
                    ) }
                    checked={ !! attributes.supeSticky }
                    onChange={ ( value ) =>
                        setAttributes( {
                            supeSticky: value,
                            supeHideOnScroll: value
                                ? attributes.supeHideOnScroll
                                : false,
                        } )
                    }
                />
                { attributes.supeSticky && (
                    <ToggleControl
                        __nextHasNoMarginBottom
                        label={ __( 'Hide on scroll', 'supe-editor' ) }
                        help={ __(
                            'Slide the header away when scrolling down and bring it back when scrolling up.',
                            'supe-editor'
                        ) }
                        checked={ !! attributes.supeHideOnScroll }
                        onChange={ ( value ) =>
                            setAttributes( { supeHideOnScroll: value } )
                        }
                    />
                ) }
            </PanelBody>
        </InspectorControls>
    );
}
