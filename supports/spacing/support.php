<?php
/**
 * Responsive padding and margin. Entirely declarative: support.json's
 * `properties` drive AbstractResponsiveSupport's rendering and stylesheet
 * rules. Loaded by SupportRegistry, which expects the instance returned.
 */

declare(strict_types=1);

use Supe\Editor\Supports\AbstractResponsiveSupport;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

return new class extends AbstractResponsiveSupport {};
