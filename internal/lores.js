import sendRequest from './send-request.js';

let endpoint = null;

const Scopes = {
	READ: 'lores:objectives:read',
	MANAGE: 'lores:objectives:manage'
};

export default {
	
	setEndpoint: function( loresEndpoint ) {
		endpoint = loresEndpoint;
		if( !loresEndpoint.endsWith( '/' ) ) {
			endpoint += '/';
		}
	},
	
	fetchRegistryAsync: function( registryId ) {
		if( !endpoint ) {
			return Promise.reject( 'Lores endpoint not set.' );
		}
		
		return sendRequest( 'GET', `${endpoint}api/lores/1.0/registries/${registryId}`, {
			authScope: Scopes.READ,
			expectJson: true
		});
	},
	
	updateRegistryAsync: function( registryId, registryContent ) {
		if( !endpoint ) {
			return Promise.reject( 'Lores endpoint not set.' );
		}
		
		return sendRequest( 'PUT', `${endpoint}api/lores/1.0/registries/${registryId}`, {
			authScope: Scopes.MANAGE,
			requestBodyJson: {
				objectives: registryContent,
				last_updated: new Date( Date.now() ).toISOString()
			}
		});
	},
	
	createOutcomesAsync: function( orgUnitId, sourceData ) {
		if( !sourceData.length ) {
			return Promise.resolve( [] );
		}
		
		if( !endpoint ) {
			return Promise.reject( 'Lores endpoint not set.' );
		}
		
		const owner = 'learning_outcomes';
		const additionalAuthorization = encodeURIComponent( JSON.stringify({
			_type: 'anon',
			orgUnitId: orgUnitId
		}));
		
		return sendRequest( 'POST', `${endpoint}api/lores/1.0/objectives/bulk?owner=${owner}&additionalAuthorization=${additionalAuthorization}`, {
			authScope: Scopes.MANAGE,
			requestBodyJson: sourceData
		});
	},
	
	getLockedOutcomesAsync: function( registryId ) {
		if( !endpoint ) {
			return Promise.reject( 'Lores endpoint not set.' );
		}
		
		return sendRequest( 'GET', `${endpoint}api/lores/1.0/registries/${registryId}/locked_objectives?filter=owned`, {
			authScope: Scopes.READ,
			expectJson: true
		}).catch( exception => {
			console.error( exception ); // eslint-disable-line no-console
			return [];
		});
	}
	
};
