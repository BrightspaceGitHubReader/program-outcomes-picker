import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { createNode, TreeBehaviour } from './internal/selection-state-node.js';
import { CheckboxState } from './internal/enums.js';
import Lores from './internal/lores.js';
import Valence from './internal/valence.js';
import LocalizedLitElement from './internal/localized-element.js';
import './internal/delete-outcomes-picker-tree.js';
import './internal/orphaned-outcomes-warning.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui/core/components/icons/icon.js';
import 'd2l-alert/d2l-alert.js';

class DeleteOutcomesPicker extends LocalizedLitElement {
	
	static get properties() {
		return {
			registryId: { type: String, attribute: 'registry-id' },
			loresEndpoint: { type: String, attribute: 'lores-endpoint' },
			outcomesTerm: { type: String, attribute: 'outcome-term' },
			noHeader: { type: Boolean, attribute: 'no-header' },
			valenceHost: { type: String, attribute: 'valence-host' },
			
			_dataState: { type: Object },
			_loading: { type: Boolean },
			_errored: { type: Boolean },
			_numSelected: { type: Number, value: 0 }
		};
	}
	
	static get styles() {
		const componentStyle = css`
			.main {
				display: flex;
				flex-direction: column;
				height: 100%;
			}
			
			.header {
				display: flex;
				align-items: center;
				border-bottom: 1px solid var(--d2l-color-mica);
				padding: 0 40px;
			}
			
			.header > h1 {
				white-space: nowrap;
				text-overflow: ellipsis;
				overflow-x: hidden;
			}
			
			d2l-alert {
				margin: 4px;
				width: calc( 100% - 8px );
			}
			
			.body {
				display: flex;
				flex-direction: column;
				flex-grow: 1;
				padding: 0 40px;
				height: 0;
				overflow-y: auto;
			}
			
			delete-outcomes-picker-tree {
				flex-grow: 1;
				overflow-y: auto;
				min-height: 200px;
			}
			
			.button-tray {
				border-top: 1px solid var(--d2l-color-mica);
				padding: 11px 40px;
				display: flex;
			}
			
			.button-spacer {
				display: inline-block;
				width: 13px;
			}
			
			#selection-indicator {
				flex-grow: 1;
				font-size: var(--d2l-body-compact-text_-_font-size);
				text-align: end;
				align-self: center;
			}
		`;
		
		return [
			heading2Styles,
			componentStyle
		];
	}
	
	constructor() {
		super();
		this.registryId = null;
		this.loresEndpoint = null;
		this.outcomesTerm = 'standards';
		this.valenceHost = window.location.origin;
		this._loading = true;
		this._errored = false;
		
		this._dataState = {
			outcomesMap: new Map(),
			stateNodes: []
		};
		
		this.addEventListener( 'd2l-outcome-selection-state-changed', this._countSelected.bind( this ) );
	}
	
	connectedCallback() {
		Lores.setEndpoint( this.loresEndpoint );
		Valence.setHost( this.valenceHost );
		super.connectedCallback();
	}
	
	localize( term, params ) {
		return super.localize(
			term,
			Object.assign( {}, { outcome: this.outcomesTerm }, params || {} )
		);
	}
	
	_onAlertClosed() {
		this._errored = false;
	}
	
	_countSelected( event ) {
		const countRecursive = function( nodes ) {
			return nodes.reduce( (count, node) => {
				if( node.checkboxState === CheckboxState.NOT_CHECKED ) {
					return count;
				} else {
					return count + 1 + countRecursive( node.children );
				}
			}, 0 );
		};
		this._numSelected = countRecursive( this._dataState.stateNodes );
		event.stopPropagation();
	}
	
	_renderAlert() {
		if( !this._errored ) {
			return '';
		}
		return html`
			<d2l-alert
				class="d2l-body-standard"
				type="critical"
				has-close-button
				@d2l-alert-closed="${this._onAlertClosed}"
			>
				<span>${this.localize('ConnectionError')}</span>
			</d2l-alert>
		`;
	}
	
	_renderHeader() {
		if( this.noHeader ) {
			return '';
		}
		return html`
			<div class="header">
				<h1 class="d2l-heading-2">${this.localize('TitleDelete')}</h1>
				<div style="flex-grow: 1"></div>
				<d2l-button-icon
					icon="d2l-tier3:close-thick"
					text="${this.localize('Close')}"
					@click="${this._close}"
				></d2l-button-icon>
			</div>
		`;
	}
	
	_renderSelectCount() {
		if( !this._numSelected ) {
			return '';
		}
		
		const countString = this.localize('NumSelected', { 'num': this._numSelected });
		return html`<span id="selection-indicator">${countString}</span>`;
	}
	
	_suppressEventBehaviour( event ) {
		event.preventDefault();
	}
	
