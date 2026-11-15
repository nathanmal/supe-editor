import { __, sprintf } from '@wordpress/i18n';
import { Button, Flex } from '@wordpress/components';

export const VIEWPORT_LABELS = {
    desktop: __( 'Desktop', 'supe-editor' ),
    tablet: __( 'Tablet', 'supe-editor' ),
    mobile: __( 'Mobile', 'supe-editor' ),
};

const ICONS = {
    desktop: 'desktop',
    tablet: 'tablet',
    mobile: 'smartphone',
};

/**
 * Button label for a viewport: its name, its breakpoint when known, and
 * whether it has its own value.
 *
 * @param {string}  viewport
 * @param {Object}  [breakpoints]  `{ tablet, mobile }` max widths in px.
 * @param {boolean} [isOverridden]
 * @return {string} Label.
 */
function buttonLabel( viewport, breakpoints, isOverridden ) {
    const maxWidth = breakpoints?.[ viewport ];
    const name = maxWidth
        ? sprintf(
              /* translators: 1: viewport name, e.g. "Tablet". 2: max width in px. */
              __( '%1$s (≤%2$dpx)', 'supe-editor' ),
              VIEWPORT_LABELS[ viewport ],
              maxWidth
          )
        : VIEWPORT_LABELS[ viewport ];

    return isOverridden
        ? sprintf(
              /* translators: %s: viewport name, e.g. "Tablet (≤1024px)". */
              __( '%s, has its own value', 'supe-editor' ),
              name
          )
        : name;
}

/**
 * Desktop / tablet / mobile buttons. Viewports in `overridden` are marked so
 * it's visible at a glance which ones have their own value.
 *
 * @param {Object}   props
 * @param {string}   props.viewport      Current viewport.
 * @param {Function} props.onChange      Called with the chosen viewport.
 * @param {string[]} [props.overridden]  Viewports with their own value.
 * @param {Object}   [props.breakpoints] `{ tablet, mobile }` max widths, shown in labels.
 */
export default function ViewportSwitcher( {
    viewport,
    onChange,
    overridden = [],
    breakpoints,
} ) {
    return (
        <Flex
            justify="flex-end"
            gap={ 0 }
            expanded={ false }
            className="supe-viewport-switcher"
        >
            { Object.keys( VIEWPORT_LABELS ).map( ( option ) => {
                const isOverridden = overridden.includes( option );

                return (
                    <Button
                        key={ option }
                        size="small"
                        icon={ ICONS[ option ] }
                        isPressed={ viewport === option }
                        onClick={ () => onChange( option ) }
                        label={ buttonLabel(
                            option,
                            breakpoints,
                            isOverridden
                        ) }
                        className={ isOverridden ? 'is-overridden' : undefined }
                    />
                );
            } ) }
        </Flex>
    );
}
