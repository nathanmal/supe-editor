import { store as blockEditorStore } from '@wordpress/block-editor';
import {
    Button,
    Notice,
    PanelBody,
    SearchControl,
    // No stable segmented control in @wordpress/components yet.
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControl as ToggleGroupControl,
    // eslint-disable-next-line @wordpress/no-unsafe-wp-apis
    __experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp, close, plus } from '@wordpress/icons';

import { POSTS_QUERY, selectedPosts } from '../shared/posts';

/** Search results shown at a time. */
const RESULTS = 8;

const titleOf = ( post ) =>
    decodeEntities( post?.title?.rendered ?? '' ) ||
    __( '(no title)', 'supe-editor' );

/**
 * Which posts a posts slider shows: its Query Loop's query (set in that
 * block's own settings), or posts picked here, in order. Picked posts are
 * stored in the Query Loop's `query` as `include` with `orderBy: include`,
 * which the editor preview passes to the REST API and Blocks\Slides\Posts
 * applies on the front end.
 *
 * @param {Object} props
 * @param {string} props.trackClientId
 */
export default function PostsPanel( { trackClientId } ) {
    const [ search, setSearch ] = useState( '' );
    const [ term, setTerm ] = useState( '' );
    const debouncedSetTerm = useDebounce( setTerm, 300 );
    const { updateBlockAttributes, selectBlock } =
        useDispatch( blockEditorStore );

    const queryBlock = useSelect(
        ( select ) =>
            select( blockEditorStore )
                .getBlocks( trackClientId )
                .find( ( block ) => block.name === 'core/query' ),
        [ trackClientId ]
    );
    const query = queryBlock?.attributes.query ?? {};
    const postType = query.postType || 'post';
    const selecting = query.orderBy === 'include';
    const ids = selectedPosts( query );
    // A stable dependency for the lookups below.
    const idList = ids.join();

    const { picked, results, searching } = useSelect(
        ( select ) => {
            const { getEntityRecords, isResolving } = select( coreStore );
            const resultsQuery = {
                search: term,
                per_page: RESULTS,
                exclude: ids,
                _fields: 'id,title',
            };

            return {
                picked: ids.length
                    ? getEntityRecords( 'postType', postType, {
                          include: ids,
                          per_page: ids.length,
                          _fields: 'id,title',
                      } ) ?? []
                    : [],
                results:
                    selecting && term
                        ? getEntityRecords(
                              'postType',
                              postType,
                              resultsQuery
                          ) ?? []
                        : [],
                searching:
                    !! term &&
                    isResolving( 'getEntityRecords', [
                        'postType',
                        postType,
                        resultsQuery,
                    ] ),
            };
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `ids` is a new array each render; `idList` is its value.
        [ postType, term, selecting, idList ]
    );

    if ( ! queryBlock ) {
        return null;
    }

    const updateQuery = ( changes ) =>
        updateBlockAttributes( queryBlock.clientId, {
            query: { ...query, ...changes },
        } );
    const setIds = ( next ) =>
        updateQuery( {
            include: next,
            perPage: Math.max( 1, next.length ),
        } );
    const move = ( from, to ) => {
        const next = [ ...ids ];
        next.splice( to, 0, ...next.splice( from, 1 ) );
        setIds( next );
    };

    return (
        <PanelBody title={ __( 'Posts', 'supe-editor' ) }>
            <div className="supe-slides-panel">
                <ToggleGroupControl
                    __next40pxDefaultSize
                    __nextHasNoMarginBottom
                    isBlock
                    label={ __( 'Show', 'supe-editor' ) }
                    value={ selecting ? 'selected' : 'query' }
                    onChange={ ( mode ) => {
                        if ( mode === 'selected' ) {
                            updateQuery( {
                                orderBy: 'include',
                                include: [],
                                perPage: 1,
                            } );
                        } else {
                            const { include, ...rest } = query;
                            updateBlockAttributes( queryBlock.clientId, {
                                query: {
                                    ...rest,
                                    orderBy: POSTS_QUERY.orderBy,
                                    perPage: POSTS_QUERY.perPage,
                                },
                            } );
                        }
                    } }
                >
                    <ToggleGroupControlOption
                        value="query"
                        label={ __( 'A query', 'supe-editor' ) }
                    />
                    <ToggleGroupControlOption
                        value="selected"
                        label={ __( 'Selected posts', 'supe-editor' ) }
                    />
                </ToggleGroupControl>

                { ! selecting && (
                    <div>
                        <p className="components-base-control__help">
                            { __(
                                'Post type, number of posts, order and filters are in the Query Loop’s settings. Its post template is the slide’s design.',
                                'supe-editor'
                            ) }
                        </p>
                        <Button
                            variant="secondary"
                            onClick={ () => selectBlock( queryBlock.clientId ) }
                        >
                            { __( 'Edit the query', 'supe-editor' ) }
                        </Button>
                    </div>
                ) }

                { selecting && ids.length === 0 && (
                    <Notice status="info" isDismissible={ false }>
                        { __(
                            'Search for the posts to show. Until you pick some, the slider shows nothing on the site.',
                            'supe-editor'
                        ) }
                    </Notice>
                ) }

                { selecting && ids.length > 0 && (
                    <ol className="supe-slides-list">
                        { ids.map( ( id, index ) => {
                            const label = titleOf(
                                picked.find( ( post ) => post.id === id )
                            );

                            return (
                                <li
                                    key={ id }
                                    className="supe-slides-list__row"
                                >
                                    <div className="supe-slides-list__select">
                                        <span className="supe-slides-list__number">
                                            { index + 1 }
                                        </span>
                                        <span className="supe-slides-list__name">
                                            { label }
                                        </span>
                                    </div>
                                    <Button
                                        size="small"
                                        icon={ chevronUp }
                                        label={ sprintf(
                                            /* translators: %s: post title. */
                                            __( 'Move up: %s', 'supe-editor' ),
                                            label
                                        ) }
                                        showTooltip={ false }
                                        disabled={ index === 0 }
                                        accessibleWhenDisabled
                                        onClick={ () =>
                                            move( index, index - 1 )
                                        }
                                    />
                                    <Button
                                        size="small"
                                        icon={ chevronDown }
                                        label={ sprintf(
                                            /* translators: %s: post title. */
                                            __(
                                                'Move down: %s',
                                                'supe-editor'
                                            ),
                                            label
                                        ) }
                                        showTooltip={ false }
                                        disabled={ index === ids.length - 1 }
                                        accessibleWhenDisabled
                                        onClick={ () =>
                                            move( index, index + 1 )
                                        }
                                    />
                                    <Button
                                        size="small"
                                        icon={ close }
                                        label={ sprintf(
                                            /* translators: %s: post title. */
                                            __( 'Remove: %s', 'supe-editor' ),
                                            label
                                        ) }
                                        showTooltip={ false }
                                        onClick={ () =>
                                            setIds(
                                                ids.filter(
                                                    ( item ) => item !== id
                                                )
                                            )
                                        }
                                    />
                                </li>
                            );
                        } ) }
                    </ol>
                ) }

                { selecting && (
                    <div>
                        <SearchControl
                            __nextHasNoMarginBottom
                            label={ __( 'Search posts', 'supe-editor' ) }
                            value={ search }
                            onChange={ ( next ) => {
                                setSearch( next );
                                debouncedSetTerm( next.trim() );
                            } }
                        />
                        { term && ! searching && results.length === 0 && (
                            <p className="components-base-control__help">
                                { __( 'No posts found.', 'supe-editor' ) }
                            </p>
                        ) }
                        { results.length > 0 && (
                            <ul className="supe-slides-results">
                                { results.map( ( post ) => (
                                    <li key={ post.id }>
                                        <Button
                                            icon={ plus }
                                            onClick={ () => {
                                                setIds( [ ...ids, post.id ] );
                                                setSearch( '' );
                                                setTerm( '' );
                                            } }
                                        >
                                            { titleOf( post ) }
                                        </Button>
                                    </li>
                                ) ) }
                            </ul>
                        ) }
                    </div>
                ) }
            </div>
        </PanelBody>
    );
}
