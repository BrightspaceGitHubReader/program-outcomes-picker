import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { CheckboxState } from './enums.js';
import { CurrentLanguage } from './language.js';
import OutcomeFormatter from './outcome-formatter.js';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles.js';
import 'd2l-inputs/d2l-input-checkbox.js';
import 'd2l-button/d2l-button-icon.js';
import 'd2l-icons/tier1-icons.js';
import 'd2l-alert/d2l-alert.js';

const CheckboxStateInfo = {
	[ CheckboxState.NOT_CHECKED ]: { checked: false, indeterminate: false, ariaChecked: 'false' },
	[ CheckboxState.PARTIAL ]: { checked: true, indeterminate: true, ariaChecked: 'mixed' },
	[ CheckboxState.CHECKED ]: { checked: true, indeterminate: false, ariaChecked: 'true' },
};

class OutcomeNode extends LitElement {
	
	static get properties() {
		return {
			checkboxState: { type: Number },
			_expanded: { type: Boolean },
			_programNode: { type: Object },
			_dataState: { type: Object }
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
			
			.outcome:focus {
				border-color: var( --d2l-color-celestine );
				background-color: var( --d2l-color-celestine-plus-2 );
				box-shadow: inset 0 0 0 2px var( --d2l-color-white );
				outline: none;
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
	
	_renderChild( programNode ) {
		return html`
			<li>
				<program-outcomes-picker-node
					tabindex="-1"
					.checkboxState="${programNode.checkboxState}"
					._programNode="${programNode}"
					._dataState="${this._dataState}"
				></program-outcomes-picker-node>
			</li>
		`;
	}
	
	_renderChildren() {
		const children = this._programNode.children.map( this._renderChild.bind( this ) );
		return html`
			<ul class="outcome-children" role="group">
				${children}
			</ul>
		`;
	}
	
	update( changedProperties ) {
		super.update( changedProperties );
		this._programNode.elementRef = this;
	}
	
	updated( changedProperties ) {
		const programRegistryId = this._dataState.programState.registryId;
		const outcomeId = this._programNode.outcomeId;
		
		// Resync checkbox state and expansion state after changing programs
		this.checkboxState = this._programNode.checkboxState;
		this._expanded = !!this._dataState.expandState[programRegistryId][outcomeId];
		
		super.updated( changedProperties );
		
		// hack to get around hardcoded checkbox alignment
		const checkboxLabelContainer = this.shadowRoot.getElementById('checkbox').shadowRoot.querySelector( '.d2l-input-checkbox-label' );
		checkboxLabelContainer.style['vertical-align'] = 'top';
		checkboxLabelContainer.style['margin-top'] = '0.2rem';
	}
	
	connectedCallback() {
		this._programNode.elementRef = this;
		this.checkboxState = this._programNode.checkboxState;
		CurrentLanguage.addChangeListener( this._onLanguageChanged );
		super.connectedCallback();
	}
	
	_renderExpander() {
		if( !this._programNode.children.length ) {
			return html`<div class="expander-spacer"></div>`;
		}
		
		return html`
			<d2l-button-icon
				icon="${this._expanded ? 'd2l-tier1:arrow-collapse' : 'd2l-tier1:arrow-expand'}"
				text="${CurrentLanguage.localize(this._expanded ? 'Expand' : 'Collapse')}"
				tabindex="-1"
				class="expander"
				@click="${this._toggleExpansion}"
			></d2l-icon>
		`;
	}
	
	render() {
		const { checked, indeterminate, ariaChecked } = CheckboxStateInfo[this.checkboxState];
		const siblings = this._getSiblings();
		
		let ariaExpanded = undefined;
		if( this._programNode.children.length ) {
			ariaExpanded = this._expanded ? 'true' : 'false';
		}
		
		const outcome = this._dataState.mergedProgramForestMap[this._programNode.outcomeId].outcome;
		return html`
			<div
				id="focusable-node"
				tabindex="-1"
				class="outcome"
				role="treeitem checkbox"
				aria-expanded="${ifDefined(ariaExpanded)}"
				aria-checked="${ariaChecked}"
				aria-labelledby="outcome-description"
				aria-setsize="${siblings.length}"
				aria-posinset="${1 + siblings.indexOf(this)}"
				@keydown="${this._onKeyDown}"
				@mousedown="${event => event.preventDefault()}"
			>
				${this._renderExpander()}
				<d2l-input-checkbox
					tabindex='-1'
					id="checkbox"
					?checked="${checked}"
					?indeterminate="${indeterminate}"
					@change="${this._onCheckboxChanged}"
					aria-hidden="true"
				>
					<span id="outcome-description" class="d2l-body-compact outcome-description">${OutcomeFormatter.render(outcome)}</span>
				</d2l-input-checkbox>
			</div>
			<div ?hidden="${!this._expanded}">
				${this._renderChildren()}
			</div>
		`;
	}
	
	_onCheckboxChanged( event ) {
		if( event.target.checked ) {
			this._programNode.select();
		} else {
			this._programNode.deselect();
		}
	}

	_toggleExpansion() {
		this._setExpanded( !this._expanded );
	}
	
	_setExpanded( isExpanded ) {
		const programRegistryId = this._dataState.programState.registryId;
		const outcomeId = this._programNode.outcomeId;
		
		this._expanded = isExpanded;
		this._dataState.expandState[programRegistryId][outcomeId] = isExpanded;
	}
	
	_getSiblings() {
		if( this._programNode.parent ) {
			return this._programNode.parent.children.map( pn => pn.elementRef );
		} else {
			return this._dataState.programState.forest.map( pn => pn.elementRef );
		}
	}
	
	_focusNext() {
		const siblings = this._getSiblings();
		const index = siblings.indexOf( this );
		if( index >= siblings.length - 1 ) {
			if( this._programNode.parent ) {
				this._programNode.parent.elementRef._focusNext();
			}
		} else {
			siblings[index + 1]._focusNode();
		}
	}
	
	_focusFirstVisibleDescendant() {
		let programNode = this._programNode;
		while( programNode.children.length && programNode.elementRef._expanded ) {
			programNode = programNode.children[0];
		}
		programNode.elementRef._focusNode();
	}
	
	_focusLastVisibleDescendant() {
		let programNode = this._programNode;
		while( programNode.children.length && programNode.elementRef._expanded ) {
			programNode = programNode.children[programNode.children.length - 1];
		}
		programNode.elementRef._focusNode();
	}
	
	_focusNode() {
		const node = this.shadowRoot.getElementById('focusable-node');
		if( node ) {
			node.focus();
		}
	}
	
	_collapseOrMoveUp( noCollapse ) {
		if( this._expanded && this._programNode.children.length && !noCollapse ) {
			this._setExpanded( false );
		} else if( this._programNode.parent ) {
			const parentComponent = this._programNode.parent.elementRef;
			parentComponent._focusNode();
		}
	}
	
	_expandOrMoveDown() {
		if( this._programNode.children.length ) {
			if( this._expanded ) {
				this._programNode.children[0].elementRef._focusNode();
			} else {
				this._setExpanded( true );
			}
		}
	}
	
	_isRtl() {
		return window.getComputedStyle( this ).direction === 'rtl';
	}
	
	_onKeyDown( event ) {
		switch( event.keyCode ) {
			case 38: { // Up Arrow
				const siblings = this._getSiblings();
				const index = siblings.indexOf( this );
				if( index <= 0 ) {
					if( this._programNode.parent ) {
						this._programNode.parent.elementRef._focusNode();
					}
				} else {
					siblings[index - 1]._focusLastVisibleDescendant();
				}
				break;
			}
			case 40: // Down Arrow
				if( this._expanded && this._programNode.children.length ) {
					this._programNode.children[0].elementRef._focusNode();
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
					this._dataState.programState.forest[0]._focusFirstVisibleDescendant();
				} else {
					this._getSiblings()[0]._focusNode();
				}
				break;
			case 35: { // End
				if( event.ctrlKey ) {
					const roots = this._dataState.programState.forest;
					roots[roots.length - 1]._focusLastVisibleDescendant();
				} else {
					const siblings = this._getSiblings();
					siblings[siblings.length - 1]._focusNode();
				}
				break;
			}
			case 32: // Space
			case 13: // Enter
				if( this.checkboxState === CheckboxState.NOT_CHECKED ) {
					this._programNode.select();
				} else {
					this._programNode.deselect();
				}
				break;
			default:
				return;
		}
		
		event.preventDefault();
		event.stopPropagation();
	}
	
}

customElements.define( 'program-outcomes-picker-node', OutcomeNode );
