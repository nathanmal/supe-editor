import {
    InspectorControls,
    store as blockEditorStore,
    useBlockProps,
} from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import ControlIcon from '../slides/shared/ControlIcon';
import ControlSettings from '../slides/shared/ControlSettings';
import { CustomIcon, CustomIconControl } from '../slides/shared/CustomIcon';
import { icons, positionClass } from '../slides/shared/controls';
import metadata from './block.json';

const DEFAULT_POSITION = metadata.attributes.position.default;

/**
 * The pause / play button, shown as it starts (playing: the pause icon).
 * On the front end it only appears when the slider autoplays.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @param {string}   props.clientId
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
    const autoplay = useSelect(
        ( select ) => {
            const { getBlockAttributes, getBlockParentsByBlockName } =
                select( blockEditorStore );
            const [ sliderId ] = getBlockParentsByBlockName(
                clientId,
                'supe/slides',
                true
            );

            return !! getBlockAttributes( sliderId )?.autoplay?.enabled;
        },
        [ clientId ]
    );
    const blockProps = useBlockProps( {
        className: [
            'supe-slides__button',
            'supe-slides__pause',
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
                >
                    { ! autoplay && (
                        <Notice status="info" isDismissible={ false }>
                            { __(
                                'Shown only while the slider autoplays (Playback panel).',
                                'supe-editor'
                            ) }
                        </Notice>
                    ) }
                    <CustomIconControl
                        label={ __( 'Custom pause icon', 'supe-editor' ) }
                        value={ attributes.iconId }
                        onChange={ ( iconId ) => setAttributes( { iconId } ) }
                    />
                    <CustomIconControl
                        label={ __( 'Custom play icon', 'supe-editor' ) }
                        help={ __(
                            'Shown while autoplay is paused.',
                            'supe-editor'
                        ) }
                        value={ attributes.playIconId }
                        onChange={ ( playIconId ) =>
                            setAttributes( { playIconId } )
                        }
                    />
                </ControlSettings>
            </InspectorControls>
            <div { ...blockProps }>
                <CustomIcon
                    id={ attributes.iconId }
                    className="supe-slides__icon is-pause"
                    fallback={
                        <ControlIcon
                            paths={ icons.pause }
                            className="supe-slides__icon is-pause"
                        />
                    }
                />
            </div>
        </>
    );
}
