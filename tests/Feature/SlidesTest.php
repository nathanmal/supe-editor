<?php

declare(strict_types=1);

namespace Supe\Editor\Tests\Feature;

use Supe\Editor\Blocks\Slides\Markup;
use Yoast\WPTestUtils\WPIntegration\TestCase;

/**
 * Renders the slides blocks from build/ (run `npm run build` first).
 */
final class SlidesTest extends TestCase {

    public function test_the_slides_blocks_are_registered(): void {
        foreach ( [ 'supe/slides', 'supe/slides-track', 'supe/slide', 'supe/image-slide' ] as $name ) {
            self::assertTrue( \WP_Block_Type_Registry::get_instance()->is_registered( $name ), $name );
        }
    }

    public function test_content_slides_render_as_labelled_groups_in_a_carousel(): void {
        $html = do_blocks( $this->slides( 'content', [
            '<!-- wp:supe/slide {"metadata":{"name":"Intro"},"verticalAlignment":"center"} --><!-- wp:paragraph --><p>One</p><!-- /wp:paragraph --><!-- /wp:supe/slide -->',
            '<!-- wp:supe/slide --><!-- wp:paragraph --><p>Two</p><!-- /wp:paragraph --><!-- /wp:supe/slide -->',
        ] ) );

        $processor = new \WP_HTML_Tag_Processor( $html );

        self::assertTrue( $processor->next_tag( 'section' ) );
        self::assertTrue( $processor->has_class( 'supe-slides' ) );
        self::assertTrue( $processor->has_class( 'is-type-content' ) );
        self::assertSame( 'carousel', $processor->get_attribute( 'aria-roledescription' ) );
        self::assertSame( 'Slideshow', $processor->get_attribute( 'aria-label' ) );

        self::assertTrue( $processor->next_tag( [ 'class_name' => 'supe-slides__track' ] ) );
        self::assertSame( '0', $processor->get_attribute( 'tabindex' ) );

        self::assertSame( [ '1 of 2: Intro', '2 of 2' ], $this->slideLabels( $html ) );
        self::assertStringContainsString( 'is-vertically-aligned-center', $html );
        self::assertStringContainsString( '>Two</p>', $html );
    }

    public function test_a_nested_slider_keeps_its_own_labels(): void {
        $inner = $this->slides( 'content', [
            '<!-- wp:supe/slide --><!-- /wp:supe/slide -->',
            '<!-- wp:supe/slide --><!-- /wp:supe/slide -->',
            '<!-- wp:supe/slide --><!-- /wp:supe/slide -->',
        ] );
        $html  = do_blocks( $this->slides( 'content', [
            '<!-- wp:supe/slide -->' . $inner . '<!-- /wp:supe/slide -->',
        ] ) );

        self::assertSame( [ '1 of 1', '1 of 3', '2 of 3', '3 of 3' ], $this->slideLabels( $html ) );
    }

    public function test_image_slides_render_the_attachment_named_by_its_alt_text(): void {
        $id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );
        update_post_meta( $id, '_wp_attachment_image_alt', 'Canola field' );

        $html = do_blocks( $this->slides( 'images', [
            '<!-- wp:supe/image-slide {"id":' . $id . '} /-->',
            '<!-- wp:supe/image-slide {"id":' . $id . ',"metadata":{"name":"Renamed"}} /-->',
            '<!-- wp:supe/image-slide /-->',
        ] ) );

