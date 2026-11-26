import {
    InspectorControls,
    store as blockEditorStore,
    useBlockProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useViewport } from '@supe-editor/components';

import { getTransition } from '../slides/engine/transitions';
import { indicatorStarts, stepSize } from '../slides/engine/math';
import ControlSettings from '../slides/shared/ControlSettings';
import { configFrom } from '../slides/shared/config';
import { positionClass } from '../slides/shared/controls';
import { perViewAt } from '../slides/shared/layout';
import metadata from './block.json';

const DEFAULT_POSITION = metadata.attributes.position.default;

/**
 * The indicators as the front end builds them for the previewed viewport:
 * one per step (engine/math.js indicatorStarts()), the first current. The
 * style (dots, bars, numbers) is a block style.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   props.clientId
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
    const [ viewport ] = useViewport();
    const { slider, count } = useSelect(
        ( select ) => {
            const { getBlock, getBlockParentsByBlockName } =
                select( blockEditorStore );
            const [ sliderId ] = getBlockParentsByBlockName(
                clientId,
                'supe/slides',
                true
            );
            const block = getBlock( sliderId );
            const track = block?.innerBlocks.find(
                ( child ) => child.name === 'supe/slides-track'
            );

            return {
                slider: block?.attributes ?? {},
                count: track?.innerBlocks.length ?? 0,
            };
        },
        [ clientId ]
    );

    const config = configFrom( slider );
    const perView = Math.min( perViewAt( slider.perView, viewport ), count );
    const starts = indicatorStarts(
        count,
        perView,
        stepSize(
            config.step,
            perView,
            getTransition( config.transition.name ).pageOnly
        ),
        config.loop
    );
    // Like the engine, only the numbers style gets text.
    const numbers = /\bis-style-numbers\b/.test( attributes.className ?? '' );
    const blockProps = useBlockProps( {
        className: [
            'supe-slides__indicators',
            positionClass( attributes, DEFAULT_POSITION ),
        ].join( ' ' ),
    } );

    return (
        <>
            <InspectorControls>
                <ControlSettings
                    clientId={ clientId }
                    attributes={ attributes }
                    setAttributes={ setAttributes }
                    defaultPosition={ DEFAULT_POSITION }
                />
            </InspectorControls>
            <div { ...blockProps }>
                { starts.map( ( start, index ) => (
                    <span
                        key={ start }
                        className={
                            'supe-slides__indicator' +
                            ( index === 0 ? ' is-current' : '' )
                        }
                    >
                        <span className="supe-slides__indicator-mark">
                            { numbers && index + 1 }
                        </span>
                    </span>
                ) ) }
            </div>
        </>
    );
}
