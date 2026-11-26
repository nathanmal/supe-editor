import { icons } from './controls';

/**
 * A preset icon in the same SVG render.php outputs (Controls::svg()).
 *
 * @param {Object} props
 * @param {string} props.paths       The SVG's inside, from icons.json.
 * @param {string} [props.className] Classes for the SVG.
 */
export default function ControlIcon( {
    paths,
    className = 'supe-slides__icon',
} ) {
    return (
        <svg
            className={ className }
            viewBox="0 0 24 24"
            width="24"
            height="24"
            aria-hidden="true"
            focusable="false"
            // Trusted: the package's own icons.json.
            dangerouslySetInnerHTML={ { __html: paths } }
        />
    );
}

/**
 * @param {Object} props
 * @param {string} props.set An arrow set.
 */
export const ArrowIcon = ( { set } ) => (
    <ControlIcon paths={ icons.arrows[ set ] ?? icons.arrows.chevron } />
);
