<?php

declare(strict_types=1);

namespace Supe\Editor\Supports\Responsive;

/**
 * Viewport
 *
 * The viewports a responsive value can target, in cascade order: desktop is
 * the base value, tablet and mobile override it at their breakpoints.
 */
enum Viewport: string {

    case Desktop = 'desktop';
    case Tablet  = 'tablet';
    case Mobile  = 'mobile';

    /**
     * Short suffix used in generated CSS custom property and class names.
     */
    public function suffix(): string {
        return match ( $this ) {
            self::Desktop => 'd',
            self::Tablet  => 't',
            self::Mobile  => 'm',
        };
    }
}
