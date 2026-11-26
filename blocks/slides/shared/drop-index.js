/**
 * Where a dragged row lands: the index it takes once it's out of the list,
 * as moveBlockToPosition() expects within one parent.
 *
 * @param {number}  from   The dragged row's index.
 * @param {number}  over   The row under the pointer.
 * @param {boolean} before Whether the pointer is in that row's top half.
 * @return {number} Target index.
 */
export function dropIndex( from, over, before ) {
    const position = before ? over : over + 1;

    return from < position ? position - 1 : position;
}
