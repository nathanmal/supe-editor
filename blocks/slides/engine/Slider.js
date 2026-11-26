/**
 * One slider on the page. Reads its config from `data-supe-slides` and its
 * slides per view from the resolved `--supe-slides-per-view` (so it never
 * needs the breakpoints), and moves each slide to a slot with
 * `--supe-slide-offset` (style.scss turns that into a transform along the
 * track). No slides are cloned: looping is slot arithmetic (math.js).
 *
 * Events on the root:
 * - `supe-slides:change` `{ start, previous, source }` when a move starts.
 * - `supe-slides:layout` `{ perView, navigable }` when per view changes.
 */
import { configFrom, configClasses } from '../shared/config';
import autoplay from './autoplay';
import controls from './controls';
import drag from './drag';
import lightbox from './lightbox';
import keyboard from './keyboard';
import {
    advance,
    distance,
    dragSlots,
    inView,
    mod,
    moveSlots,
    navigable,
    normalize,
    releaseSteps,
    resist,
    restSlots,
    stepSize,
} from './math';
import { getTransition } from './transitions';

export const ROOT = '[data-supe-slides]';
const TRACK = '.supe-slides__track';
const SLIDE = '.supe-slides__slide';

const instances = new WeakMap();

/**
 * @param {string} value A custom property's computed value.
 * @return {boolean} Whether it resolved to something other than `auto`.
 */
const isSet = ( value ) => value.trim() !== '' && value.trim() !== 'auto';

export default class Slider {
    /**
     * Starts a slider on `root` once.
     *
     * @param {HTMLElement} root
     * @return {?Slider} The slider, or null without a track.
     */
    static mount( root ) {
        if ( ! instances.has( root ) ) {
            const track = [ ...root.children ].find( ( child ) =>
                child.matches( TRACK )
            );
            instances.set( root, track ? new Slider( root, track ) : null );
        }

        return instances.get( root );
    }

    constructor( root, track ) {
        this.root = root;
        this.track = track;
        this.slides = [ ...track.children ].filter( ( child ) =>
            child.matches( SLIDE )
        );
        this.indexes = new Map(
            this.slides.map( ( slide, index ) => [ slide, index ] )
        );

        let attributes = {};
        try {
            attributes = JSON.parse( root.dataset.supeSlides || '{}' );
        } catch {}
        this.config = configFrom( attributes );
        this.transition = getTransition( this.config.transition.name );
        this.vertical = configClasses( this.config ).includes( 'is-vertical' );
        this.reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        );

        this.start = 0;
        this.perView = 1;
        this.timer = null;
        this.width = null;
        this.place = this.place.bind( this );
        this.reflow = this.reflow.bind( this );

        this.status = document.createElement( 'div' );
        this.status.className = 'supe-slides__status';
        this.status.setAttribute( 'aria-live', 'polite' );
        this.status.setAttribute( 'aria-atomic', 'true' );
        root.append( this.status );

        root.classList.add( 'is-initialized' );
        this.orient();
        this.refresh( true );

        new window.ResizeObserver( ( [ entry ] ) => {
            // Only width changes the layout; measuring changes the height.
            if ( entry.contentRect.width !== this.width ) {
                this.width = entry.contentRect.width;
                this.refresh();
            }
        } ).observe( root );
        if ( this.vertical ) {
            // Images loading change the slide heights a vertical slider
            // measures.
            track.addEventListener( 'load', () => this.refresh( true ), true );
        }

