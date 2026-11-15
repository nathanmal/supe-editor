import { __ } from '@wordpress/i18n';
import { Button, Flex, FlexItem } from '@wordpress/components';
import ViewportSwitcher from './ViewportSwitcher';
import useViewport from './use-viewport';
import {
    VIEWPORTS,
    hasOwnValue,
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
 *
 * @param {Object}           props
 * @param {string}           props.label
 * @param {Object|undefined} props.value           Responsive value, keyed by viewport.
 * @param {Function}         props.onChange        Called with the whole updated responsive value.
 * @param {boolean}          [props.inheritPerKey] Cascade object values key by key (e.g. per side).
 * @param {Function}         props.children        Renders the control for the current viewport.
 */
export default function ResponsiveControl( {
    label,
    value,
    onChange,
    inheritPerKey = false,
    children,
} ) {
    const [ viewport, setViewport ] = useViewport();
    const isBase = viewport === VIEWPORTS[ 0 ];
    const overridden = VIEWPORTS.slice( 1 ).filter( ( name ) =>
        hasOwnValue( value, name )
    );

    return (
        <fieldset className="supe-responsive-control">
            <Flex align="center">
                <FlexItem>
                    <legend>{ label }</legend>
                </FlexItem>
                <ViewportSwitcher
                    viewport={ viewport }
                    onChange={ setViewport }
                    overridden={ overridden }
                />
            </Flex>

            { children( {
                viewport,
                value: value?.[ viewport ],
                inherited: inheritedValue( value, viewport, {
                    perKey: inheritPerKey,
                } ),
                onChange: ( next ) =>
                    onChange( setViewportValue( value, viewport, next ) ),
            } ) }

            { ! isBase && hasOwnValue( value, viewport ) && (
                <Button
                    variant="link"
                    size="small"
                    onClick={ () =>
                        onChange(
                            setViewportValue( value, viewport, undefined )
                        )
                    }
                >
                    { __( 'Reset to inherited', 'supe-editor' ) }
                </Button>
            ) }
        </fieldset>
    );
}
