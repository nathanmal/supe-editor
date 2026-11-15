/**
 * Editor wiring shared by every support, registered once:
 *
 *  - `blocks.registerBlockType` — opts in the core blocks a support lists in
 *    `coreBlocks` and adds the `supe` attribute (PHP does the same on the
 *    server, see SupportRegistry).
 *  - `editor.BlockEdit` — each enabled support's panel in the Styles tab.
 *  - `editor.BlockListBlock` — the support's classes and CSS variables on the
 *    canvas, rendered by the same code as headless front ends (render.js);
 *    the generated stylesheet is already loaded in the editor canvas.
 *
 * Stored values are upgraded to the current shape before a panel sees them,
 * and every change is written back with the current version (`v`).
 */
import { addFilter } from '@wordpress/hooks';
import { getBlockType } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { supportOutput } from './render';
import { VERSION_KEY, supportVersion, upgrade } from './upgrade';

/** Block attribute holding every support's value, keyed by support name. */
export const ATTRIBUTE = 'supe';

/** @type {Map<string, {metadata: Object, Panel: Function, migrations: Object}>} */
const supports = new Map();

/**
 * Register a support's editor side.
 *
 * @param {Object}   metadata             Decoded support.json.
 * @param {Object}   options
 * @param {Function} options.Panel        Receives `{ value, onChange }`: the support's value in its
 *                                        current shape, and a setter taking the next value.
 * @param {Object}   [options.migrations] See upgrade(); must match the support's PHP migrations().
 */
export function registerSupport( metadata, { Panel, migrations = {} } ) {
    supports.set( metadata.name, { metadata, Panel, migrations } );
}

/**
 * Supports enabled on a block type, in registration order.
 *
 * @param {Object|undefined} blockSupports The block type's `supports`.
 * @return {Array} [ name, support ] pairs.
 */
function enabledSupports( blockSupports ) {
    const enabled = blockSupports?.[ ATTRIBUTE ];

    return enabled
        ? [ ...supports ].filter( ( [ name ] ) => enabled[ name ] )
        : [];
}

/**
 * The value to store for a support: the current version added, or undefined
 * once nothing is left so the key is dropped.
 *
 * @param {Object} metadata
 * @param {Object} next
 * @return {Object|undefined} Value to store.
 */
function toStored( metadata, next ) {
    const entries = Object.entries( next ?? {} ).filter(
        ( [ key, item ] ) => key !== VERSION_KEY && item !== undefined
    );

    return entries.length
        ? {
              ...Object.fromEntries( entries ),
              [ VERSION_KEY ]: supportVersion( metadata ),
          }
        : undefined;
}

function withSupportsAttribute( settings, name ) {
    let { supports: blockSupports = {} } = settings;

    for ( const [ supportName, { metadata } ] of supports ) {
        if (
            metadata.coreBlocks?.includes( name ) &&
            blockSupports[ ATTRIBUTE ]?.[ supportName ] === undefined
        ) {
            blockSupports = {
                ...blockSupports,
                [ ATTRIBUTE ]: {
                    ...blockSupports[ ATTRIBUTE ],
                    [ supportName ]: true,
                },
            };
        }
    }

    if ( ! enabledSupports( blockSupports ).length ) {
        return settings;
    }

    return {
        ...settings,
        supports: blockSupports,
        attributes: {
            ...settings.attributes,
            [ ATTRIBUTE ]: settings.attributes?.[ ATTRIBUTE ] ?? {
                type: 'object',
            },
        },
    };
}

const withSupportPanels = createHigherOrderComponent(
    ( BlockEdit ) => ( props ) => {
        const { attributes, setAttributes, isSelected, name } = props;
        const enabled = isSelected
            ? enabledSupports( getBlockType( name )?.supports )
            : [];

        if ( ! enabled.length ) {
            return <BlockEdit { ...props } />;
        }

        const stored = attributes[ ATTRIBUTE ] ?? {};

        return (
            <>
                <BlockEdit { ...props } />
                { enabled.map(
                    ( [ supportName, { metadata, Panel, migrations } ] ) => {
                        const value = stored[ supportName ]
                            ? upgrade(
                                  metadata,
                                  stored[ supportName ],
                                  migrations
                              )
                            : {};

                        // Saved by a newer version of this package: leave
                        // it alone rather than overwrite what we can't read.
                        if ( value === null ) {
                            return null;
                        }

                        const onChange = ( next ) => {
                            const updated = {
                                ...stored,
                                [ supportName ]: toStored( metadata, next ),
                            };

                            if ( updated[ supportName ] === undefined ) {
                                delete updated[ supportName ];
                            }

                            setAttributes( {
                                [ ATTRIBUTE ]: Object.keys( updated ).length
                                    ? updated
                                    : undefined,
                            } );
                        };

                        return (
                            <InspectorControls
                                group="styles"
                                key={ supportName }
                            >
                                <Panel value={ value } onChange={ onChange } />
                            </InspectorControls>
                        );
                    }
                ) }
            </>
        );
    },
    'withSupePanels'
);

const withSupportPreview = createHigherOrderComponent(
    ( BlockListBlock ) => ( props ) => {
        const stored = props.attributes?.[ ATTRIBUTE ];
        const enabled = stored
            ? enabledSupports( getBlockType( props.name )?.supports )
            : [];
        const classes = [];
        let styles = {};

        for ( const [ supportName, { metadata, migrations } ] of enabled ) {
            if ( stored[ supportName ] ) {
                const output = supportOutput(
                    metadata,
                    stored[ supportName ],
                    migrations
                );

                classes.push( ...output.classes );
                styles = { ...styles, ...output.styles };
            }
        }

        if ( ! classes.length ) {
            return <BlockListBlock { ...props } />;
        }

        return (
            <BlockListBlock
                { ...props }
                className={ [ props.className, ...new Set( classes ) ]
                    .filter( Boolean )
                    .join( ' ' ) }
                wrapperProps={ {
                    ...props.wrapperProps,
                    style: { ...props.wrapperProps?.style, ...styles },
                } }
            />
        );
    },
    'withSupePreview'
);

addFilter(
    'blocks.registerBlockType',
    'supe-editor/supports/attribute',
    withSupportsAttribute
);
addFilter(
    'editor.BlockEdit',
    'supe-editor/supports/panels',
    withSupportPanels
);
addFilter(
    'editor.BlockListBlock',
    'supe-editor/supports/preview',
    withSupportPreview
);
