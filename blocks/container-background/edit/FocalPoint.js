import { Button, FocalPointPicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Focal point picker for the image or video, with a reset.
 *
 * @param {Object}   props
 * @param {string}   props.url        The media's URL (a video URL previews the video).
 * @param {?Object}  props.focalPoint
 * @param {Function} props.onChange   Called with the point, or undefined to reset.
 */
export default function FocalPoint( { url, focalPoint, onChange } ) {
    return (
        <>
            <FocalPointPicker
                __nextHasNoMarginBottom
                label={ __( 'Focal point', 'supe-editor' ) }
                help={ __(
                    'The part kept in view when the container is a different shape.',
                    'supe-editor'
                ) }
                url={ url }
                value={ focalPoint ?? { x: 0.5, y: 0.5 } }
                onChange={ onChange }
            />
            { focalPoint && (
                <Button variant="link" onClick={ () => onChange( undefined ) }>
                    { __( 'Reset focal point', 'supe-editor' ) }
                </Button>
            ) }
        </>
    );
}