        self::assertSame( [ '1 of 2: Canola field', '2 of 2: Renamed' ], $this->slideLabels( $html ) );
        self::assertSame( 2, substr_count( $html, 'size-large supe-slides__image"' ) );
        self::assertStringContainsString( 'srcset=', $html );
    }

    public function test_image_slides_apply_their_settings_over_the_slider_defaults(): void {
        $id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );

        $html = do_blocks(
            '<!-- wp:supe/slides {"type":"images","imageDefaults":{"fit":"contain","captionPosition":"overlay","size":"medium"}} --><!-- wp:supe/slides-track -->'
            . '<!-- wp:supe/image-slide {"id":' . $id . ',"fit":"cover","focalPoint":{"x":0.2,"y":0.8},"alt":"Own alt","caption":"A <em>field</em><script>x</script>","href":"https://example.com/","linkTarget":"_blank"} /-->'
            . '<!-- wp:supe/image-slide {"id":' . $id . ',"captionPosition":"hidden","caption":"Hidden"} /-->'
            . '<!-- /wp:supe/slides-track --><!-- /wp:supe/slides -->'
        );

        $processor = new \WP_HTML_Tag_Processor( $html );

        self::assertTrue( $processor->next_tag( [ 'class_name' => Markup::SLIDE_CLASS ] ) );
        self::assertTrue( $processor->has_class( 'has-caption-overlay' ) );
        self::assertSame( '1 of 2: Own alt', $processor->get_attribute( 'aria-label' ) );
        self::assertTrue( $processor->next_tag( 'a' ) );
        self::assertSame( 'https://example.com/', $processor->get_attribute( 'href' ) );
        self::assertSame( '_blank', $processor->get_attribute( 'target' ) );
        self::assertSame( 'noopener', $processor->get_attribute( 'rel' ) );
        self::assertTrue( $processor->next_tag( 'img' ) );
        self::assertSame( 'Own alt', $processor->get_attribute( 'alt' ) );
        self::assertSame( 'object-fit:cover;object-position:20% 80%', $processor->get_attribute( 'style' ) );
        self::assertTrue( $processor->next_tag( 'figcaption' ) );

        // Second slide: slider defaults (contain, medium), caption hidden.
        self::assertTrue( $processor->next_tag( [ 'class_name' => Markup::SLIDE_CLASS ] ) );
        self::assertFalse( $processor->has_class( 'has-caption-overlay' ) );
        self::assertTrue( $processor->next_tag( 'img' ) );
        self::assertSame( 'object-fit:contain', $processor->get_attribute( 'style' ) );
        self::assertStringContainsString( 'size-medium', (string) $processor->get_attribute( 'class' ) );

        self::assertStringContainsString( 'A <em>field</em>', $html );
        self::assertStringNotContainsString( '<script>', $html );
        self::assertStringNotContainsString( 'Hidden', $html );
    }

    public function test_layout_settings_become_variables_on_the_root(): void {
        $html = do_blocks(
            '<!-- wp:supe/slides {"type":"content","perView":{"desktop":3,"mobile":1},"gap":{"desktop":"var:preset|spacing|30"},"heightTarget":"slide","height":{"desktop":{"mode":"ratio","value":"4/3"}}} -->'
            . '<!-- wp:supe/slides-track --><!-- wp:supe/slide --><!-- /wp:supe/slide --><!-- /wp:supe/slides-track --><!-- /wp:supe/slides -->'
        );

        $processor = new \WP_HTML_Tag_Processor( $html );
        self::assertTrue( $processor->next_tag( 'section' ) );
        self::assertTrue( $processor->has_class( 'is-height-slide' ) );

        $style = (string) $processor->get_attribute( 'style' );
        self::assertStringContainsString( '--supe-slides-per-view-d:3;--supe-slides-per-view-t:initial;--supe-slides-per-view-m:1', $style );
        self::assertStringContainsString( '--supe-slides-gap-d:var(--wp--preset--spacing--30)', $style );
        self::assertStringContainsString( '--supe-slides-ar-d:4 / 3', $style );

        self::assertTrue( wp_style_is( 'supe-responsive', 'enqueued' ) );
        self::assertStringContainsString(
            '.wp-block-supe-slides{--supe-slides-per-view:var(--supe-slides-per-view-d);',
            implode( '', wp_styles()->get_data( 'supe-responsive', 'after' ) ?: [] )
        );
    }

    public function test_without_layout_settings_the_root_has_no_style(): void {
        $html = do_blocks( $this->slides( 'content', [ '<!-- wp:supe/slide --><!-- /wp:supe/slide -->' ] ) );

        $processor = new \WP_HTML_Tag_Processor( $html );
        self::assertTrue( $processor->next_tag( 'section' ) );
        self::assertNull( $processor->get_attribute( 'style' ) );
    }

    public function test_renders_nothing_without_a_type_or_slides(): void {
        self::assertSame( '', trim( do_blocks( $this->slides( '', [ '<!-- wp:supe/slide --><!-- /wp:supe/slide -->' ] ) ) ) );
        self::assertSame( '', trim( do_blocks( $this->slides( 'images', [ '<!-- wp:supe/image-slide /-->' ] ) ) ) );
    }

    public function test_markup_the_html_api_cannot_parse_is_returned_unchanged(): void {
        // Misnested formatting needs the adoption agency algorithm, which
        // WP_HTML_Processor doesn't support for this case.
        $html = '<div class="supe-slides__slide"></div><b><p>x</b></p>';

        self::assertSame( $html, Markup::labelSlides( $html ) );
    }

    public function test_markup_without_slides_is_returned_unchanged(): void {
        self::assertSame( '<p>No slides</p>', Markup::labelSlides( '<p>No slides</p>' ) );
        self::assertSame( '', Markup::labelSlides( '' ) );
    }

    /**
     * @param string[] $slides Serialized slide blocks.
     */
    private function slides( string $type, array $slides ): string {
        $attributes = '' === $type ? '' : ' {"type":"' . $type . '"}';

        return '<!-- wp:supe/slides' . $attributes . ' --><!-- wp:supe/slides-track -->'
            . implode( '', $slides )
            . '<!-- /wp:supe/slides-track --><!-- /wp:supe/slides -->';
    }

    /**
     * @return string[] Every slide's aria-label, in document order.
     */
    private function slideLabels( string $html ): array {
        $labels    = [];
        $processor = new \WP_HTML_Tag_Processor( $html );
        while ( $processor->next_tag( [ 'class_name' => Markup::SLIDE_CLASS ] ) ) {
            $labels[] = $processor->get_attribute( 'aria-label' );
        }

        return $labels;
    }
}
