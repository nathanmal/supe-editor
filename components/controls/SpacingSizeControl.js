// Core's spacing control is still experimental; keeping every use behind this
// wrapper means an API change only needs fixing here.
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { __experimentalSpacingSizesControl as CoreSpacingSizesControl } from '@wordpress/block-editor';

/**
 * Padding/margin-style control: the theme's spacing presets first, with
 * custom values in the theme's units — the same control core uses for
 * dimensions. Values are per side, presets stored as references
 * (`var:preset|spacing|40`) so a changed theme scale updates every block.
 *
 * @param {Object}   props
 * @param {string}   props.label
 * @param {Object}   [props.values]              `{ top, right, bottom, left }`.
 * @param {Function} props.onChange              Called with the updated sides.
 * @param {string[]} [props.sides]               Sides to offer (default all four).
 * @param {boolean}  [props.allowNegative=false] Allow negative custom values (margin).
 */
export default function SpacingSizeControl( {
    allowNegative = false,
    ...props
} ) {
    return (
        <CoreSpacingSizesControl
            minimumCustomValue={ allowNegative ? -Infinity : 0 }
            allowReset={ false }
            { ...props }
        />
    );
}
