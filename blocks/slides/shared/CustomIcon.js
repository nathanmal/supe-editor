import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { BaseControl, Button } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const SVG = [ 'image/svg+xml' ];

/**
 * An uploaded SVG's sanitized markup (`supe_svg`, Editor\SvgUploads) with the
 * classes and attributes SvgUploads::icon() adds on the front end.
 *
 * @param {string} markup    Sanitized SVG markup.
 * @param {string} className Classes for the SVG.
 * @return {string} The icon's markup, or '' when it isn't an SVG.
 */
export function decorateIcon( markup, className ) {
    const svg = new window.DOMParser().parseFromString(
        markup,
        'image/svg+xml'
    ).documentElement;

    if ( ! markup || svg.nodeName.toLowerCase() !== 'svg' ) {
        return '';
    }

    svg.classList.add( ...className.split( /\s+/ ).filter( Boolean ) );
    svg.setAttribute( 'aria-hidden', 'true' );
    svg.setAttribute( 'focusable', 'false' );
    svg.removeAttribute( 'role' );

    return svg.outerHTML;
}

/**
 * @param {number|undefined} id An SVG attachment.
 * @return {string} Its sanitized markup, '' until loaded or for other files.
 */
export function useSvgMarkup( id ) {
    return useSelect(
        ( select ) =>
            id ? select( coreStore ).getMedia( id )?.supe_svg ?? '' : '',
        [ id ]
    );
}

/**
 * A custom SVG icon, as the front end inlines it.
 *
 * @param {Object}  props
 * @param {number}  props.id
 * @param {string}  props.className Classes for the SVG.
 * @param {Element} props.fallback  Shown until it loads, or without one.
 */
export function CustomIcon( { id, className, fallback } ) {
    const markup = decorateIcon( useSvgMarkup( id ), className );

    return markup ? (
        // Sanitized on the server (Editor\SvgUploads); the wrapper takes no
        // space, so the SVG sits in the button as on the front end.
        <span
            className="supe-slides__icon-raw"
            dangerouslySetInnerHTML={ { __html: markup } }
        />
    ) : (
        fallback
    );
}

/**
 * Picks an SVG from the media library (or uploads one) for a control's icon.
 *
 * @param {Object}   props
 * @param {string}   props.label
 * @param {string}   [props.help]
 * @param {number}   [props.value]  Attachment ID.
 * @param {Function} props.onChange Called with an ID, or undefined.
 */
export function CustomIconControl( { label, help, value, onChange } ) {
    const markup = decorateIcon( useSvgMarkup( value ), 'supe-slides__icon' );
    const id = useInstanceId( CustomIconControl, 'supe-slides-custom-icon' );

    return (
        <MediaUploadCheck>
            <BaseControl
                __nextHasNoMarginBottom
                id={ id }
                label={ label }
                help={ help }
            >
                <div className="supe-slides-custom-icon">
                    { markup && (
                        <span
                            className="supe-slides-custom-icon__preview"
                            dangerouslySetInnerHTML={ { __html: markup } }
                        />
                    ) }
                    <MediaUpload
                        allowedTypes={ SVG }
                        value={ value }
                        onSelect={ ( media ) => onChange( media?.id ) }
                        render={ ( { open } ) => (
                            <Button
                                id={ id }
                                variant="secondary"
                                onClick={ open }
                            >
                                { value
                                    ? __( 'Replace', 'supe-editor' )
                                    : __( 'Choose SVG', 'supe-editor' ) }
                            </Button>
                        ) }
                    />
                    { value && (
                        <Button
                            variant="tertiary"
                            isDestructive
                            onClick={ () => onChange( undefined ) }
                        >
                            { __( 'Use preset', 'supe-editor' ) }
                        </Button>
                    ) }
                </div>
            </BaseControl>
        </MediaUploadCheck>
    );
}
