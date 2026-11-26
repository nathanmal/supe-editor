/**
 * Post slides: the Query Loop a posts slider starts with, and the "Selected
 * posts" mode stored in its query (JS side of Blocks\Slides\Posts::selected()).
 *
 * Portable: no WordPress imports.
 */

/** The starting query: latest posts, not the page's own query. */
export const POSTS_QUERY = Object.freeze( {
    perPage: 6,
    pages: 0,
    offset: 0,
    postType: 'post',
    order: 'desc',
    orderBy: 'date',
    author: '',
    search: '',
    exclude: [],
    sticky: '',
    inherit: false,
} );

/**
 * @param {Object} query The Query Loop's `query` attribute.
 * @return {number[]} Selected post IDs in order; empty outside that mode.
 */
export function selectedPosts( query ) {
    if ( query?.orderBy !== 'include' || ! Array.isArray( query.include ) ) {
        return [];
    }

    const ids = query.include
        .map( ( id ) => Number( id ) )
        .filter( ( id ) => Number.isInteger( id ) && id > 0 );

    return [ ...new Set( ids ) ];
}

/**
 * How many slides a posts query makes, for the editor's indicators.
 *
 * @param {Object} query The Query Loop's `query` attribute.
 * @return {number} Selected posts, else the query's per page (10 when unset).
 */
export function postsCount( query ) {
    return query?.orderBy === 'include'
        ? selectedPosts( query ).length
        : Number( query?.perPage ) || 10;
}
