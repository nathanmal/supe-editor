/**
 * Min height given to a Container when a background is added and it has
 * none at any viewport, like core Cover's default, so the background shows.
 */
export const DEFAULT_MIN_HEIGHT = '400px';

/**
 * The Container's `supe` attribute with the default min height, or null when
 * it already has a min height at some viewport.
 *
 * @param {?Object} supe The Container's `supe` attribute.
 * @return {?Object} New `supe` value.
 */
export function withDefaultMinHeight( supe ) {
    const minHeight = supe?.dimensions?.minHeight ?? {};

    if ( Object.values( minHeight ).some( Boolean ) ) {
        return null;
    }

    return {
        ...supe,
        dimensions: {
            v: 1,
            ...supe?.dimensions,
            minHeight: { desktop: DEFAULT_MIN_HEIGHT },
        },
    };
}
