import { css, html } from 'lit-element/lit-element.js';
import { bodyStandardStyles, heading3Styles } from '@brightspace-ui/core/components/typography/styles.js';
import OutcomeFormatter from './outcome-formatter.js';
import LocalizedLitElement from './localized-element.js';
import 'd2l-button/d2l-button.js';

class OrphanedOutcomesWarning extends LocalizedLitElement {
	
	static get properties() {
		return {
			open: { type: Boolean },
			outcomeLookup: { type: Object },
			_affectedOutcomes: { type: Array },
			outcomesTerm: { type: String },
			canMoveToRoot: { type: Boolean }
		};
	}
	
	static get styles() {
		const componentStyle = css`
			.fade, .modal {
				position: fixed;
				top: 0;
				left: 0;
				width: 100vw;
				height: 100vh;
				overflow: hidden;
			}
			
			.fade {
				background-color: var( --d2l-color-white );
				opacity: 0.7;
				z-index: 1024;
			}
			
			.modal {
				display: flex;
				z-index: 1025;
			}
			
			.centre-h {
				width: 100%;
				display: flex;
			}
			
			.centre-v {
				height: 100%;
				display: flex;
				flex-direction: column;
			}
			
			.dialog {
				display: flex;
				flex-direction: column;
				max-width: 90vw;
				max-height: 90vh;
				padding: 18px 30px 30px 30px;
				border: 1px solid var(--d2l-color-mica);
				border-radius: 8px;
				box-shadow: 0 0 10px 0 rgba( 0, 0, 0, 0.4 );
				background-color: var(--d2l-color-white);
			}
			
			.affected-outcomes {
				overflow-y: auto;
			}
			
			ul, li {
				list-style-type: none;
				padding: 0;
				margin-left: 4ch;
			}
			
			ul:dir(rtl), li:dir(rtl) {
				margin-left: 0;
				margin-right: 4ch;
			}
			
			.flex-spacer {
				flex-grow: 1;
			}
			
			.zero-size {
				width: 0;
				height: 0;
			}
			
			.header {
				display: flex;
			}
			
			.header > h1.d2l-heading-3 {
				white-space: nowrap;
				text-overflow: ellipsis;
				overflow-x: hidden;
				margin: 1px 0 0 0;
			}
			
			.button-tray {
				margin-top: 30px;
			}
			
			.button-spacer {
				display: inline-block;
				width: 18px;
			}
			
			.description {
				min-width: 100%;
				max-width: 550px;
			}
		`;
		
		return [
			bodyStandardStyles,
			heading3Styles,
			componentStyle
		];
	}
	
	constructor() {
		super();
		this.open = false;
		this.outcomeLookup = null;
		this._affectedOutcomes = [];
		this.outcomesTerm = 'standards';
		this.canMoveToRoot = false;
	}
	
	localize( term ) {
		return super.localize( term, { outcome: this.outcomesTerm } );
	}
	
	_focusElement( id ) {
		const target = this.shadowRoot.getElementById( id );
		if( target ) {
			target.focus();
		}
	}
	
	_fireEvent( actionName ) {
		this.dispatchEvent(
			new CustomEvent(
				actionName,
				{ bubbles: false } 
			)
		);
	}
	
	_getRenderedOutcomes( outcomeNodes, renderList ) {
		outcomeNodes.forEach( node => {
			const outcome = this.outcomeLookup[node.id].outcome;
			renderList.push( html`<li>${OutcomeFormatter.render(outcome)}</li>` );
			this._getRenderedOutcomes( node.children, renderList );
		});
	}
	
	_focusCancelButton() {
		this._focusElement( 'cancel-button' );
	}
	
	_focusCloseButton() {
		this._focusElement( 'close-button' );
	}
	
	_cancel() {
		this._fireEvent( 'action-cancel' );
	}
	
	_delete() {
		this._fireEvent( 'action-delete' );
	}
	
	_move() {
		this._fireEvent( 'action-move' );
	}
	
	render() {
		if( !this.open ) {
			return html`<div hidden></div>`;
		}
		
		const renderedOutcomes = [];
		this._getRenderedOutcomes( this._affectedOutcomes, renderedOutcomes );
		
		return html`
			<div class="fade"></div>
			<div class="modal">
				<div class="centre-h">
					<div class="flex-spacer"></div>
					<div class="centre-v">
						<div class="flex-spacer"></div>
						<div class="dialog" role="dialog" aria-modal="true">
							<div class="zero-size" tabindex="0" @focus="${this._focusCancelButton}"></div>
								<div class="header">
									<h1 class="d2l-heading-3">${this.localize('WarningHeader')}</h1>
									<div class="flex-spacer"></div>
									<d2l-button-icon
										id="close-button"
										icon="d2l-tier1:close-small"
										text="${this.localize('CloseDialog')}"
										@click="${this._cancel}"
									></d2l-icon>
								</div>
								<span class="d2l-body-standard description">${this.localize('WarningDescription1')}</span>
								<div class="affected-outcomes d2l-body-standard">
									<ul>
										${renderedOutcomes}
									</ul>
								</div>
								<span class="d2l-body-standard">${this.localize('WarningDescription2')}</span>
								<div class="button-tray">
									<d2l-button id="move-button" ?primary="${this.canMoveToRoot}" ?disabled="${!this.canMoveToRoot}" @click="${this._move}">${this.localize('MoveOrphanedOutcomes')}</d2l-button>
									<div class="button-spacer"></div>
									<d2l-button id="delete-button" @click="${this._delete}">${this.localize('DeleteOrphanedOutcomes')}</d2l-button>
									<div class="button-spacer"></div>
									<d2l-button id="cancel-button" @click="${this._cancel}">${this.localize('Cancel')}</d2l-button>
								</div>
							<div class="zero-size" tabindex="0" @focus="${this._focusCloseButton}"></div>
						</div>
						<div class="flex-spacer"></div>
					</div>
					<div class="flex-spacer"></div>
				</div>
			</div>
		`;
	}
	
	updated( changedProperties ) {
		super.updated( changedProperties );
		if( this.open && changedProperties.has( 'open' ) && !changedProperties.get( 'open' ) ) {
			this.canMoveToRoot ? this._focusElement( 'move-button' ) : this._focusElement( 'delete-button' );
		}
	}
	
} 

customElements.define( 'program-outcomes-picker-warning-modal', OrphanedOutcomesWarning );
