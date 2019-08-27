import Auth from './auth.js';

const delayAsync = function( milliseconds ) {
	if( !milliseconds ) {
		return Promise.resolve();
	}
	return new Promise( resolve => {
		setTimeout( resolve, milliseconds );
	});
};

const _sendRequestWithAuth = function( method, url, options, authToken ) {
	const xhr = new XMLHttpRequest();
	xhr.open( method, url );
	if( authToken ) {
		xhr.setRequestHeader( 'Authorization', 'Bearer ' + authToken );
	}
	
	return new Promise( ( resolve, reject ) => {
		xhr.onreadystatechange = function() {
			if( xhr.readyState !== XMLHttpRequest.DONE ) {
				return;
			}
			
			if( xhr.status < 200 || xhr.status >= 300 ) {
				reject( xhr.statusText );
			}
			
			const contentType = xhr.getResponseHeader( 'Content-Type' );
			if( contentType && contentType.includes( 'application/json' ) ) {
				try {
					resolve( JSON.parse( xhr.responseText ) );
				} catch( exception ) {
					reject( exception );
				}
			} else if( options.expectJson ) {
				reject( new Error( 'Missing JSON Response Body' ) );
			} else {
				resolve( xhr.responseText || null );
			}
		};
		
		if( options.requestBodyJson ) {
			xhr.setRequestHeader( 'Content-Type', 'application/json' );
			xhr.send( JSON.stringify( options.requestBodyJson ) );
		} else {
			xhr.send();
		}
	});
};

const _sendRequest = function( method, url, options ) {
	if( !options.authScope ) {
		return _sendRequestWithAuth( method, url, options, null );
	}
	
	return Auth.getOAuth2TokenAsync( options.authScope ).then( authToken => {
		return _sendRequestWithAuth( method, url, options, authToken );
	});
};

const _sendRequestWithRetries = function( method, url, options, retries ) {
	return _sendRequest( method, url, options ).catch( error => {
		if( retries > 0 ) {
			return delayAsync( options.retryDelay ).then( () => {
				return _sendRequestWithRetries( method, url, options, retries - 1 );
			});
		}
		throw error;
	});
};

export default function( method, url, options ) {
	return _sendRequestWithRetries( method, url, options, options.retry ? +options.retry : 0 );
}