        keyboard( this );
        this.autoplay = autoplay( this );
        controls( this );
        drag( this );
        lightbox( this );
    }

    /** @return {Object} What math.js needs. */
    get state() {
        return {
            count: this.slides.length,
            perView: this.perView,
            loop: this.config.loop,
            size: stepSize(
                this.config.step,
                this.perView,
                this.transition.pageOnly
            ),
        };
    }

    /** @return {boolean} Whether there's anywhere to go. */
    get navigable() {
        return navigable( this.slides.length, this.perView );
    }

    /** @return {number} The transition's duration, 0 for reduced motion. */
    get duration() {
        return this.reducedMotion.matches ? 0 : this.config.transition.duration;
    }

    /**
     * Which way the slots run on screen, for the transform and the arrow
     * keys: the next slide comes from the end side unless the layout is
     * reversed — or, horizontally, the page is right to left.
     */
    orient() {
        const rtl =
            ! this.vertical &&
            window.getComputedStyle( this.track ).direction === 'rtl';
        const reversed = this.root.classList.contains( 'is-reversed' );

        this.sign = reversed !== rtl ? -1 : 1;
        this.track.style.setProperty( '--supe-slides-sign', this.sign );
    }

    /**
     * Re-reads per view (and a vertical slider's row height) and, when per
     * view changed, puts the slides back at rest.
     *
     * @param {boolean} [force] Settle even if per view didn't change.
     */
    refresh( force = false ) {
        this.measure();

        const value = parseInt(
            window
                .getComputedStyle( this.root )
                .getPropertyValue( '--supe-slides-per-view' ),
            10
        );
        const perView = Math.max(
            1,
            Math.min( Number.isFinite( value ) ? value : 1, this.slides.length )
        );

        if ( force || perView !== this.perView ) {
            this.perView = perView;
            this.start = normalize( this.start, this.state );
            this.settle();
            this.root.classList.toggle( 'is-navigable', this.navigable );
            this.dispatch( 'layout', {
                perView,
                navigable: this.navigable,
            } );
        }
    }

    /**
     * A vertical slider needs a height to split into rows. When neither the
     * slider's height nor its ratio gives one (`auto`, or height per slide),
     * rows are as tall as the tallest slide.
     */
    measure() {
        if ( ! this.vertical ) {
            return;
        }

        const style = window.getComputedStyle( this.root );
        const definite =
            ! this.root.classList.contains( 'is-height-slide' ) &&
            ( isSet( style.getPropertyValue( '--supe-slides-h' ) ) ||
                isSet( style.getPropertyValue( '--supe-slides-ar' ) ) );

        this.root.classList.remove( 'is-measured' );
        if ( definite ) {
            return;
        }

        const tallest = Math.max(
            0,
            ...this.slides.map( ( slide ) => slide.offsetHeight )
        );
        this.track.style.setProperty( '--supe-slides-row', `${ tallest }px` );
        this.root.classList.add( 'is-measured' );
    }

    /**
     * @param {HTMLElement} slide
     * @param {number}      slot
     */
    place( slide, slot ) {
        slide.style.setProperty(
            '--supe-slide-offset',
            slot - this.indexes.get( slide )
        );
    }

    reflow() {
        // Reading layout applies the styles set so far, so the next ones
        // animate from them.
        void this.track.offsetWidth;
    }

    /** Every slide at rest for the current start, with no animation. */
    settle() {
        window.clearTimeout( this.timer );
        this.timer = null;

        const slots = restSlots(
            this.slides.length,
            this.start,
            this.config.loop
        );
        this.slides.forEach( ( slide, index ) => {
            slide.style.transition = '';
            slide.style.opacity = '';
            slide.style.zIndex = '';
            this.place( slide, slots[ index ] );
        } );
        this.show( inView( slots, this.perView ) );
    }

    /**
     * Only the slides in view are reachable: the rest are inert, so focus
     * and assistive tech can't land in hidden content.
     *
     * @param {number[]} shown Slide indexes.
     */
    show( shown ) {
        const focused = this.slides.find( ( slide ) =>
            slide.contains( slide.ownerDocument.activeElement )
        );

        this.slides.forEach( ( slide, index ) => {
            const visible = shown.includes( index );

            slide.inert = ! visible;
            slide.classList.toggle( 'is-shown', visible );
        } );
        if ( focused?.inert ) {
            this.track.focus( { preventScroll: true } );
        }
    }

    /**
     * @param {Object}  [options]
     * @param {string}  [options.source] What asked (`keyboard`, `autoplay`…).
     * @param {boolean} [options.rewind] Without loop, wrap at the ends.
     */
    next( options = {} ) {
        this.goTo( advance( this.start, 1, this.state, options ), {
            ...options,
            direction: 1,
        } );
    }

    /** @param {Object} [options] See next(). */
    prev( options = {} ) {
        this.goTo( advance( this.start, -1, this.state, options ), {
            ...options,
            direction: -1,
        } );
    }

    /**
     * Moves the view to start at `target`.
     *
     * @param {number} target
     * @param {Object} [options]
     * @param {string} [options.source]    What asked, in the change event.
     * @param {number} [options.direction] With loop, 1 or -1 to go that way
     *                                     round instead of the shorter one.
     */
    goTo( target, { source = 'api', direction } = {} ) {
        const { state } = this;
        const to = normalize( target, state );
        const from = this.start;

        if ( to === from || ! this.navigable ) {
            return;
        }

        let delta = distance( from, to, state );
        if ( state.loop && direction ) {
            delta =
                direction > 0
                    ? mod( to - from, state.count )
                    : -mod( from - to, state.count );
        }

        // Finish a move still running, then start from rest.
        this.settle();

        const { before, after } = moveSlots(
            state.count,
            from,
            delta,
            state.loop
        );
        this.move( to, before, after, { source } );
    }

    /**
     * Animates the slides from `before` to `after` slots and makes `to` the
     * start. The change is announced and dispatched when the start changed
     * (a released drag can also snap back).
     *
     * @param {number}   to
     * @param {number[]} before             Slots to start from (may be
     *                                      fractional).
     * @param {number[]} after              Slots to end at.
     * @param {Object}   options
     * @param {string}   options.source     What asked, in the change event.
     * @param {number}   [options.duration] Instead of the transition's.
     */
    move( to, before, after, { source, duration = this.duration } ) {
        const from = this.start;
        const shownBefore = inView( before, this.perView );
        const shownAfter = inView( after, this.perView );

        window.clearTimeout( this.timer );
        this.start = to;

        if ( duration > 0 ) {
            this.slides.forEach( ( slide, index ) => {
                slide.style.transition = '';
                this.place( slide, before[ index ] );
            } );
            this.reflow();
            this.transition.animate( {
                slides: this.slides,
                before,
                after,
                shownBefore,
                shownAfter,
                duration,
                easing: this.config.transition.easing,
                place: this.place,
                reflow: this.reflow,
            } );
            this.show( shownAfter );
            this.timer = window.setTimeout( () => this.settle(), duration );
        } else {
            this.settle();
        }

        if ( to === from ) {
            return;
        }
        if ( source !== 'autoplay' ) {
            this.announce( shownAfter );
        }
        this.dispatch( 'change', { start: to, previous: from, source } );
    }

    /**
     * One slide plus the gap along the track, in px: how far a drag has to
     * go to move one slot.
     *
     * @return {number} Pixels.
     */
    slotSize() {
        const [ slide ] = this.slides;
        const style = window.getComputedStyle( this.track );

        return this.vertical
            ? slide.offsetHeight + ( parseFloat( style.rowGap ) || 0 )
            : slide.offsetWidth + ( parseFloat( style.columnGap ) || 0 );
    }

    /**
     * Shows the slides dragged `shift` slots towards the end side, held
     * back past the ends without loop.
     *
     * @param {number} shift
     * @return {number} The shift shown.
     */
    drag( shift ) {
        const { state } = this;
        const shown = resist( this.start, shift, state );
        const base = dragSlots( state.count, this.start, shown, state.loop );

        window.clearTimeout( this.timer );
        this.timer = null;
        this.slides.forEach( ( slide, index ) => {
            slide.style.transition = 'none';
            this.place( slide, base[ index ] + shown );
        } );

        return shown;
    }

    /**
     * Ends a drag at `shift`: moves on by the slides (and steps) it went
     * or was flicked, or snaps back, animating from where the slides are.
     *
     * @param {number} shift    The shift drag() last showed.
     * @param {number} velocity Pointer speed towards the next slide, px/ms.
     */
    release( shift, velocity ) {
        const { state } = this;
        const from = this.start;
        const steps = releaseSteps( -shift, velocity, state.size );
        const to = normalize( from + steps, state );
        const delta = state.loop ? steps : to - from;
        const base = dragSlots(
            state.count,
            from,
            shift,
            state.loop,
            Math.max( 0, -delta )
        );
        // The rest of the way: a short distance takes part of the duration.
        const remaining = Math.min(
            1,
            Math.max( 0.3, Math.abs( delta + shift ) )
        );

        this.move(
            to,
            base.map( ( slot ) => slot + shift ),
            base.map( ( slot ) => slot - delta ),
            {
                source: 'drag',
                duration: Math.round( this.duration * remaining ),
            }
        );
    }

    /**
     * Tells screen readers which slides are now in view, by their labels
     * ("3 of 7: Name"). Autoplay stays silent.
     *
     * @param {number[]} shown
     */
    announce( shown ) {
        this.status.textContent = shown
            .map( ( index ) =>
                this.slides[ index ].getAttribute( 'aria-label' )
            )
            .filter( Boolean )
            .join( '; ' );
    }

    /**
     * @param {string} name
     * @param {Object} detail
     */
    dispatch( name, detail ) {
        this.root.dispatchEvent(
            new window.CustomEvent( `supe-slides:${ name }`, { detail } )
        );
    }
}
