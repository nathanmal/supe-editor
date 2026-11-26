import { currentIndicator, indicatorStarts, maxStart } from './math';

const AREAS = '.supe-slides__overlay, .supe-slides__bar';

/**
 * Wires up the slider's controls: buttons with `data-supe-slides-action`
 * (`prev`, `next`, `go`, `pause`) inside its own control areas — not a
 * nested slider's. Keeps their state in step with the slider: prev / next
 * disabled at the ends without loop, the current indicator, the pause
 * button's icon and label. Indicators are built from their `<template>`
 * whenever slides per view changes their number.
 *
 * @param {import('./Slider').default} slider
 */
export default function controls( slider ) {
    const { root } = slider;
    const areas = [ ...root.children ].filter( ( child ) =>
        child.matches( AREAS )
    );

    if ( areas.length === 0 ) {
        return;
    }

    const all = ( selector ) =>
        areas.flatMap( ( area ) => [ ...area.querySelectorAll( selector ) ] );
    const action = ( name ) => all( `[data-supe-slides-action="${ name }"]` );
    const lists = all( '.supe-slides__indicators' );
    const pauses = action( 'pause' );
    let starts = [ 0 ];

    const build = () => {
        const { count, perView, loop, size } = slider.state;
        starts = indicatorStarts( count, perView, size, loop );

        lists.forEach( ( list ) => {
            const template = list.querySelector( 'template' );
            const numbers = list.classList.contains( 'is-style-numbers' );

            list.querySelectorAll( '.supe-slides__indicator' ).forEach(
                ( button ) => button.remove()
            );
            starts.forEach( ( start, index ) => {
                const button =
                    template.content.firstElementChild.cloneNode( true );

                button.dataset.start = start;
                button.setAttribute(
                    'aria-label',
                    ( list.dataset.label || '%d' ).replace( '%d', start + 1 )
                );
                if ( numbers ) {
                    button.firstElementChild.textContent = index + 1;
                }
                list.append( button );
            } );
        } );
    };

    const update = () => {
        const { count, perView, loop } = slider.state;
        const current = currentIndicator( starts, slider.start );

        action( 'prev' ).forEach( ( button ) =>
            button.setAttribute(
                'aria-disabled',
                String( ! loop && slider.start <= 0 )
            )
        );
        action( 'next' ).forEach( ( button ) =>
            button.setAttribute(
                'aria-disabled',
                String( ! loop && slider.start >= maxStart( count, perView ) )
            )
        );
        lists.forEach( ( list ) =>
            list
                .querySelectorAll( '.supe-slides__indicator' )
                .forEach( ( button, index ) => {
                    const isCurrent = index === current;

                    button.classList.toggle( 'is-current', isCurrent );
                    if ( isCurrent ) {
                        button.setAttribute( 'aria-current', 'true' );
                    } else {
                        button.removeAttribute( 'aria-current' );
                    }
                } )
        );
        pauses.forEach( ( button ) => {
            const paused = !! slider.autoplay?.paused();

            button.classList.toggle( 'is-paused', paused );
            button.setAttribute(
                'aria-label',
                ( paused
                    ? button.dataset.labelPlay
                    : button.dataset.labelPause ) || ''
            );
        } );
    };

    // Only shown when there's autoplay to pause.
    pauses.forEach( ( button ) => {
        button.hidden = ! slider.autoplay;
    } );

    root.addEventListener( 'click', ( event ) => {
        const button = event.target.closest( '[data-supe-slides-action]' );

        if (
            ! button ||
            ! areas.some( ( area ) => area.contains( button ) ) ||
            button.getAttribute( 'aria-disabled' ) === 'true'
        ) {
            return;
        }

        const options = { source: 'controls' };

        switch ( button.dataset.supeSlidesAction ) {
            case 'prev':
                slider.prev( options );
                break;
            case 'next':
                slider.next( options );
                break;
            case 'go':
                slider.goTo( Number( button.dataset.start ), options );
                break;
            case 'pause':
                if ( slider.autoplay?.paused() ) {
                    slider.autoplay.resume();
                } else {
                    slider.autoplay?.pause();
                }
                update();
                break;
        }
    } );
    root.addEventListener( 'supe-slides:change', update );
    root.addEventListener( 'supe-slides:layout', () => {
        build();
        update();
    } );

    build();
    update();
}
