/**
 * The inspector group a support's panel goes in, from the block's opt-in
 * (`supports.supe.{name}`): the Styles tab for `true`, the Settings tab for
 * `{ "tab": "settings" }` — e.g. the Container, a layout block, keeps its
 * layout and spacing there.
 *
 * @param {boolean|Object} optIn The block's value for the support.
 * @return {string} InspectorControls group.
 */
export function panelGroup( optIn ) {
    return optIn?.tab === 'settings' ? 'default' : 'styles';
}
