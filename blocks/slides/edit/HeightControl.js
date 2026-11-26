import { SelectControl, TextControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

const MODES = {
    auto: __( 'Auto (fits the tallest slide)', 'supe-editor' ),
    px: __( 'Pixels', 'supe-editor' ),
    vh: __( 'Percent of the screen height', 'supe-editor' ),
    '%': __( 'Percent of the container height', 'supe-editor' ),
    ratio: __( 'Aspect ratio', 'supe-editor' ),
};

/** Modes per height target: a slide can't size to itself or its container. */
const TARGET_MODES = {
    slider: [ 'auto', 'ratio', 'vh', 'px', '%' ],
    slide: [ 'ratio', 'vh', 'px' ],
};

/** A starting value when switching to a mode. */
const DEFAULT_VALUES = { px: 400, vh: 60, '%': 100, ratio: '16/9' };

const RATIOS = [ '16/9', '3/2', '4/3', '1/1', '4/5', '2/3', '9/16', '21/9' ];

const CUSTOM = 'custom';

/**
 * One viewport's height: a mode (auto, px, vh, %, ratio) and its value,
 * stored as `{ mode, value }` (see Blocks\Slides\Layout::heightPair()).
 * Shows the inherited setting when the viewport has none of its own.
 *
 * @param {Object}   props
 * @param {?Object}  props.value     This viewport's `{ mode, value }`.
 * @param {?Object}  props.inherited The setting it inherits.
 * @param {string}   props.target    `slider` or `slide`.
 * @param {Function} props.onChange
 */
export default function HeightControl( {
    value,
    inherited,
    target,
    onChange,
} ) {
    const modes = TARGET_MODES[ target ] ?? TARGET_MODES.slider;
    const shown = value ?? inherited ?? { mode: modes[ 0 ] };
    const mode = modes.includes( shown.mode ) ? shown.mode : modes[ 0 ];
    const current = mode === shown.mode ? shown.value : undefined;
    const isPreset = RATIOS.includes( String( current ?? '' ) );

    const setMode = ( next ) =>
        onChange( { mode: next, value: DEFAULT_VALUES[ next ] } );
    const setValue = ( next ) => onChange( { mode, value: next } );

    return (
        <div className="supe-slides-layout__height">
            <SelectControl
                __next40pxDefaultSize
                __nextHasNoMarginBottom
                label={ __( 'Height', 'supe-editor' ) }
                value={ mode }
                options={ modes.map( ( name ) => ( {
                    value: name,
                    label: MODES[ name ],
                } ) ) }
                onChange={ setMode }
                help={
                    mode === '%'
                        ? __(
                              'Only works when the slider’s container has a set height.',
                              'supe-editor'
                          )
                        : undefined
                }
            />
            { mode === 'ratio' && (
                <SelectControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    label={ __( 'Aspect ratio', 'supe-editor' ) }
                    value={ isPreset ? String( current ) : CUSTOM }
                    options={ [
                        ...RATIOS.map( ( ratio ) => ( {
                            value: ratio,
                            label: ratio.replace( '/', ' : ' ),
                        } ) ),
                        { value: CUSTOM, label: __( 'Custom', 'supe-editor' ) },
                    ] }
                    onChange={ ( next ) =>
                        setValue( next === CUSTOM ? '' : next )
                    }
                />
            ) }
            { mode === 'ratio' && ! isPreset && (
                <TextControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    label={ __( 'Custom ratio', 'supe-editor' ) }
                    placeholder="5/2"
                    help={ __( 'Width / height, e.g. 5/2.', 'supe-editor' ) }
                    value={ current ?? '' }
                    onChange={ setValue }
                />
            ) }
            { mode in DEFAULT_VALUES && mode !== 'ratio' && (
                <TextControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    type="number"
                    min={ 0 }
                    label={ sprintf(
                        /* translators: %s: unit, e.g. "px". */
                        __( 'Height (%s)', 'supe-editor' ),
                        mode
                    ) }
                    value={ current ?? '' }
                    onChange={ ( next ) =>
                        setValue( next === '' ? '' : Number( next ) )
                    }
                />
            ) }
        </div>
    );
}
