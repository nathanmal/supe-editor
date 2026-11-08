/**
 * Page title prompt.
 *
 * When an untitled page opens with "Show template" on and the template has no
 * Post Title block, there's nowhere on the canvas to type the title. This
 * opens a small "Name this page" dialog instead.
 */
import { registerPlugin } from '@wordpress/plugins';

import PageTitlePrompt from './PageTitlePrompt';

registerPlugin( 'supe-page-title-prompt', { render: PageTitlePrompt } );
