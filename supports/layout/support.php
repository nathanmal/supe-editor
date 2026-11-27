<?php
/**
 * Responsive gap and flex arrangement. The gap is `gap` for flex/grid and
 * the children's top margin for flow/constrained (not `!important`, so a
 * child's own margin still wins). Direction, justify and align apply to flex
 * layouts only. Entirely declarative: support.json's `properties` drive
 * AbstractResponsiveSupport. Loaded by SupportRegistry, which expects the
 * instance returned.
 */

declare(strict_types=1);

use Supe\Editor\Supports\AbstractResponsiveSupport;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

return new class extends AbstractResponsiveSupport {};
