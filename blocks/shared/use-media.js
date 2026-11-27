import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Media library records for attachment IDs, as they load.
 *
 * @param {number[]} ids
 * @return {Object<number, Object>} Records by ID (undefined until loaded).
 */
export default function useMedia( ids ) {
    return useSelect(
        ( select ) =>
            Object.fromEntries(
                ids.map( ( id ) => [ id, select( coreStore ).getMedia( id ) ] )
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- by value.
        [ ids.join() ]
    );
}

/**
 * @param {?Object} media A media record.
 * @return {?string} Its thumbnail URL, else the original's.
 */
export const thumbnailOf = ( media ) =>
    media?.media_details?.sizes?.thumbnail?.source_url ??
    media?.source_url ??
    null;
