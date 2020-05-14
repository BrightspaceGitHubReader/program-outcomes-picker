import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { createNode, TreeBehaviour } from './internal/selection-state-node.js';
import { CheckboxState } from './internal/enums.js';
import Lores from './internal/lores.js';
import LocalizedLitElement from './internal/localized-element.js';
import Valence from './internal/valence.js';
import './internal/unlink-outcomes-picker-tree.js';
import './internal/orphaned-outcomes-warning.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui/core/components/icons/icon.js';
import 'd2l-alert/d2l-alert.js';

class UnlinkOutcomesPicker extends LocalizedLitElement {
	
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
			_numSelected: { type: Number }
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
			
			unlink-outcomes-picker-tree {
				flex-grow: 1;
				overflow-y: auto;
				min-height: 200px;
			}
			
			.button-tray {
				align-items: center;
				border-top: 1px solid var(--d2l-color-mica);
				display: flex;
				padding: 11px 40px;
			}

			.no-header .body,
			.no-header .button-tray {
				padding-left: 0px;
				padding-right: 0px;
			}
			
			.button-spacer {
				display: inline-block;
				width: 13px;
			}

			#selection-indicator {
				flex-grow: 1;
				font-size: var(--d2l-body-compact-text_-_font-size);
				text-align: end;
			}
			
			.offscreen {
				position: absolute;
				left: -10000px;
				user-select: none;
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
		this._numSelected = 0;
		
		this._dataState = {
			outcomesMap: new Map(),
			stateNodes: []
		};
		
		this.addEventListener('d2l-outcome-selection-state-changed', this._onSelectionStateChanged.bind(this));
	}
	
	connectedCallback() {
		Lores.setEndpoint( this.loresEndpoint );
		Valence.setHost( this.valenceHost );
		super.connectedCallback();
	}

	_computeNumSelected() {
		const countSelectedRecursive = (stateNode) => {
			if (stateNode.checkboxState === CheckboxState.NOT_CHECKED) {
				return 0;
			}

			let count = 0;

			if (stateNode.checkboxState === CheckboxState.CHECKED) {
				count++;
			}

			return stateNode.children.reduce((cur, child) => cur + countSelectedRecursive(child), count);
		};

		return this._dataState.stateNodes.reduce((cur, node) => cur + countSelectedRecursive(node), 0);
	}
	
	localize( term, extra ) {
		extra = Object.assign({ outcome: this.outcomesTerm }, extra);
		return super.localize( term, extra );
	}
	
	_onAlertClosed() {
		this._errored = false;
	}

	_onError( err ) {
		console.error( err );  //eslint-disable-line no-console
		this._errored = true;
		this._loading = false;
	}

	_onSelectionStateChanged(e) {
		e.stopPropagation();
		this._numSelected = this._computeNumSelected();
	}
	
	_outcomeIsCourseLevel( outcome, registrySources ) {
		return outcome.owner && registrySources[outcome.owner].type === 'course';
	}
    
	_outcomeIsLinked( outcome ) {
		return outcome.owner && outcome.owner !== this.registryId;
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
				<h1 class="d2l-heading-2">${this.localize('TitleUnlink')}</h1>
				<div style="flex-grow: 1"></div>
				<d2l-button-icon
					icon="d2l-tier3:close-thick"
					text="${this.localize('Close')}"
					@click="${this._close}"
				></d2l-button-icon>
			</div>
		`;
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

		const mainClasses = [
			'main'
		];

		if( this.noHeader ) {
			mainClasses.push( 'no-header' );
		}
		
		const countString = this._numSelected ? this.localize('NumSelected', { 'num': this._numSelected }) : '';
		return html`
			<div class="${mainClasses.join(' ')}">
				${this._renderHeader()}
				<div class="body">
					${this._renderAlert()}
					<unlink-outcomes-picker-tree
						._dataState="${this._dataState}"
						@mousedown="${this._suppressEventBehaviour}"
					></unlink-outcomes-picker-tree>
				</div>
				<div class="button-tray">
					<d2l-button primary @click="${this._unlink}">
						${this.localize('Unlink')}
						<div class="offscreen">${countString}</div>
					</d2l-button>
					<div class="button-spacer"></div>
					<d2l-button @click="${this._close}">${this.localize('Cancel')}</d2l-button>
					<div id="selection-indicator">${countString}</div>
				</div>
			</div>
		`;
	}
	
	updated( changedProperties ) {
		super.updated( changedProperties );
		if(
			changedProperties.has( 'loresEndpoint' )
			|| changedProperties.has( 'registryId' )
			|| changedProperties.has( 'valenceHost' )
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
				const registry = responses[0];

				const lockedOutcomes = new Set();
				responses[1].forEach( x => lockedOutcomes.add( x ) );

				const assessedOutcomes = new Set();
				responses[2].forEach( objInfo => {
					if ( objInfo.HasAssessments ) {
						assessedOutcomes.add( objInfo.ObjectiveId );
					}
				} );

				const outcomeRegistrySet = new Set();
				const addRegistriesRecursive = function( outcomes ) {
					outcomes.forEach( outcome => {
						outcome.owner && outcomeRegistrySet.add( outcome.owner );
						outcome.children && addRegistriesRecursive( outcome.children );
					} );
				};
				addRegistriesRecursive( registry.objectives );

				Valence.getRegistrySources( Array.from( outcomeRegistrySet ) ).then( sourceData => {

					const registrySources = sourceData.reduce( ( acc, data ) => {
						const id = data.registry_id;
						delete data.registry_id;
						acc[id] = data;
						return acc;
					}, {} );

					this._dataState.stateNodes = this._buildState( registry.objectives, lockedOutcomes, assessedOutcomes, registrySources, null );
					this._loading = false;
					
				} ).catch( this._onError.bind( this ) );
			}).catch( this._onError.bind( this ));
		}

	}
	
	_buildState( outcomes, lockedOutcomes, assessedOutcomes, registrySources, parent ) {
		return outcomes.reduce( ( acc, outcome ) => {
			this._dataState.outcomesMap.set( outcome.id, outcome );

			const isAssessed = !outcome.children.length && assessedOutcomes.has( outcome.id );
			const isLinked = ( this._outcomeIsLinked( outcome ) && this._outcomeIsCourseLevel( outcome, registrySources ) )
				|| lockedOutcomes.has( outcome.id );
			const isLocked = lockedOutcomes.has( outcome.id );

			const stateNode = createNode( TreeBehaviour.CascadesDown, {
				outcomeId: outcome.id,
				parent: parent,
				children: null, // gets set after children are processed
				checkboxState: CheckboxState.NOT_CHECKED,
				assessed: isAssessed,
				disabled: isLocked || !isLinked
			});

			stateNode.children = this._buildState( outcome.children, lockedOutcomes, assessedOutcomes, registrySources, stateNode );
			stateNode.disabled |= stateNode.children.some( childNode => childNode.disabled );
			stateNode.hasLinkedDescendant = isLinked || stateNode.children.some( childNode => childNode.hasLinkedDescendant );

			if ( stateNode.hasLinkedDescendant ) {
				acc.push( stateNode );
			}

			return acc;
		}, []);
	}

	/**
	 * Build optimized list of objectiveIds to unlink. If parent is being unlinked, it
	 * is implied that children are also being unlinked.
	 */
	_buildUnlinkList( stateNodes ) {
		const toUnlink = [];

		stateNodes.forEach( node => {
			if ( node.checkboxState === CheckboxState.CHECKED ) {
				toUnlink.push( node.outcomeId );
			} else if ( node.checkboxState === CheckboxState.PARTIAL ) {
				this._buildUnlinkList( node.children ).forEach( child => toUnlink.push( child ) );
			}
		} );

		return toUnlink;
	}

	_getAssessedSelected( stateNodes ) {
		const assessed = [];

		stateNodes.forEach( node => {
			if ( node.checkboxState === CheckboxState.CHECKED && node.assessed ) {
				assessed.push( this._dataState.outcomesMap.get( node.outcomeId ) );
			}

			if ( node.checkboxState !== CheckboxState.NOT_CHECKED ) {
				this._getAssessedSelected( node.children ).forEach( child => assessed.push( child ) );
			}
		} );

		return assessed;
	}
	
	_unlink() {
		const assessedSelected = this._getAssessedSelected( this._dataState.stateNodes );
		const toUnlink = this._buildUnlinkList( this._dataState.stateNodes );

		if ( !toUnlink.length ) {
			this._close();
			return;
		}

		this.dispatchEvent(
			new CustomEvent(
				'd2l-unlink-outcomes-picker-import',
				{
					bubbles: false,
					detail: {
						unlink: toUnlink,
						assessedOutcomes: assessedSelected
					}
				}
			)
		);
	}
	
	_close() {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-unlink-outcomes-picker-cancel',
				{ bubbles: false } 
			)
		);
	}
	
} 

customElements.define( 'd2l-unlink-outcomes-picker', UnlinkOutcomesPicker );
