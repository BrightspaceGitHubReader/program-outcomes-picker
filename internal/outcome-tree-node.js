import { css, html } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { CheckboxState } from './enums.js';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { Browser, OS } from './browser-check.js';
import LocalizedLitElement from './localized-element.js';
import OutcomeFormatter from './outcome-formatter.js';
import 'd2l-inputs/d2l-input-checkbox.js';
import 'd2l-button/d2l-button-icon.js';
import 'd2l-icons/tier1-icons.js';
import 'd2l-alert/d2l-alert.js';

const CheckboxStateInfo = {
	[ CheckboxState.NOT_CHECKED ]: { checked: false, indeterminate: false, ariaChecked: 'false', checkedTerm: 'CheckedFalse' },
	[ CheckboxState.PARTIAL ]: { checked: true, indeterminate: true, ariaChecked: 'mixed', checkedTerm: 'CheckedMixed' },
	[ CheckboxState.CHECKED ]: { checked: true, indeterminate: false, ariaChecked: 'true', checkedTerm: 'CheckedTrue' },
};

/*
Abstract class extended by program-outcomes-picker-node and asn-outcomes-picker-node
*/

class OutcomeTreeNode extends LocalizedLitElement {
	
	static get properties() {
		return {
			htmlId: { type: String },
			checkboxState: { type: Number },
			_expanded: { type: Boolean },
			_hasFocus: { type: Boolean },
			_depth: { type: Number }
		};
	}
	
	static get style() {
		const componentStyle = css`
			li.outcome-node .outcome {
				display: flex;
				margin: 1px 4px 1px 0;
				border: 2px solid transparent;
				box-sizing: border-box;
				border-radius: 8px;
				padding: 4px;
			}
			
			#tree-root:focus li.outcome-node[data-focus], li.outcome-node:focus {
				outline: none;
			}
			
			#tree-root:focus li.outcome-node[data-focus] > .outcome, li.outcome-node:focus > .outcome {
				border-color: var( --d2l-color-celestine );
				background-color: var( --d2l-color-celestine-plus-2 );
				box-shadow: inset 0 0 0 2px var( --d2l-color-white );
			}
			
			li.outcome-node .outcome-description {
				display: inline-block;
				padding-right: 23px;
			}
			
			li.outcome-node .outcome-description:dir(rtl) {
				padding-left: 23px;
				padding-right: 0;
			}
			
			li.outcome-node .expander, li.outcome-node .expander-spacer {
				flex-shrink: 0;
				width: 18px;
				height: 18px;
				margin-top: 6px;
				margin-right: 8px;
				padding: 0 10px;
			}
			
			li.outcome-node .expander:dir(rtl), li.outcome-node .expander-spacer:dir(rtl) {
				margin-left: 8px;
				margin-right: 0;
			}
			
			li.outcome-node .expander {
				cursor: pointer;
				--d2l-button-icon-min-height: 30px;
				--d2l-button-icon-min-width: 30px;
			}

			li.outcome-node .outcome-children {
				display: flex;
				flex-direction: column;
				margin-left: 32px;
			}
			
			li.outcome-node .outcome-children:dir(rtl) {
				margin-left: 0;
				margin-right: 32px;
			}

			li.outcome-node, li.outcome-node ul {
				 list-style-type: none;
				 padding: 0;
				 margin: 0;
			}
			
			li.outcome-node d2l-input-checkbox {
				position: relative;
				top: calc( 12px - 0.7rem );
				display: inline-block;
				margin-bottom: 0;
			}
			
			li.outcome-node d2l-button-icon {
				position: relative;
				top: -12px;
				left: -12px;
			}
			
			li.outcome-node d2l-button-icon:dir(rtl) {
				transform: scaleX(-1);
			}
			
			li.outcome-node .lock-icon {
				vertical-align: top;
				margin-top: 3px;
				margin-right: 0.5ch;
			}
			
			li.outcome-node span.offscreen {
				position: absolute;
				overflow: hidden;
				width: 1px;
				height: 1px;
				white-space: nowrap;
				left: -10000px;
			}
			
			li.outcome-node span.offscreen:dir(rtl) {
				left: 0;
				right: -10000px;
			}
		`;
		return [ bodyCompactStyles, componentStyle ];
	}
	
