// WordPress's Prettier preset, with 4-space indentation instead of tabs to
// match the rest of the Supe codebase (PHP included).
module.exports = {
    ...require( '@wordpress/prettier-config' ),
    useTabs: false,
};
