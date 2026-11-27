/**
 * The block icon as SVG (dashicons don't load in the canvas iframe, where
 * the placeholder shows it): two images, one fading over the other.
 */
export default (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6H15a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 17V7.5Zm1.5 0V17H15V7.5H5.5Zm1 8 2.5-3.5 2 2.5 1.5-2 2 3H6.5Z" />
        <path
            d="M8 4.5A1.5 1.5 0 0 1 9.5 3H19a1.5 1.5 0 0 1 1.5 1.5V14a1.5 1.5 0 0 1-1.5 1.5h-1V14h1V4.5H9.5v.5H8v-.5Z"
            opacity="0.5"
        />
    </svg>
);
