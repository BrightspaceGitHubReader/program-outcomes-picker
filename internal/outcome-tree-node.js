import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { CheckboxState } from './enums.js';
import { CurrentLanguage } from './language.js';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles.js';
import OutcomeFormatter from './outcome-formatter.js';
import 'd2l-inputs/d2l-input-checkbox.js';
import 'd2l-button/d2l-button-icon.js';
import 'd2l-icons/tier1-icons.js';
import 'd2l-alert/d2l-alert.js';

const CheckboxStateInfo = {
	[ CheckboxState.NOT_CHECKED ]: { checked: false, indeterminate: false, ariaChecked: 'false' },
	[ CheckboxState.PARTIAL ]: { checked: true, indeterminate: true, ariaChecked: 'mixed' },
	[ CheckboxState.CHECKED ]: { checked: true, indeterminate: false, ariaChecked: 'true' },
};

/*
Abstract class extended by program-outcomes-picker-node and asn-outcomes-picker-node
*/

class OutcomeTreeNode extends LitElement {
	
	static get properties() {
		return {
			checkboxState: { type: Number },
			_expanded: { type: Boolean }
		};
	}
	
	static get styles() {
		const componentStyle = css`
			.outcome {
				display: flex;
				margin: 1px 4px 1px 0;
				border: 2px solid transparent;
				box-sizing: border-box;
				border-radius: 8px;
				padding: 4px;
			}
			
			li:focus {
				outline: none;
			}
			
			li:focus > .outcome {
				border-color: var( --d2l-color-celestine );
				background-color: var( --d2l-color-celestine-plus-2 );
				box-shadow: inset 0 0 0 2px var( --d2l-color-white );
			}
			
			.outcome-description {
				display: inline-block;
				padding-right: 23px;
			}
			
			.outcome-description:dir(rtl) {
				padding-left: 23px;
				padding-right: 0;
			}
			
			.expander, .expander-spacer {
				flex-shrink: 0;
				width: 18px;
				height: 18px;
				margin-top: 6px;
				margin-right: 8px;
				padding: 0 10px;
			}
			
			.expander:dir(rtl), .expander-spacer:dir(rtl) {
				margin-left: 8px;
				margin-right: 0;
			}
			
			.expander {
				cursor: pointer;
			}

			.outcome-children {
				display: flex;
				flex-direction: column;
				margin-left: 32px;
			}
			
			.outcome-children:dir(rtl) {
				margin-left: 0;
				margin-right: 32px;
			}

			ul, li {
				 list-style-type: none;
				 padding: 0;
				 margin: 0;
			}
			
			d2l-input-checkbox {
				position: relative;
				top: calc( 12px - 0.7rem );
				display: inline-block;
				margin-bottom: 0;
			}
			
			d2l-button-icon {
				position: relative;
				top: -12px;
				left: -12px;
			}
			
			d2l-button-icon:dir(rtl) {
				transform: scaleX(-1);
			}
		`;
		return [ bodyCompactStyles, componentStyle ];
	}
	
