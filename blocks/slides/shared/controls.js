/**
 * JS port of Supe\Editor\Blocks\Slides\Controls: overlay cells, arrow sets
 * and the preset icons, so the editor draws controls like render.php does.
 *
 * Portable: no WordPress imports.
 */
import icons from './icons.json';

export { icons };

/** Overlay grid cells, row then column. */
export const POSITIONS = [
    'top-left',
    'top-center',
    'top-right',
    'center-left',
    'center-center',
    'center-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
];

export const ARROW_SETS = [ 'chevron', 'arrow', 'caret', 'line' ];

/** The control blocks, and the areas that hold them. */
export const CONTROL_BLOCKS = [
    'supe/slides-prev',
    'supe/slides-next',
    'supe/slides-indicators',
    'supe/slides-pause',
];
export const AREAS = {
    overlay: 'supe/slides-overlay',
    bar: 'supe/slides-bar',
};

const oneOf = ( value, allowed, fallback ) =>
    allowed.includes( value ) ? value : fallback;

/**
 * @param {Object} attributes      The control's attributes.
 * @param {string} defaultPosition Its block.json default.
 * @return {string} The overlay cell class.
 */
export const positionClass = ( attributes, defaultPosition ) =>
    `is-position-${ oneOf( attributes.position, POSITIONS, defaultPosition ) }`;

/**
 * @param {*} value
 * @return {string} A known arrow set.
 */
export const arrowSet = ( value ) =>
    oneOf( value, ARROW_SETS, ARROW_SETS[ 0 ] );
