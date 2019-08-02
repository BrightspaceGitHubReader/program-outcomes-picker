const jwtCache = {};

const isExpired = function( jwt ) { // or within 30 seconds of expiring
	return !jwt || Date.now() >= 1000 * ( jwt.expires_at - 30 );
};

const getXsrfTokenAsync = function() {
	return new Promise( ( resolve, reject ) => {
		const xhr = new XMLHttpRequest();
		xhr.open( 'GET', '/d2l/lp/auth/xsrf-tokens' );
		xhr.onreadystatechange = function() {
			if( xhr.readyState !== XMLHttpRequest.DONE ) {
				return;
			}
			
			if( xhr.status !== 200 ) {
				reject( xhr.statusText );
				return;
			}
			
			try {
				resolve( JSON.parse( xhr.responseText ).referrerToken );
			} catch( exception ) {
				reject( exception );
			}
		};
		xhr.send();
	});
};

const getJwtAsync = function( xsrf, scope ) {
	return new Promise( ( resolve, reject ) => {
		const xhr = new XMLHttpRequest();
		xhr.open( 'POST', '/d2l/lp/auth/oauth2/token' );
		xhr.setRequestHeader( 'X-Csrf-Token', xsrf );
		xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
		xhr.onreadystatechange = function() {
			if( xhr.readyState !== XMLHttpRequest.DONE ) {
				return;
			}
			
			if( xhr.status !== 200 ) {
				reject( xhr.statusText );
				return;
			}
			
			try {
				resolve( JSON.parse( xhr.responseText ) );
			} catch( exception ) {
				reject( exception );
			}
		};
		xhr.send( 'scope=' + scope );
	});
};

export default {
	getOAuth2TokenAsync: function( scope ) {
		scope = scope || '*:*:*';
		if( !isExpired( jwtCache[scope] ) ) {
			return Promise.resolve( jwtCache[scope].access_token );
		}
		
		return getXsrfTokenAsync().then(
			xsrf => getJwtAsync( xsrf, scope )
		).then( jwt => {
			jwtCache[scope] = jwt;
			return jwt.access_token;
		});
	}
};
