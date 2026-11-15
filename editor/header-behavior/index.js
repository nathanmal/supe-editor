/**
 * Header behavior (sticky / hide on scroll) — editor side.
 *
 * - Adds `supeSticky` / `supeHideOnScroll` to core/group, with a panel on the
 *   header's root Group (the site-wide default).
 * - Adds a "Header" document panel for the per-page override.
 *
 * Server side and front end: Editor\HeaderBehavior, ./view.js, ./view.scss.
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { registerPlugin } from '@wordpress/plugins';

import { ATTRIBUTES } from './constants';
import HeaderBehaviorControls from './HeaderBehaviorControls';
import HeaderDocumentPanel from './HeaderDocumentPanel';

addFilter(
    'blocks.registerBlockType',
    'supe-editor/header-behavior/attributes',
    ( settings, name ) =>
        'core/group' === name
            ? {
                  ...settings,
                  attributes: { ...settings.attributes, ...ATTRIBUTES },
              }
            : settings
);

addFilter(
    'editor.BlockEdit',
    'supe-editor/header-behavior/controls',
    createHigherOrderComponent(
        ( BlockEdit ) => ( props ) =>
            'core/group' === props.name ? (
                <>
                    <BlockEdit { ...props } />
                    <HeaderBehaviorControls { ...props } />
                </>
            ) : (
                <BlockEdit { ...props } />
            ),
        'withSupeHeaderBehaviorControls'
    )
);

registerPlugin( 'supe-header-behavior', { render: HeaderDocumentPanel } );
