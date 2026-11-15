import { sanitize } from '../sanitize';
import fixtures from '../../../tests/fixtures/value-sanitizer.json';

// Same cases as PHP's ValueSanitizerTest.
describe( 'sanitize', () => {
    it.each( fixtures.cases )( '%s', ( label, type, value, expected ) => {
        expect( sanitize( value, type ) ).toBe( expected );
    } );
} );
