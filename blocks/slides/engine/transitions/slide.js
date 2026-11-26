/**
 * Slides move along the track, the leaving and arriving ones together.
 * The axis and which side the next slide comes from are the layout's
 * (`is-vertical`, `is-reversed`); this only animates the slots.
 */
export default {
    directions: [ 'left', 'right', 'up', 'down' ],
    supportsDrag: true,
    animate( { slides, after, duration, easing, place } ) {
        slides.forEach( ( slide, index ) => {
            slide.style.transition = `transform ${ duration }ms ${ easing }`;
            place( slide, after[ index ] );
        } );
    },
};
