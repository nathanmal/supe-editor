import fixtures from '../../../../tests/fixtures/slides-config.json';
import { configClasses, configFrom } from '../config';

describe( 'configFrom', () => {
    it.each( fixtures.cases.map( ( item ) => [ item.label, item ] ) )(
        '%s',
        ( label, { attributes, expected } ) => {
            const config = configFrom( attributes );

            expect( config ).toEqual( expected.config );
            expect( configClasses( config ) ).toEqual( expected.classes );
        }
    );
} );
