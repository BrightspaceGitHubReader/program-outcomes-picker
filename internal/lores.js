import Auth from './auth.js';

let endpoint = null;

const callLoresAsync = function( method, path, scope, jsonBody ) {
	return Auth.getOAuth2TokenAsync( scope ).then( token => new Promise( ( resolve, reject ) => {
		const xhr = new XMLHttpRequest();
		xhr.open( method, endpoint + path );
		xhr.setRequestHeader( 'Authorization', 'Bearer ' + token );
		
		xhr.onreadystatechange = function() {
			if( xhr.readyState !== XMLHttpRequest.DONE ) {
				return;
			}
			
			if( xhr.status !== 200 && xhr.status !== 204 ) {
				reject( xhr.statusText );
			}
			
			const contentType = xhr.getResponseHeader( 'Content-Type' );
			if( contentType && contentType.includes( 'application/json' ) ) {
				try {
					resolve( JSON.parse( xhr.responseText ) );
				} catch( exception ) {
					reject( exception );
				}
			} else {
				resolve( xhr.responseText || null );
			}
		};
		
		if( jsonBody ) {
			xhr.setRequestHeader( 'Content-Type', 'application/json' );
			xhr.send( JSON.stringify( jsonBody ) );
		} else {
			xhr.send();
		}
	}));
};

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
		
		return callLoresAsync( 'GET', 'api/lores/1.0/registries/' + registryId, Scopes.READ );
	},
	
	updateRegistryAsync: function( registryId, registryContent ) {
		if( !endpoint ) {
			return Promise.reject( 'Lores endpoint not set.' );
		}
		
		return callLoresAsync( 'PUT', 'api/lores/1.0/registries/' + registryId, Scopes.MANAGE, {
			objectives: registryContent,
			last_updated: new Date( Date.now() ).toISOString()
		});
	}
	
};
