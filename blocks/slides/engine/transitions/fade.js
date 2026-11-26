/**
 * The arriving slides fade in over the leaving ones, in place. With more
 * than one slide in view it fades whole pages (pageOnly).
 */
export default {
    pageOnly: true,
    animate( {
        slides,
        after,
        shownBefore,
        shownAfter,
        duration,
        easing,
        place,
        reflow,
    } ) {
        const arriving = shownAfter.filter(
            ( index ) => ! shownBefore.includes( index )
        );

        // Arriving slides take their place unseen, above the leaving ones;
        // a slide in both views just moves.
        shownAfter.forEach( ( index ) => {
            if ( arriving.includes( index ) ) {
                slides[ index ].style.opacity = '0';
                slides[ index ].style.zIndex = '1';
            }
            place( slides[ index ], after[ index ] );
        } );
        reflow();

        const fadeTo = ( index, opacity ) => {
            slides[
                index
            ].style.transition = `opacity ${ duration }ms ${ easing }`;
            slides[ index ].style.opacity = opacity;
        };
        arriving.forEach( ( index ) => fadeTo( index, '1' ) );
        shownBefore
            .filter( ( index ) => ! shownAfter.includes( index ) )
            .forEach( ( index ) => fadeTo( index, '0' ) );
    },
};
