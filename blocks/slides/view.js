/**
 * Front end: starts every slider on the page. A script module (block.json
 * `viewScriptModule`), so it runs after the document has parsed.
 */
import Slider, { ROOT } from './engine/Slider';

document.querySelectorAll( ROOT ).forEach( ( root ) => Slider.mount( root ) );
