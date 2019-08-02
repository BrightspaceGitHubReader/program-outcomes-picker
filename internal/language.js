import IntlMessageFormat from 'intl-messageformat/src/main.js';
import ar from '../lang/ar.js';
import de from '../lang/de.js';
import en from '../lang/en.js';
import es from '../lang/es.js';
import fr from '../lang/fr.js';
import ja from '../lang/ja.js';
import ko from '../lang/ko.js';
import nb from '../lang/nb.js';
import nl from '../lang/nl.js';
import pt from '../lang/pt.js';
import sv from '../lang/sv.js';
import tr from '../lang/tr.js';
import zh from '../lang/zh.js';
import zhTW from '../lang/zh-TW.js';

const translations = {
	ar: ar,
	de: de,
	en: en,
	es: es,
	fr: fr,
	ja: ja,
	ko: ko,
	nb: nb,
	nl: nl,
	pt: pt,
	sv: sv,
	tr: tr,
	zh: zh,
	['zh-CN']: zh,
	['zh-TW']: zhTW
};

const getLangTagInfo = function( langTag ) {
	if( !langTag ) {
		return null;
	}
	
	const parts = langTag.split( '-' );
	const baseLang = parts[0].toLowerCase();
	let fullLang = baseLang;
	if( parts[1] ) {
		fullLang = baseLang + '-' + parts[1].toUpperCase();
	}
	
	return {
		base: baseLang,
		full: fullLang
	};
};

class LanguagePack {
	
	constructor( preferredLanguage, fallbackLanguage ) {
		this._update( preferredLanguage, fallbackLanguage );
	}
	
	_tryAddLanguage( language ) {
		if( translations[language] && !this._langPreferenceOrder.includes( language ) ) {
			this._langPreferenceOrder.push( language );
		}
	}
	
	_update( newPreferredLanguage, newFallbackLanguage ) {
		this._langPreferenceOrder = [];
		
		let langInfo = getLangTagInfo( newPreferredLanguage );
		if( langInfo ) {
			this._tryAddLanguage( langInfo.full );
			this._tryAddLanguage( langInfo.base );
		}
		
		langInfo = getLangTagInfo( newFallbackLanguage );
		if( langInfo ) {
			this._tryAddLanguage( langInfo.full );
			this._tryAddLanguage( langInfo.base );
		}
		
		this._tryAddLanguage( 'en-US' );
		this._tryAddLanguage( 'en' );
	}
	
	localize( termName, formatArgs ) {
		for( const language of this._langPreferenceOrder ) {
			const translation = translations[language][termName];
			if( translation ) {
				const formatter = new IntlMessageFormat( translation, language );
				return formatter.format( formatArgs || {} );
			}
		}
		
		console.warn( `Missing lang term: '${termName}'` ); //eslint-disable-line no-console
		return '';
	}
	
}

// Language Pack that auto-updates with the document language
const liveLanguage = new LanguagePack();
const _changeListeners = new Set();

liveLanguage.addChangeListener = function( callback ) {
	_changeListeners.add( callback );
};

liveLanguage.removeChangeListener = function( callback ) {
	_changeListeners.delete( callback );
};

const updateLiveLanguage = function() {
	liveLanguage._update(
		window.document.documentElement.getAttribute( 'lang' ),
		window.document.documentElement.getAttribute( 'data-lang-default' )
	);
	_changeListeners.forEach( callback => callback( liveLanguage ) );
};

new MutationObserver( updateLiveLanguage ).observe(
	window.document.documentElement,
	{
		attributeFilter: [ 'lang', 'data-lang-default' ],
		attributeOldValue: false,
		attributes: true,
		characterData: false,
		childList: false,
		subtree: false
	}
);

updateLiveLanguage();

export {
	LanguagePack,
	liveLanguage as CurrentLanguage
};
