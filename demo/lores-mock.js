import Lores from '../internal/lores.js';

const makeOutcome = function( id, notation, description, isAuthored, owner ) {
	return {
		id: id.toString(),
		source_id: id.toString(),
		source: isAuthored ? 'lores' : 'asn',
		document_id: isAuthored ? 'http://d2l.com/lo/authored' : null,
		jurisdiction: null,
		description: description || '',
		comments: [],
		education_levels: [],
		subjects: [],
		label: null,
		notation: notation || null,
		alt_notation: null,
		list_id: null,
		type: null,
		owner: owner || null
	};
};

const OBJECTIVES = [
	makeOutcome( 0, 'ASN.1', 'Root 1' ),
	makeOutcome( 1, 'ASN.2', 'Root 2' ),
	makeOutcome( 2, 'ASN1.A', 'Alpha' ),
	makeOutcome( 3, 'ASN1.B', 'Beta' ),
	makeOutcome( 4, 'ASN1.C', 'Gamma' ),
	makeOutcome( 5, 'AO.B.i', 'Authored 1', true, '1' ),
	makeOutcome( 6, 'AO.B.ii', 'Authored 2', true, '1' ),
	makeOutcome( 7, 'AO.C.i', 'Authored 3', true, '0' ),
	makeOutcome( 8, 'ASN.2.B', 'ASN outcome with <i>HTML content</i>' )
];

const buildObjective = function( outcomeId, children ) {
	const objectiveInfo = OBJECTIVES[outcomeId];
	if( children ) {
		return Object.assign( { children: children }, objectiveInfo );
	} else {
		return objectiveInfo;
	}
};

const MOCK_REGISTRY = {
	id: '0',
	objectives: [
		buildObjective( 0, [
			buildObjective( 4, [
				buildObjective( 7 )
			])
		])
	],
	last_updated: '1970-01-01'
};

const MOCK_PROGRAM_1 = {
	id: '1',
	objectives: [
		buildObjective( 0, [
			buildObjective( 2 ),
			buildObjective( 3, [
				buildObjective( 5 ),
				buildObjective( 6 )
			]),
			buildObjective( 4 )
		])
	],
	last_updated: '1970-01-01'
};

const MOCK_PROGRAM_2 = {
	id: '2',
	objectives: [
		buildObjective( 0, [
			buildObjective( 2 ),
			buildObjective( 3 ),
			buildObjective( 4 )
		]),
		buildObjective( 1, [
			buildObjective( 8 )
		])
	],
	last_updated: '1970-01-01'
};

const MOCK_PROGRAM_3 = {
	id: '3',
	objectives: [],
	last_updated: '1970-01-01'
};

const delayedSuccess = function( result ) {
	return new Promise( ( resolve, reject ) => {
		setTimeout( () => resolve( result ), 0 );
	});
};

const delayedFailure = function( exception ) {
	return new Promise( ( resolve, reject ) => {
		setTimeout( () => reject( result ), 0 );
	});
};

Lores.fetchRegistryAsync = function( registryId ) {
	switch( +registryId ) {
		case 0: return delayedSuccess( MOCK_REGISTRY );
		case 1: return delayedSuccess( MOCK_PROGRAM_1 );
		case 2: return delayedSuccess( MOCK_PROGRAM_2 );
		case 3: return delayedSuccess( MOCK_PROGRAM_3 );
		default: return delayedFailure( 'Not Found' );
	}
};

Lores.updateRegistryAsync = function( resgitryId, newRegistryContents ) {
	return delayedSuccess( 'OK' );
};

Lores.createOutcomesAsync = function( orgUnitId, sourceData ) {
	return delayedSuccess(
		sourceData.map( source => ({
			id: `mock-${Math.random()}`,
			source: source
		}))
	);
};
