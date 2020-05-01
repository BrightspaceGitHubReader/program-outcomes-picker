import { LitElement } from 'lit-element/lit-element.js';
import { LocalizeMixin } from '@brightspace-ui/core/mixins/localize-mixin.js';

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
import zhTW from '../lang/zh-tw.js';

const FALLBACK_LANGUAGE = 'en';
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
	['zh-cn']: zh,
	['zh-tw']: zhTW
};

class LocalizedLitElement extends LocalizeMixin( LitElement ) {
	
	static async getLocalizeResources( langs ) {
		let resolvedLanguage = FALLBACK_LANGUAGE;
		const languageDocument = Object.assign( {}, translations[FALLBACK_LANGUAGE] );
		
		langs.reverse().forEach( lang => {
			if( translations[lang] ) {
				resolvedLanguage = lang;
				Object.assign( languageDocument, translations[lang] );
			}
		});
		
		return {
			language: resolvedLanguage,
			resources: languageDocument
		};
	}
	
}

export default LocalizedLitElement;
