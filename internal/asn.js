import sendRequest from './send-request.js';

const callAsnAsync = function( action, queryParams ) {
	let url = `/d2l/api/le/unstable/lo/asn/search/${action}`;
	if( queryParams ) {
		const params = Object.keys( queryParams ).map( p => `${p}=${encodeURIComponent( queryParams[p] )}` );
		if( params.length ) {
			url += '?' + params.join( '&' );
		}
	}
	
	return sendRequest( 'GET', url, {
		authScope: 'lo:asn:search',
		expectJson: true,
		retry: 2,
		retryDelay: 250
	});
};

const fetchOutcomesAsync = function( documentId, subject, educationLevel ) {
	const params = {
		documentId: documentId,
		subject: subject
	};
	
	if( educationLevel ) {
		params.educationLevel = educationLevel;
	}
	
	return callAsnAsync( 'outcomes', params );
};

const fetchJurisdictionsAsync = function() {
	return callAsnAsync( 'jurisdictions' );
};

const fetchSubjectsAsync = function( jurisdiction ) {
	return callAsnAsync( 'subjects', {
		jurisdiction: jurisdiction
	});
};

const fetchFrameworksAsync = function( jurisdiction, subject ) {
	return callAsnAsync( 'frameworks', {
		jurisdiction: jurisdiction,
		subject: subject
	});
};

const fetchEducationLevelsAsync = function( documentId, subject ) {
	return callAsnAsync( 'educationLevels', {
		documentId: documentId,
		subject: subject
	});
};

export default {
	fetchJurisdictionsAsync: fetchJurisdictionsAsync,
	fetchSubjectsAsync: fetchSubjectsAsync,
	fetchFrameworksAsync: fetchFrameworksAsync,
	fetchEducationLevelsAsync: fetchEducationLevelsAsync,
	fetchOutcomesAsync: fetchOutcomesAsync
};
