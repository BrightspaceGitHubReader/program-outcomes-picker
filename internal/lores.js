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
	}
	
};
