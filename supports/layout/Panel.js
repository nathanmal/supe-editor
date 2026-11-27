import { __ } from '@wordpress/i18n';
import {
    PanelBody,
    // No stable segmented control in @wordpress/components yet.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControl as ToggleGroupControl,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import {
    arrowDown,
    arrowRight,
    justifyBottom,
    justifyCenter,
    justifyCenterVertical,
    justifyLeft,
    justifyRight,
    justifySpaceBetween,
    justifySpaceBetweenVertical,
    justifyStretch,
    justifyStretchVertical,
    justifyTop,
} from '@wordpress/icons';
import {
    ResponsiveControl,
    SpacingSizeControl,
    ViewportSwitcher,
    VIEWPORTS,
    hasOwnValue,
    inheritedValue,
    useViewport,
} from '@supe-editor/components';
import { editorSettings } from '../_framework/settings';

const DIRECTIONS = [
    {
        value: 'row',
        icon: arrowRight,
        label: __( 'Horizontal', 'supe-editor' ),
    },
    {
        value: 'column',
        icon: arrowDown,
        label: __( 'Vertical', 'supe-editor' ),
    },
];

/*
 * Options in CSS terms (justify-content along the main axis, align-items
 * across it); only their icons and labels follow the direction.
 */
const HORIZONTAL = {
    'flex-start': [ justifyLeft, __( 'Left', 'supe-editor' ) ],
    center: [ justifyCenter, __( 'Center', 'supe-editor' ) ],
    'flex-end': [ justifyRight, __( 'Right', 'supe-editor' ) ],
    'space-between': [
        justifySpaceBetween,
        __( 'Space between', 'supe-editor' ),
    ],
    stretch: [ justifyStretch, __( 'Stretch', 'supe-editor' ) ],
};

const VERTICAL = {
    'flex-start': [ justifyTop, __( 'Top', 'supe-editor' ) ],
    center: [ justifyCenterVertical, __( 'Middle', 'supe-editor' ) ],
    'flex-end': [ justifyBottom, __( 'Bottom', 'supe-editor' ) ],
    'space-between': [
        justifySpaceBetweenVertical,
        __( 'Space between', 'supe-editor' ),
    ],
    stretch: [ justifyStretchVertical, __( 'Stretch', 'supe-editor' ) ],
};

const JUSTIFY = [ 'flex-start', 'center', 'flex-end', 'space-between' ];
const ALIGN = [ 'flex-start', 'center', 'flex-end', 'stretch' ];

/**
 * Responsive gap, and for flex layouts direction, justification and
 * alignment, under one viewport switcher (shared with the device preview).
 *
 * The desktop direction is core's `layout.orientation`, so the Row / Stack
 * variations, block movers and drop indicators keep working; tablet and
 * mobile overrides are stored in the support. Core's own justification and
 * alignment controls are turned off on blocks using this panel, because
 * core swaps their CSS meaning with the orientation — this panel stores CSS
 * values, which mean the same at every viewport.
 *
 * @param {Object}   props
 * @param {Object}   props.value         `{ gap, direction, justify, align }`, each keyed by viewport.
 * @param {Function} props.onChange      Called with the updated value.
 * @param {Object}   props.attributes    Block attributes (core `layout`).
 * @param {Function} props.setAttributes
 */
