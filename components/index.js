/**
 * Shared editor components, built once as the `supe-editor-components`
 * script (window.supeEditor.components) and imported everywhere else as
 * `@supe-editor/components` — webpack turns that import into a script
 * dependency instead of bundling a copy, the same way `@wordpress/*`
 * packages work. See webpack.config.js and Supe\Editor\SharedComponents.
 */
export * from './responsive';
