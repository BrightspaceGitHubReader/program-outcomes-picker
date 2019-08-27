import { LitElement } from 'lit-element/lit-element.js';
import { CurrentLanguage } from './language.js';

class LocalizedLitElement extends LitElement {
	
	constructor() {
		super();
		this._onLanguageChanged = this.performUpdate.bind( this );
	}
	
	connectedCallback() {
		CurrentLanguage.addChangeListener( this._onLanguageChanged );
		super.connectedCallback();
	}
	
	disconnectedCallback() {
		CurrentLanguage.removeChangeListener( this._onLanguageChanged );
		super.disconnectedCallback();
	}
	
	localize( term, options ) {
		return CurrentLanguage.localize( term, options );
	}
	
}

export default LocalizedLitElement;
