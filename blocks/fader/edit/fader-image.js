import { createBlock } from '@wordpress/blocks';

/**
 * @param {Object} image A media object.
 * @return {Object} A fader image block for it.
 */
export const faderImage = ( image ) =>
    createBlock( 'supe/fader-image', { id: image.id } );
