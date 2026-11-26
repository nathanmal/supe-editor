import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * The editor's image sizes (thumbnail, medium, large, full, …) as options.
 *
 * @return {Array<{value: string, label: string}>} Select options.
 */
export default function useImageSizeOptions() {
    const sizes = useSelect(
        ( select ) => select( blockEditorStore ).getSettings().imageSizes,
        []
    );

    return ( sizes ?? [] ).map( ( { slug, name } ) => ( {
        value: slug,
        label: name,
    } ) );
}
