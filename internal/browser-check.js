const browserTable = {
	firefox: {
		require: /(?:Firefox|Seamonkey)\/\d/
	},
	chrome: {
		require: /Chrom(:?e|ium)\/\d/,
		exclude: /Edge\/\d/
	},
	safari: {
		require: /Safari\/\d+/,
		exclude: /(?:Edge|Chrom(:?e|ium))\/\d/
	},
	edge: {
		require: /Edge\/\d/
	},
	internetExplorer: {
		require: /(?:Trident\/\d|; MSIE \d+;)/
	},
	operaNew: {
		require: /OPR\/\d/
	},
	operaOld: {
		require: /Opera\/\d/
	}
};

const operatingSystemTable = {
	windows: /\(Windows/,
	mac: /Macintosh;/,
	linux: /Linux/
};

const isBrowser = function( browser ) {
	const browserChecker = browserTable[browser];
	const uaString = window.navigator.userAgent;
	
	return browserChecker.require.test( uaString ) && (
		!browserChecker.exclude ||
		!browserChecker.exclude.test( uaString )
	);
};

const isOS = function( os ) {
	return operatingSystemTable[os].test( window.navigator.userAgent );
};

export const Browser = {
	isFirefox: isBrowser.bind( null, 'firefox' ),
	isChrome: isBrowser.bind( null, 'chrome' ),
	isEdge: isBrowser.bind( null, 'edge' ),
	isIE: isBrowser.bind( null, 'internetExplorer' ),
	isSafari: isBrowser.bind( null, 'safari' ),
	isOpera: () => isBrowser( 'operaNew' ) || isBrowser( 'operaOld' ),
	isMicrosoftBrowser: () => isBrowser( 'edge' ) || isBrowser( 'internetExplorer' ),
	isOldOpera: isBrowser.bind( null, 'operaOld' ),
	isNewOpera: isBrowser.bind( null, 'operaNew' )
};

export const OS = {
	isWindows: isOS.bind( null, 'windows' ),
	isMac: isOS.bind( null, 'mac' ),
	isLinux: isOS.bind( null, 'linux' )
};
