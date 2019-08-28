import sendRequest from './send-request.js';

const ASN_ENDPOINT = 'https://elastic1.asn.desire2learn.com';
const API_KEY = 'QprcezCMUMwQHHaznnxJLwNt4sZnryP4';
const MAX_RESULTS = 10000;
const RELEVANT_FIELDS = [
	'description',
	'education_level',
	'alt_statement_notation',
	'statement_label',
	'statement_notation',
	'list_id',
	'comment',
	'identifier',
	'is_child_of',
	'has_child',
	'jurisdiction',
	'subject'
];

const firstOrNull = function( array ) {
	return ( array && array.length ) ? array[0] : null;
};

const buildOutcome = function( documentId, asnData ) {
	return {
		source_id: firstOrNull( asnData.identifier ),
		source: 'asn',
		document_id: documentId,
		jurisdiction: firstOrNull( asnData.jurisdiction ),
		description: firstOrNull( asnData.description ) || '',
		comments: asnData.comment || [],
		education_levels: asnData.education_level || [],
		subjects: asnData.subject || [],
		label: firstOrNull( asnData.statement_label ),
		notation: firstOrNull( asnData.statement_notation ),
		alt_notation: firstOrNull( asnData.alt_statement_notation ),
		list_id: firstOrNull( asnData.list_id ),
		type: null,
		children: []
	};
};

const pruneFalseLeaves = function( forest, trueLeaves ) {
	let i = 0;
	while( i < forest.length ) {
		const node = forest[i];
		if( node.children.length ) {
			pruneFalseLeaves( node.children, trueLeaves );
		}
		
		if( !node.children.length && !trueLeaves.has( node.source_id ) ) {
			forest.splice( i, 1 );
		} else {
			i++;
		}
	}
};

const buildTree = function( documentId, asnResponse ) {
	const outcomesMap = new Map();
	const leafSet = new Set();
	asnResponse.hits.hit.forEach( hit => {
		const sourceId = firstOrNull( hit.data.identifier );
		if( sourceId ) {
			outcomesMap.set( sourceId, {
				outcome: buildOutcome( documentId, hit.data ),
				parentId: firstOrNull( hit.data.is_child_of )
			});
			if( firstOrNull( hit.data.has_child ) !== 'true' ) {
				leafSet.add( sourceId );
			}
		}
	});
	
	const rootOutcomes = [];
	for( const outcomeData of outcomesMap.values() ) {
		if( outcomeData.parentId === documentId ) {
			rootOutcomes.push( outcomeData.outcome );
		} else if( outcomeData.parentId && outcomesMap.has( outcomeData.parentId ) ) {
			outcomesMap.get( outcomeData.parentId ).outcome.children.push( outcomeData.outcome );
		}
	}
	
	pruneFalseLeaves( rootOutcomes, leafSet );
	return rootOutcomes;
};

const buildQuery = function( constraints ) {
	const queryParts = [ 'and' ];
	Object.keys( constraints ).forEach( key => {
		if( constraints[key] ) {
			queryParts.push( `${key}:'${encodeURIComponent( constraints[key] )}'` );
		}
	});
	
	return `(${queryParts.join( '+' )})`;
};

const fetchOutcomesAsync = function( documentId, subject, educationLevel ) {
	const query = buildQuery({
		is_part_of: documentId,
		subject: subject,
		education_level: educationLevel
	});
	
	const url = `${ASN_ENDPOINT}/api/1/search` +
		`?key=${API_KEY}` +
		`&bq=${query}` +
		`&return-fields=${RELEVANT_FIELDS.join( ',' )}` +
		'&rank=sibling_order' +
		`&size=${MAX_RESULTS}`;
		
	return sendRequest( 'GET', url, {
		expectJson: true,
		retry: 2,
		retryDelay: 250
	}).then(
		asnResponse => buildTree( documentId, asnResponse )
	);
};

const fetchJurisdictionsAsync = function() {
	const query = buildQuery({
		fct_type: 'Standard Document',
		fct_publication_status: 'Published'
	});
	
	const url = `${ASN_ENDPOINT}/api/1/search` +
		`?key=${API_KEY}` +
		`&bq=${query}` +
		'&facet=fct_jurisdiction' +
		`&facet-fct_jurisdiction-top-n=${MAX_RESULTS}` +
		'&facet-fct_jurisdiction-sort=alpha';
	
	return sendRequest( 'GET', url, {
		expectJson: true,
		retry: 2,
		retryDelay: 250
	}).then(
		asnResponse => asnResponse.facets.fct_jurisdiction.constraints.map( j => j.value )
	);
};

const fetchSubjectsAsync = function( jurisdiction ) {
	const query = buildQuery({
		jurisdiction: jurisdiction,
		fct_type: 'Standard Document',
		fct_publication_status: 'Published'
	});
	
	const url = `${ASN_ENDPOINT}/api/1/search` +
		`?key=${API_KEY}` +
		`&bq=${query}` +
		'&facet=fct_subject' +
		'&facet-fct_subject-sort=alpha' +
		`&size=${MAX_RESULTS}`;
	
	return sendRequest( 'GET', url, {
		expectJson: true,
		retry: 2,
		retryDelay: 250
	}).then(
		asnResponse => asnResponse.facets.fct_subject.constraints.map( s => s.value )
	);
};

const fetchFrameworksAsync = function( jurisdiction, subject ) {
	const query = buildQuery({
		jurisdiction: jurisdiction,
		fct_type: 'Standard Document',
		fct_publication_status: 'Published',
		subject: subject
	});
	
	const url = `${ASN_ENDPOINT}/api/1/search` +
		`?key=${API_KEY}` +
		`&bq=${query}` +
		'&return-fields=title,date_valid,identifier' +
		'&rank=-date_valid,title' +
		`&size=${MAX_RESULTS}`;
	
	return sendRequest( 'GET', url, {
		expectJson: true,
		retry: 2,
		retryDelay: 250
	}).then(
		asnResponse => asnResponse.hits.hit.map( f => ({
			documentId: firstOrNull( f.data.identifier ),
			framework: firstOrNull( f.data.title ),
			year: firstOrNull( f.data.date_valid )
		}))
	);
};

const fetchEducationLevelsAsync = function( documentId, subject ) {
	const query = buildQuery({
		is_part_of: documentId,
		subject: subject
	});
	
	const url = `${ASN_ENDPOINT}/api/1/search` +
		`?key=${API_KEY}` +
		`&bq=${query}` +
		'&facet=fct_education_level';
	
	return sendRequest( 'GET', url, {
		expectJson: true,
		retry: 2,
		retryDelay: 250
	}).then(
		asnResponse => asnResponse.facets.fct_education_level.constraints.map( el => el.value )
	);
};

export default {
	fetchJurisdictionsAsync: fetchJurisdictionsAsync,
	fetchSubjectsAsync: fetchSubjectsAsync,
	fetchFrameworksAsync: fetchFrameworksAsync,
	fetchEducationLevelsAsync: fetchEducationLevelsAsync,
	fetchOutcomesAsync: fetchOutcomesAsync
};
