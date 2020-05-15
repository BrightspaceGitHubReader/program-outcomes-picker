import { css, html } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { Browser } from './browser-check.js';
import OutcomeTreeNode from './outcome-tree-node.js';
import LocalizedLitElement from './localized-element.js';

class OutcomeTree extends LocalizedLitElement {
	
	static get properties() {
		return {
			_focusedNode: { type: OutcomeTreeNode },
			_hasFocus: { type: Boolean, value: false }
		};
	}
	
	static get styles() {
		const componentStyle = css`
			.outcomes-tree {
				overflow-y: auto;
				overflow-x: hidden;
			}

			#tree-root {
				display: flex;
				flex-direction: column;
				list-style-type: none;
				padding: 0;
			}
			
		`;
		
		return [
			OutcomeTreeNode.style,
			componentStyle
		];
	}
	
	firstUpdated( changedProperties ) {
		super.firstUpdated( changedProperties );
		this.addEventListener( 'blur', () => { this._hasFocus = false; } );
	}
	
	updated( changedProperties ) {
		super.updated( changedProperties );
		const firstNode = this._getFirstNode();
		if( firstNode && ( !this._focusedNode || !this.shadowRoot.contains( this._focusedNode ) ) ) {
			this._focusedNode = firstNode;
			firstNode._focusNode();
		}
	}
	
	_renderTree() {
		/* Implement in derived class */
	}
	
	_getFirstNode() {
		/* Implement in derived class */
	}
	
	render() {
		let activeDescendant = undefined;
		if( Browser.isSafari() && this._focusedNode ) {
			activeDescendant = this._focusedNode.htmlId;
		}
		
		const tabIndex = (Browser.isChrome() && this._hasFocus) ? -1 : 0;
		return html`
			<div class="outcomes-tree">
				<ul
					id="tree-root"
					role="tree"
					aria-activedescendant="${ifDefined(activeDescendant)}"
					tabindex="${tabIndex}"
					@keydown="${this._onKeyDown}"
					@focus="${this._onFocus}"
					@blur="${this._onBlur}"
				>
					${this._renderTree()}
				</ul>
			</div>
		`;
	}
	
	_onKeyDown( event ) {
		if( this._focusedNode ) {
			this._focusedNode.handleKeyDownEvent( event );
		}
	}
	
	_onFocus() {
		this._hasFocus = true;
		if( !Browser.isSafari() && this._focusedNode ) {
			this._focusedNode._focusNode();
		}
	}
	
}

export default OutcomeTree;