export default function LayoutPanel( {
    value,
    onChange,
    attributes,
    setAttributes,
} ) {
    const [ viewport, setViewport ] = useViewport();
    const { breakpoints } = editorSettings();
    const layout = attributes.layout ?? {};
    const isFlex = layout.type === 'flex';

    const direction = {
        ...value.direction,
        desktop: layout.orientation === 'vertical' ? 'column' : 'row',
    };
    const currentDirection =
        direction[ viewport ] ?? inheritedValue( direction, viewport );
    const mainAxis = currentDirection === 'column' ? VERTICAL : HORIZONTAL;
    const crossAxis = currentDirection === 'column' ? HORIZONTAL : VERTICAL;

    const setDirection = ( next ) => {
        const { desktop, ...overrides } = next ?? {};

        if ( desktop && desktop !== direction.desktop ) {
            setAttributes( {
                layout: {
                    ...layout,
                    orientation: desktop === 'column' ? 'vertical' : undefined,
                },
            } );
        }

        onChange( {
            ...value,
            direction: Object.keys( overrides ).length ? overrides : undefined,
        } );
    };

    const keys = isFlex
        ? [ 'gap', 'direction', 'justify', 'align' ]
        : [ 'gap' ];
    const overridden = VIEWPORTS.slice( 1 ).filter( ( name ) =>
        keys.some( ( key ) => hasOwnValue( value[ key ], name ) )
    );

    return (
        <PanelBody
            title={ __( 'Responsive layout', 'supe-editor' ) }
            className="supe-layout-panel"
        >
            <ViewportSwitcher
                viewport={ viewport }
                onChange={ setViewport }
                overridden={ overridden }
                breakpoints={ breakpoints }
            />
            { isFlex && (
                <>
                    <ResponsiveControl
                        label={ __( 'Direction', 'supe-editor' ) }
                        value={ direction }
                        onChange={ setDirection }
                        showSwitcher={ false }
                        hideLabelFromVision
                    >
                        { ( {
                            value: current,
                            inherited,
                            onChange: setCurrent,
                        } ) => (
                            <ToggleGroupControl
                                __next40pxDefaultSize
                                __nextHasNoMarginBottom
                                label={ __( 'Direction', 'supe-editor' ) }
                                value={ current ?? inherited }
                                onChange={ setCurrent }
                            >
                                { DIRECTIONS.map( ( option ) => (
                                    <ToggleGroupControlOptionIcon
                                        key={ option.value }
                                        { ...option }
                                    />
                                ) ) }
                            </ToggleGroupControl>
                        ) }
                    </ResponsiveControl>
                    <KeywordControl
                        label={ __( 'Justify', 'supe-editor' ) }
                        options={ JUSTIFY }
                        icons={ mainAxis }
                        value={ value.justify }
                        onChange={ ( justify ) =>
                            onChange( { ...value, justify } )
                        }
                    />
                    <KeywordControl
                        label={ __( 'Align', 'supe-editor' ) }
                        options={ ALIGN }
                        icons={ crossAxis }
                        value={ value.align }
                        onChange={ ( align ) =>
                            onChange( { ...value, align } )
                        }
                    />
                </>
            ) }
            <ResponsiveControl
                label={ __( 'Gap', 'supe-editor' ) }
                value={ value.gap }
                onChange={ ( gap ) => onChange( { ...value, gap } ) }
                showSwitcher={ false }
                hideLabelFromVision
            >
                { ( { viewport: current, value: gap, onChange: setGap } ) => (
                    <SpacingSizeControl
                        // Core's control picks its layout from the values it
                        // mounts with.
                        key={ current }
                        label={ __( 'Gap', 'supe-editor' ) }
                        sides={ [ 'top' ] }
                        showSideInLabel={ false }
                        values={ gap ? { top: gap } : {} }
                        onChange={ ( next ) => setGap( next?.top ) }
                    />
                ) }
            </ResponsiveControl>
        </PanelBody>
    );
}

/**
 * One responsive keyword as icon buttons. Clicking the selected option
 * clears it (back to inherited, or core's default on desktop).
 *
 * @param {Object}   props
 * @param {string}   props.label
 * @param {string[]} props.options  Keywords, in display order.
 * @param {Object}   props.icons    Keyword → [ icon, label ] for the current axis.
 * @param {Object}   props.value    Keyed by viewport.
 * @param {Function} props.onChange Called with the whole responsive value.
 */
function KeywordControl( { label, options, icons, value, onChange } ) {
    return (
        <ResponsiveControl
            label={ label }
            value={ value }
            onChange={ onChange }
            showSwitcher={ false }
            hideLabelFromVision
        >
            { ( { value: current, inherited, onChange: setCurrent } ) => (
                <ToggleGroupControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    isDeselectable
                    label={ label }
                    value={ current ?? inherited }
                    onChange={ setCurrent }
                >
                    { options.map( ( option ) => (
                        <ToggleGroupControlOptionIcon
                            key={ option }
                            value={ option }
                            icon={ icons[ option ][ 0 ] }
                            label={ icons[ option ][ 1 ] }
                        />
                    ) ) }
                </ToggleGroupControl>
            ) }
        </ResponsiveControl>
    );
}
