<?php

declare(strict_types=1);

namespace Supe\Editor\Supports;

use Supe\Editor\Supports\Responsive\StyleGenerator;
use WP_Block_Type_Registry;
use WP_HTML_Tag_Processor;

/**
 * Renderer
 *
 * One `render_block` pass for every support: adds each enabled support's
 * classes and CSS custom properties to the block's wrapper element at render
 * time, so saved markup never changes (no block validation errors, works for
 * static, dynamic, and core blocks alike).
 */
final class Renderer {

    public function __construct(
        private readonly SupportRegistry $registry,
        private readonly StyleGenerator $styles
    ) {}

    public function register(): void {
        add_filter( 'render_block', [ $this, 'renderBlock' ], 10, 2 );
    }

    /**
     * @param array<string, mixed> $block Parsed block.
     */
    public function renderBlock( string $content, array $block ): string {
        $value = $block['attrs'][ SupportRegistry::ATTRIBUTE ] ?? null;

        if ( '' === trim( $content ) || ! is_array( $value ) || empty( $block['blockName'] ) ) {
            return $content;
        }

        $output = $this->collect( $value, $this->enabledSupports( (string) $block['blockName'] ) );

        if ( [] === $output['classes'] && [] === $output['styles'] ) {
            return $content;
        }

        $updated = $this->apply( $content, $output );

        if ( $updated !== $content ) {
            $this->styles->enqueue();
        }

        return $updated;
    }

    /**
     * Merged output of every enabled support that has a value.
     *
     * @param  array<string, mixed> $value   The block's `supe` attribute.
     * @param  list<string>         $enabled Support names enabled on the block type.
     * @return array{classes: list<string>, styles: array<string, string>}
     */
    public function collect( array $value, array $enabled ): array {
        $classes = [];
        $styles  = [];

        foreach ( $this->registry->all() as $name => $support ) {
            if ( ! in_array( $name, $enabled, true ) || ! is_array( $value[ $name ] ?? null ) ) {
                continue;
            }

            $output  = $support->render( $value[ $name ] );
            $classes = array_merge( $classes, $output['classes'] );
            $styles  = array_merge( $styles, $output['styles'] );
        }

        return [
            'classes' => array_values( array_unique( $classes ) ),
            'styles'  => $styles,
        ];
    }

    /**
     * @param array{classes: list<string>, styles: array<string, string>} $output
     */
    public function apply( string $content, array $output ): string {
        $processor = new WP_HTML_Tag_Processor( $content );

        if ( ! $processor->next_tag() ) {
            return $content;
        }

        foreach ( $output['classes'] as $class ) {
            $processor->add_class( $class );
        }

        if ( [] !== $output['styles'] ) {
            $existing = $processor->get_attribute( 'style' );
            $existing = is_string( $existing ) ? rtrim( trim( $existing ), ';' ) : '';
            $ours     = StyleGenerator::inline( $output['styles'] );

            $processor->set_attribute( 'style', '' === $existing ? $ours : $existing . ';' . $ours );
        }

        return $processor->get_updated_html();
    }

    /**
     * @return list<string>
     */
    private function enabledSupports( string $blockName ): array {
        $blockType = WP_Block_Type_Registry::get_instance()->get_registered( $blockName );
        $supe      = $blockType?->supports[ SupportRegistry::ATTRIBUTE ] ?? null;

        return is_array( $supe ) ? array_keys( array_filter( $supe ) ) : [];
    }
}