	constructor() {
		super();
		this.htmlId = '';
		this.checkboxState = CheckboxState.NOT_CHECKED;
		this._expanded = false;
		this._hasFocus = false;
	}
	
	createRenderRoot() {
		// Render into the light DOM instead of the shadow DOM
		return this;
	}
	
	updated( changedProperties ) {
		// hack to get around hardcoded checkbox alignment
		super.updated( changedProperties );
		const checkboxShadowRoot = (this.querySelector(`#${this.htmlId}\\:checkbox`) || {}).shadowRoot;
		if( checkboxShadowRoot ) {
			const checkboxLabelContainer = checkboxShadowRoot.querySelector( '.d2l-input-checkbox-label' );
			checkboxLabelContainer.style['vertical-align'] = 'top';
			checkboxLabelContainer.style['margin-top'] = '0.2rem';
		}
	}
	
	render() {
		const { checked, indeterminate, ariaChecked, checkedTerm } = CheckboxStateInfo[this.checkboxState];
		const siblings = this._getSiblings();
		
		let ariaExpanded = undefined;
		if( this._hasChildren() ) {
			ariaExpanded = this._expanded ? 'true' : 'false';
		}
		
		const locked = this.getSelectionNode().locked;
		let lockIcon = '';
		if( locked ) {
			lockIcon = html`<d2l-icon icon="d2l-tier1:lock-locked" class="lock-icon"></d2l-icon>`;
		}
		
		let voiceoverFix = undefined;
		if( OS.isMac()  ) {
			const disabledText = locked ? html`, ${this.localize( 'Disabled' )}` : '';
			voiceoverFix = html`
				<span class="offscreen">, ${this.localize( checkedTerm )}${disabledText}</span>
			`;
		}
		
		return html`
			<li
				id="${this.htmlId}"
				class="outcome-node"
				tabindex="-1"
				?data-focus="${this._hasFocus}"
				role="${Browser.isSafari() ? 'treeitem' : 'treeitem checkbox'}"
				aria-expanded="${ifDefined(ariaExpanded)}"
				aria-labelledby="${this.htmlId}:outcome-description"
				aria-level="${this._depth}"
				aria-setsize="${siblings.length}"
				aria-posinset="${1 + siblings.indexOf(this)}"
				aria-checked="${ariaChecked}"
				aria-disabled="${locked}"
				@keydown="${this.handleKeyDownEvent}"
			>
				<div class="outcome">
					${this._renderExpander()}
					<d2l-input-checkbox
						aria-hidden="true"
						tabindex="-1"
						id="${this.htmlId}:checkbox"
						?checked="${checked}"
						?indeterminate="${indeterminate}"
						?disabled="${locked}"
						@change="${this._onCheckboxChanged}"
					>
						<span
							id="${this.htmlId}:outcome-description"
							class="d2l-body-compact outcome-description"
						>${lockIcon}${OutcomeFormatter.render(this.getOutcome())}${voiceoverFix}</span>
					</d2l-input-checkbox>
				</div>
				<div ?hidden="${!this._expanded}" ?aria-hidden="${this._hasFocus && Browser.isSafari()}">
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
	
	getSelectionNode() {
		/* Implement in derived class */
	}
	
	getRoots() {
		/* Implement in derived class */
	}
	
	getOutcome() {
		/* Implement in derived class */
	}
	
	onSetExpanded( isExpanded ) { //eslint-disable-line no-unused-vars
		/* Implement in derived class */
	}
	
	_renderExpander() {
		if( !this._hasChildren() ) {
			return html`<div class="expander-spacer"></div>`;
		}
		
		return html`
			<d2l-button-icon
				icon="${this._expanded ? 'd2l-tier1:arrow-collapse' : 'd2l-tier1:arrow-expand'}"
				text="${this.localize(this._expanded ? 'Expand' : 'Collapse')}"
				tabindex="-1"
				class="expander"
				@click="${this._toggleExpansion}"
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
	
	_onCheckboxChanged( isChecked ) {
		if( isChecked instanceof Event ) {
			isChecked = isChecked.target.checked;
		}
		
		const selectionNode = this.getSelectionNode();
		if( selectionNode.checkboxState ===  CheckboxState.PARTIAL ) {
			isChecked = true;
		}
		isChecked ? selectionNode.select() : selectionNode.deselect();
		this.checkboxState = selectionNode.checkboxState;
		
		const checkbox = this.querySelector(`#${this.htmlId}\\:checkbox`);
		if( checkbox ) {
			const newState = CheckboxStateInfo[selectionNode.checkboxState];
			checkbox.checked = newState.checked;
			checkbox.indeterminate = newState.indeterminate;
		}
		
		if( OS.isMac() ) {
			const notification = document.createElement( 'div' );
			notification.setAttribute( 'role', 'alert' );
			notification.textContent = this.localize( CheckboxStateInfo[selectionNode.checkboxState].checkedTerm );
			document.body.appendChild( notification );
			setTimeout( () => document.body.removeChild( notification ), 500 );
		}
	}
	
	_hasChildren() {
		return this.getSelectionNode().children.length > 0;
	}
	
	_getChildren() {
		return this.getSelectionNode().children.map( node => node.elementRef );
	}
	
	_getParent() {
		const parentData = this.getSelectionNode().parent;
		return parentData ? parentData.elementRef : null;
	}
	
	_getSiblings() {
		const parent = this._getParent();
		return parent ? parent._getChildren() : this.getRoots();
	}
	
	_focusNode() {
		this._hasFocus = true;
		
		let treeRoot = this.parentNode;
		while( treeRoot && treeRoot.id !== 'tree-root' ) {
			treeRoot = treeRoot.parentNode;
		}
		
		if( !treeRoot ) {
			return;
		}
		
		const treeComponent = treeRoot.parentNode.parentNode.host;
		if( treeComponent._focusedNode && treeComponent._focusedNode !== this ) {
			treeComponent._focusedNode._hasFocus = false;
		}
		treeComponent._focusedNode = this;
		
		// VoiceOver workaround
		const li = this.querySelector( '#' + this.htmlId );
		if( li ) {
			if( Browser.isSafari() ) {
				treeRoot.blur();
				const dummyElement = document.createElement( 'div' );
				dummyElement.setAttribute( 'tabindex', '-1' );
				document.body.appendChild( dummyElement );
				dummyElement.focus();
				treeRoot.focus();
				document.body.removeChild( dummyElement );
			} else {
				li.focus();
			}
		}
	}
	
	_focusNext() {
		const siblings = this._getSiblings();
		const index = siblings.indexOf( this );
		if( index >= siblings.length - 1 ) {
			const parent = this._getParent();
			if( parent ) {
				parent._focusNext();
			}
		} else {
			siblings[index + 1]._focusNode();
		}
	}
	
	_focusFirstVisibleDescendant() {
		let node = this;
		while( node._expanded && node._hasChildren() ) {
			node = node._getChildren()[0];
		}
		node._focusNode();
	}
	
	_focusLastVisibleDescendant() {
		let node = this;
		while( node._expanded && node._hasChildren() ) {
			const children = node._getChildren();
			node = children[children.length - 1];
		}
		node._focusNode();
	}
	
	_collapseOrMoveUp( noCollapse ) {
		if( this._expanded && this._hasChildren() && !noCollapse ) {
			this._setExpanded( false );
			return;
		}
		
		const parent = this._getParent();
		if( parent ) {
			parent._focusNode();
		}
	}
	
	_expandOrMoveDown() {
		if( this._hasChildren() ) {
			if( this._expanded ) {
				this._getChildren()[0]._focusNode();
			} else {
				this._setExpanded( true );
			}
		}
	}
	
	handleKeyDownEvent( event ) {
		switch( event.keyCode ) {
			case 38: { // Up Arrow
				const siblings = this._getSiblings();
				const index = siblings.indexOf( this );
				if( index <= 0 ) {
					const parent = this._getParent();
					if( parent ) {
						parent._focusNode();
					}
				} else {
					siblings[index - 1]._focusLastVisibleDescendant();
				}
				break;
			}
			case 40: // Down Arrow
				if( this._expanded && this._hasChildren() ) {
					this._getChildren()[0]._focusNode();
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
				this._onCheckboxChanged( this.checkboxState === CheckboxState.NOT_CHECKED );
				break;
			default:
				return true;
		}
		
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	
}

export default OutcomeTreeNode;
