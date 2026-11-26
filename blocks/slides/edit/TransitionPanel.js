import {
    PanelBody,
    RangeControl,
    SelectControl,
    // No stable segmented control in @wordpress/components yet.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControl as ToggleGroupControl,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControlOption as ToggleGroupControlOption,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { arrowDown, arrowLeft, arrowRight, arrowUp } from '@wordpress/icons';

import { getTransitions } from '../engine/transitions';
import { DURATION } from '../shared/config';

const LABELS = {
    slide: __( 'Slide', 'supe-editor' ),
    fade: __( 'Fade', 'supe-editor' ),
};

const DIRECTIONS = {
    left: { icon: arrowLeft, label: __( 'Left', 'supe-editor' ) },
    right: { icon: arrowRight, label: __( 'Right', 'supe-editor' ) },
    up: { icon: arrowUp, label: __( 'Up', 'supe-editor' ) },
    down: { icon: arrowDown, label: __( 'Down', 'supe-editor' ) },
};

const EASINGS = [
    { value: 'ease', label: __( 'Ease', 'supe-editor' ) },
    { value: 'ease-in-out', label: __( 'Ease in and out', 'supe-editor' ) },
    { value: 'ease-in', label: __( 'Ease in', 'supe-editor' ) },
    { value: 'ease-out', label: __( 'Ease out', 'supe-editor' ) },
    { value: 'linear', label: __( 'Linear', 'supe-editor' ) },
];

/**
 * The transition's effect, direction, duration and easing. Effects and the
 * directions each one offers come from the engine's registry, so a new
 * transition shows up here once it's registered.
 *
 * @param {Object}   props
 * @param {Object}   props.config        From configFrom().
 * @param {Object}   props.transition    The stored attribute.
 * @param {Function} props.setAttributes
 */
export default function TransitionPanel( {
    config,
    transition = {},
    setAttributes,
} ) {
    const transitions = getTransitions();
    const current =
        transitions.find( ( { name } ) => name === config.transition.name ) ??
        transitions[ 0 ];
    const update = ( changes ) =>
        setAttributes( { transition: { ...transition, ...changes } } );

    return (
        <PanelBody title={ __( 'Transition', 'supe-editor' ) }>
            <div className="supe-slides-panel">
                <ToggleGroupControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    isBlock
                    label={ __( 'Effect', 'supe-editor' ) }
                    value={ current.name }
                    onChange={ ( name ) => {
                        const next = transitions.find(
                            ( item ) => item.name === name
                        );
                        // Keep a direction only where the effect has one,
                        // so the layout doesn't stay vertical for a fade.
                        const { direction, ...rest } = transition;

                        setAttributes( {
                            transition: {
                                ...rest,
                                name,
                                ...( next?.directions.includes( direction ) && {
                                    direction,
                                } ),
                            },
                        } );
                    } }
                >
                    { transitions.map( ( { name } ) => (
                        <ToggleGroupControlOption
                            key={ name }
                            value={ name }
                            label={ LABELS[ name ] ?? name }
                        />
                    ) ) }
                </ToggleGroupControl>
                { current.directions.length > 0 && (
                    <ToggleGroupControl
                        __next40pxDefaultSize
                        __nextHasNoMarginBottom
                        isBlock
                        label={ __( 'Direction', 'supe-editor' ) }
                        help={ __(
                            'The way slides move to show the next one.',
                            'supe-editor'
                        ) }
                        value={ config.transition.direction }
                        onChange={ ( direction ) => update( { direction } ) }
                    >
                        { current.directions.map( ( direction ) => (
                            <ToggleGroupControlOptionIcon
                                key={ direction }
                                value={ direction }
                                icon={ DIRECTIONS[ direction ].icon }
                                label={ DIRECTIONS[ direction ].label }
                            />
                        ) ) }
                    </ToggleGroupControl>
                ) }
                <RangeControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    label={ __( 'Duration (ms)', 'supe-editor' ) }
                    min={ DURATION[ 0 ] }
                    max={ DURATION[ 1 ] }
                    step={ 50 }
                    value={ config.transition.duration }
                    onChange={ ( duration ) => update( { duration } ) }
                />
                <SelectControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    label={ __( 'Easing', 'supe-editor' ) }
                    value={ config.transition.easing }
                    options={ EASINGS }
                    onChange={ ( easing ) => update( { easing } ) }
                />
            </div>
        </PanelBody>
    );
}
