/**
 * Site settings the server passes to the supports script (see
 * Supe\Editor\Supports\SupportAssets), e.g. the breakpoints for viewport
 * labels.
 *
 * @return {{breakpoints?: {tablet: number, mobile: number}}} Settings.
 */
export function editorSettings() {
    return window.supeEditor?.settings ?? {};
}
