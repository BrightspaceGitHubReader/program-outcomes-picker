import { css, html } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import OutcomeTreeNode from './outcome-tree-node.js';
import LocalizedLitElement from './localized-element.js';
import Browser from './browser-check.js';

class OutcomeTree extends LocalizedLitElement {
	
	static get properties() {
		return {
			_focusedNode: { type: OutcomeTreeNode }
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
		return html`
			<div class="outcomes-tree">
				<ul
					id="tree-root"
					role="tree"
					aria-activedescendant="${ifDefined((this._focusedNode || {}).htmlId)}"
					aria-multiselectable="${ifDefined(Browser.isSafari() ? 'true' : undefined)}"
					tabindex="0"
					@keydown="${this._onKeyDown}"
					@focus="${this._onFocus}"
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
		if( !Browser.isSafari() && this._focusedNode ) {
			this._focusedNode._focusNode();
		}
	}
	
}

export default OutcomeTree;
