import { withoutReplacedCoreSupports } from '../core-supports';
import spacing from '../../spacing/support.json';

// Mirrors SupportRegistryTest's replaced-core-feature cases.
describe( 'withoutReplacedCoreSupports', () => {
    it( 'turns off the core features the support replaces', () => {
        expect(
            withoutReplacedCoreSupports(
                {
                    anchor: true,
                    spacing: { padding: true, margin: true, blockGap: true },
                },
                spacing
            )
        ).toEqual( {
            anchor: true,
            spacing: { padding: false, margin: false, blockGap: true },
        } );
    } );

    it( 'leaves blocks without the core feature alone', () => {
        const supports = { anchor: true };

        expect( withoutReplacedCoreSupports( supports, spacing ) ).toBe(
            supports
        );
    } );

    it( 'ignores malformed replaces', () => {
        const supports = { spacing: { padding: true } };

        expect(
            withoutReplacedCoreSupports( supports, {
                replaces: { spacing: 'padding' },
            } )
        ).toBe( supports );
    } );
} );
