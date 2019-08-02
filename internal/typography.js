import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { css, unsafeCSS } from 'lit-element/lit-element.js';
import 'd2l-typography/d2l-typography.js';

class TypographyProvider extends PolymerElement {
	static get template() {
		return html`
			<style include="d2l-typography"></style>
			<div hidden></div>
		`;
	}
}

customElements.define( 'd2l-typography-provider_' + Math.random(), TypographyProvider );

const provider = new TypographyProvider();
document.body.appendChild( provider );
const typographyRules = [];
for( const rule of provider.shadowRoot.styleSheets[0].cssRules ) {
	typographyRules.push( rule.cssText );
}
document.body.removeChild( provider );

export default css`${unsafeCSS(typographyRules.join( '\n' ))}`;
