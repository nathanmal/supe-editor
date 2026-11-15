import { __, sprintf } from '@wordpress/i18n';
import { Button, Flex, FlexItem, VisuallyHidden } from '@wordpress/components';
import ViewportSwitcher, { VIEWPORT_LABELS } from './ViewportSwitcher';
import useViewport from './use-viewport';
import {
    VIEWPORTS,
    hasOwnValue,
    inheritedFrom,
    inheritedValue,
    setViewportValue,
} from './utils';

/**
 * Wraps any control with viewport switching. The wrapped control is rendered
 * through `children`, a function receiving the current viewport's state:
 *
 *   <ResponsiveControl label="Columns" value={ perView } onChange={ setPerView }>
 *       { ( { value, inherited, onChange } ) => (
 *           <NumberControl value={ value ?? '' } placeholder={ inherited } onChange={ onChange } />
 *       ) }
 *   </ResponsiveControl>
 *
 * Usable for block supports and for a block's own responsive settings alike.
 * Several controls can share one switcher (the viewport is shared editor
 * state): render a ViewportSwitcher once and pass `showSwitcher={ false }`.
 *
 * @param {Object}           props
 * @param {string}           props.label
 * @param {Object|undefined} props.value                 Responsive value, keyed by viewport.
 * @param {Function}         props.onChange              Called with the whole updated responsive value.
 * @param {boolean}          [props.inheritPerKey]       Cascade object values key by key (e.g. per side).
 * @param {boolean}          [props.showSwitcher=true]   Show this control's own viewport switcher.
 * @param {boolean}          [props.hideLabelFromVision] Keep the label for screen readers only, e.g.
 *                                                       when the wrapped control shows its own.
 * @param {Object}           [props.breakpoints]         `{ tablet, mobile }` max widths, shown in labels.
 * @param {Function}         props.children              Renders the control for the current viewport.
 */
export default function ResponsiveControl( {
    label,
    value,
    onChange,
    inheritPerKey = false,
    showSwitcher = true,
    hideLabelFromVision = false,
    breakpoints,
    children,
} ) {
    const [ viewport, setViewport ] = useViewport();
    const isBase = viewport === VIEWPORTS[ 0 ];
    const hasOwn = hasOwnValue( value, viewport );
    const source =
        isBase || hasOwn ? undefined : inheritedFrom( value, viewport );
    const overridden = VIEWPORTS.slice( 1 ).filter( ( name ) =>
        hasOwnValue( value, name )
    );
    const legend = hideLabelFromVision ? (
        <VisuallyHidden as="legend">{ label }</VisuallyHidden>
    ) : (
        <legend>{ label }</legend>
    );

    return (
        <fieldset className="supe-responsive-control">
            { showSwitcher ? (
                <Flex align="center">
                    <FlexItem>{ legend }</FlexItem>
                    <ViewportSwitcher
                        viewport={ viewport }
                        onChange={ setViewport }
                        overridden={ overridden }
                        breakpoints={ breakpoints }
                    />
                </Flex>
            ) : (
                legend
            ) }

            { children( {
                viewport,
                value: value?.[ viewport ],
                inherited: inheritedValue( value, viewport, {
                    perKey: inheritPerKey,
                } ),
                onChange: ( next ) =>
                    onChange( setViewportValue( value, viewport, next ) ),
            } ) }

            { source && (
                <p className="components-base-control__help supe-responsive-control__inherited">
                    { sprintf(
                        /* translators: %s: viewport name, e.g. "Desktop". */
                        __( 'Using the %s value.', 'supe-editor' ),
                        VIEWPORT_LABELS[ source ]
                    ) }
                </p>
            ) }

            { ! isBase && hasOwn && (
                <Button
                    variant="link"
                    size="small"
                    onClick={ () =>
                        onChange(
                            setViewportValue( value, viewport, undefined )
                        )
                    }
                >
                    { sprintf(
                        /* translators: %s: viewport name, e.g. "Tablet". */
                        __( 'Reset %s to inherited', 'supe-editor' ),
                        VIEWPORT_LABELS[ viewport ]
                    ) }
                </Button>
            ) }
        </fieldset>
    );
}
