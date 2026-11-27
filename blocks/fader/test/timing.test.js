import fixtures from '../../../tests/fixtures/fader-timing.json';
import { timing } from '../timing';

describe( 'timing', () => {
    it.each( fixtures.cases.map( ( item ) => [ item.label, item ] ) )(
        '%s',
        ( label, { attributes, expected } ) => {
            expect( timing( attributes ) ).toEqual( expected );
        }
    );
} );
