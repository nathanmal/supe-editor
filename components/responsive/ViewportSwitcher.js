import { __, sprintf } from '@wordpress/i18n';
import { Button, Flex } from '@wordpress/components';

const OPTIONS = [
    {
        viewport: 'desktop',
        icon: 'desktop',
        label: __( 'Desktop', 'supe-editor' ),
    },
    {
        viewport: 'tablet',
        icon: 'tablet',
        label: __( 'Tablet', 'supe-editor' ),
    },
    {
        viewport: 'mobile',
        icon: 'smartphone',
        label: __( 'Mobile', 'supe-editor' ),
    },
];

/**
 * Desktop / tablet / mobile buttons. Viewports in `overridden` are marked so
 * it's visible at a glance which ones have their own value.
 *
 * @param {Object}   props
 * @param {string}   props.viewport   Current viewport.
 * @param {Function} props.onChange   Called with the chosen viewport.
 * @param {string[]} props.overridden Viewports with their own value.
 */
export default function ViewportSwitcher( {
    viewport,
    onChange,
    overridden = [],
} ) {
    return (
        <Flex
            justify="flex-end"
            gap={ 0 }
            expanded={ false }
            className="supe-viewport-switcher"
        >
            { OPTIONS.map( ( option ) => {
                const isOverridden = overridden.includes( option.viewport );
                const label = isOverridden
                    ? sprintf(
                          /* translators: %s: viewport name, e.g. "Tablet". */
                          __( '%s (has its own value)', 'supe-editor' ),
                          option.label
                      )
                    : option.label;

                return (
                    <Button
                        key={ option.viewport }
                        size="small"
                        icon={ option.icon }
                        isPressed={ viewport === option.viewport }
                        onClick={ () => onChange( option.viewport ) }
                        label={ label }
                        className={ isOverridden ? 'is-overridden' : undefined }
                    />
                );
            } ) }
        </Flex>
    );
}
