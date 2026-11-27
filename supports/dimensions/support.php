<?php
/**
 * Responsive min height. Entirely declarative: support.json's `properties`
 * drive AbstractResponsiveSupport. Loaded by SupportRegistry, which expects
 * the instance returned.
 */

declare(strict_types=1);

use Supe\Editor\Supports\AbstractResponsiveSupport;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

return new class extends AbstractResponsiveSupport {};