	constructor() {
		super();
		this.checkboxState = CheckboxState.NOT_CHECKED;
		this._expanded = false;
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
	
	updated( changedProperties ) {
		// hack to get around hardcoded checkbox alignment
		super.updated( changedProperties );
		const checkboxLabelContainer = this.shadowRoot.getElementById('checkbox').shadowRoot.querySelector( '.d2l-input-checkbox-label' );
		checkboxLabelContainer.style['vertical-align'] = 'top';
		checkboxLabelContainer.style['margin-top'] = '0.2rem';
	}
	
	render() {
		const { checked, indeterminate, ariaChecked } = CheckboxStateInfo[this.checkboxState];
		const siblings = this._getSiblings();
		
		let ariaExpanded = undefined;
		if( this.hasChildren() ) {
			ariaExpanded = this._expanded ? 'true' : 'false';
		}
		
		const outcome = this.getOutcome();
		return html`
			<li
				id="focusable-node"
				tabindex="-1"
				role="treeitem"
				aria-expanded="${ifDefined(ariaExpanded)}"
				aria-labelledby="outcome-description"
				aria-setsize="${siblings.length}"
				aria-posinset="${1 + siblings.indexOf(this)}"
				aria-checked="${ariaChecked}"
				aria-activedescendant="checkbox"
				@keydown="${this._onKeyDown}"
				@mousedown="${event => event.preventDefault()}"
			>
				<div class="outcome">
					${this._renderExpander()}
					<d2l-input-checkbox
						role="checkbox"
						aria-checked="${ariaChecked}"
						tabindex="-1"
						id="checkbox"
						?checked="${checked}"
						?indeterminate="${indeterminate}"
						@change="${ev => this.onCheckboxChanged( ev.target.checked )}"
						@focusin="${this._focusNode}"
					>
						<span id="outcome-description" class="d2l-body-compact outcome-description">${OutcomeFormatter.render(outcome)}</span>
					</d2l-input-checkbox>
				</div>
				<div ?hidden="${!this._expanded}">
					<ul class="outcome-children" role="group">
						${this.renderChildren()}
					</ul>
				</div>
			</li>
		`;
	}
	
	renderChildren() {
		/* Implement in derived class */
	}
	
	getChildren() {
		/* Implement in derived class */
	}
	
	getParent() {
		/* Implement in derived class */
	}
	
	getRoots() {
		/* Implement in derived class */
	}
	
	getOutcome() {
		/* Implement in derived class */
	}
	
	onCheckboxChanged( isChecked ) { //eslint-disable-line no-unused-vars
		/* Implement in derived class */
	}
	
	onSetExpanded( isExpanded ) { //eslint-disable-line no-unused-vars
		/* Implement in derived class */
	}
	
	hasChildren() {
		/* Optionally override in derived class */
		return !!this.getChildren().length;
	}
	
	_renderExpander() {
		if( !this.hasChildren() ) {
			return html`<div class="expander-spacer"></div>`;
		}
		
		return html`
			<d2l-button-icon
				icon="${this._expanded ? 'd2l-tier1:arrow-collapse' : 'd2l-tier1:arrow-expand'}"
				text="${CurrentLanguage.localize(this._expanded ? 'Expand' : 'Collapse')}"
				tabindex="-1"
				class="expander"
				@click="${this._toggleExpansion}"
				@focusin="${this._focusNode}"
			></d2l-icon>
		`;
	}
	
	_setExpanded( isExpanded ) {
		this._expanded = isExpanded;
		this.onSetExpanded( isExpanded );
	}
	
	_toggleExpansion() {
		this._setExpanded( !this._expanded );
	}
	
	_isRtl() {
		return window.getComputedStyle( this ).direction === 'rtl';
	}
	
	_getSiblings() {
		const parent = this.getParent();
		return parent ? parent.getChildren() : this.getRoots();
	}
	
	_focusNode() {
		const node = this.shadowRoot.getElementById('focusable-node');
		if( node ) {
			node.focus();
		}
	}
	
	_focusNext() {
		const siblings = this._getSiblings();
		const index = siblings.indexOf( this );
		if( index >= siblings.length - 1 ) {
			const parent = this.getParent();
			if( parent ) {
				parent._focusNext();
			}
		} else {
			siblings[index + 1]._focusNode();
		}
	}
	
	_focusFirstVisibleDescendant() {
		let node = this;
		while( node._expanded && node.hasChildren() ) {
			node = node.getChildren()[0];
		}
		node._focusNode();
	}
	
	_focusLastVisibleDescendant() {
		let node = this;
		while( node._expanded && node.hasChildren() ) {
			const children = node.getChildren();
			node = children[children.length - 1];
		}
		node._focusNode();
	}
	
	_collapseOrMoveUp( noCollapse ) {
		if( this._expanded && this.hasChildren() && !noCollapse ) {
			this._setExpanded( false );
			return;
		}
		
		const parent = this.getParent();
		if( parent ) {
			parent._focusNode();
		}
	}
	
	_expandOrMoveDown() {
		if( this.hasChildren() ) {
			if( this._expanded ) {
				this.getChildren()[0]._focusNode();
			} else {
				this._setExpanded( true );
			}
		}
	}
	
	_onKeyDown( event ) {
		switch( event.keyCode ) {
			case 38: { // Up Arrow
				const siblings = this._getSiblings();
				const index = siblings.indexOf( this );
				if( index <= 0 ) {
					const parent = this.getParent();
					if( parent ) {
						parent._focusNode();
					}
				} else {
					siblings[index - 1]._focusLastVisibleDescendant();
				}
				break;
			}
			case 40: // Down Arrow
				if( this._expanded && this.hasChildren() ) {
					this.getChildren()[0]._focusNode();
				} else {
					this._focusNext();
				}
				break;
			case 39: // Right Arrow
				this._isRtl() ? this._collapseOrMoveUp( event.ctrlKey ) : this._expandOrMoveDown();
				break;
			case 37: // Left Arrow
				this._isRtl() ? this._expandOrMoveDown() : this._collapseOrMoveUp( event.ctrlKey );
				break;
			case 36: // Home
				if( event.ctrlKey ) {
					this.getRoots()[0]._focusFirstVisibleDescendant();
				} else {
					this._getSiblings()[0]._focusNode();
				}
				break;
			case 35: { // End
				if( event.ctrlKey ) {
					const roots = this.getRoots();
					roots[roots.length - 1]._focusLastVisibleDescendant();
				} else {
					const siblings = this._getSiblings();
					siblings[siblings.length - 1]._focusNode();
				}
				break;
			}
			case 32: // Space
			case 13: // Enter
				this.onCheckboxChanged( this.checkboxState === CheckboxState.NOT_CHECKED );
				break;
			default:
				return;
		}
		
		event.preventDefault();
		event.stopPropagation();
	}
	
}

export default OutcomeTreeNode;