	render() {
		if( this._loading ) {
			return html`
				${this._renderAlert()}
				<div style="width: 100%; height: 100%; display: flex;" aria-busy="true">
					<div style="flex-grow: 1"></div>
					<div style="display: flex; flex-direction: column;">
						<div style="flex-grow: 1"></div>
						<d2l-loading-spinner size="200"></d2l-loading-spinner>
						<div style="flex-grow: 2"></div>
					</div>
					<div style="flex-grow: 1"></div>
				</div>
			`;
		}
		
		return html`
			<div class="main">
				${this._renderHeader()}
				<div class="body">
					${this._renderAlert()}
					<delete-outcomes-picker-tree
						._dataState="${this._dataState}"
						@mousedown="${this._suppressEventBehaviour}"
					></delete-outcomes-picker-tree>
				</div>
				<div class="button-tray">
					<d2l-button primary @click="${this._confirmDelete}">${this.localize('Delete')}</d2l-button>
					<div class="button-spacer"></div>
					<d2l-button @click="${this._close}">${this.localize('Cancel')}</d2l-button>
					${this._renderSelectCount()}
				</div>
			</div>
		`;
	}
	
	updated( changedProperties ) {
		super.updated( changedProperties );
		if(
			changedProperties.has( 'loresEndpoint' ) ||
			changedProperties.has( 'registryId' ) ||
			changedProperties.has( 'valenceHost' )
		) {
			this._loading = true;
			this._errored = false;
			this._dataState = {
				outcomesMap: new Map(),
				stateNodes: []
			};
			
			Lores.setEndpoint( this.loresEndpoint );
			Valence.setHost( this.valenceHost );
			Promise.all([
				Lores.fetchRegistryAsync( this.registryId ),
				Lores.getOwnedLockedOutcomesAsync( this.registryId ),
				Valence.getAlignedOutcomesStatus( this.registryId )
			]).then( responses => {
				const lockedOutcomes = new Set();
				const assessedOutcomes = new Set();
				responses[1].forEach( outcomeId => lockedOutcomes.add( outcomeId ) );
				responses[2].forEach( info => info.HasAssessments && assessedOutcomes.add( info.ObjectiveId ) );
				this._dataState.stateNodes = this._buildState( responses[0].objectives, lockedOutcomes, assessedOutcomes, null );
				this._loading = false;
			}).catch( err => {
				console.error( err );  //eslint-disable-line no-console
				this._errored = true;
				this._loading = false;
			});
		}

	}
	
	_buildState( outcomes, lockedOutcomes, assessedOutcomes, parent ) {
		return outcomes.map( outcome => {
			this._dataState.outcomesMap.set( outcome.id, outcome );
			const stateNode = createNode( TreeBehaviour.CascadesDown, {
				outcomeId: outcome.id,
				parent: parent,
				children: null, // gets set after children are processed
				checkboxState: CheckboxState.NOT_CHECKED,
				locked: lockedOutcomes.has( outcome.id ),
				assessed: assessedOutcomes.has( outcome.id )
			});
			stateNode.children = this._buildState( outcome.children, lockedOutcomes, assessedOutcomes, stateNode );
			stateNode.disabled = stateNode.locked || stateNode.assessed || stateNode.children.some( child => child.disabled );
			return stateNode;
		});
	}
	
	_buildUpdate( stateNodes, /*out*/ updateJson ) {
		let numDeleted = 0;
		stateNodes.forEach( node => {
			if( node.checkboxState === CheckboxState.CHECKED ) {
				numDeleted += this._getTreeSize( node );
				return;
			}
			
			const updateNode = {
				id: node.outcomeId,
				children: []
			};
			numDeleted += this._buildUpdate( node.children, updateNode.children );
			updateJson.push( updateNode );
		});
		return numDeleted;
	}
	
	_getTreeSize( node ) {
		return node.children.reduce( (count, child) => count + this._getTreeSize( child ), 1 );
	}
	
	_deleteAsync( registryId, updateJson ) {
		this._loading = true;
		return Lores.updateRegistryAsync( registryId, updateJson ).then( () => {
			this._loading = false;
		}).catch( err => {
			this._loading = false;
			this._errored = true;
			throw err;
		});
	}
	
	_confirmDelete() {
		const registryId = this.registryId;
		const updateJson = [];
		const numDeleted = this._buildUpdate( this._dataState.stateNodes, updateJson );
		
		this.dispatchEvent(
			new CustomEvent(
				'd2l-delete-outcomes-picker-import',
				{
					bubbles: false,
					detail: {
						deleteAction: this._deleteAsync.bind( this, registryId, updateJson ),
						newRegistry: updateJson,
						numOutcomesToDelete: numDeleted
					}
				} 
			)
		);
	}
	
	_close() {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-delete-outcomes-picker-cancel',
				{ bubbles: false }
			)
		);
	}
	
} 

customElements.define( 'd2l-delete-outcomes-picker', DeleteOutcomesPicker );
