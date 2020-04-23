import sendRequest from './send-request.js';

let host = null;
const scope = 'core:*:*';

export default {

	setHost: function( valenceHost ) {
		host = valenceHost;
		if( !valenceHost.endsWith( '/' ) ) {
			host += '/';
		}
	},

	getAlignedOutcomesStatus: function( registryId ) {
		return sendRequest( 'GET', `${host}d2l/api/le/lo/registry/${registryId}/alignedOutcomesStatus`, {
			authScope: scope,
			expectJson: true
		});
	},

	getRegistrySources: function( registryIds ) {
		return sendRequest( 'POST', `${host}d2l/api/le/unstable/lo/GetRegistrySources`, {
			authScope: scope,
			expectJson: true,
			requestBodyJson: registryIds
		} );
	}
    
};
