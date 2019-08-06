import { css, html, LitElement } from 'lit-element/lit-element.js';
import Actions from './internal/actions.js';
import SelectStyle from './internal/select-style.js';
import { bodyStandardStyles, bodyCompactStyles, heading2Styles, heading3Styles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import Lores from './internal/lores.js';
import { CurrentLanguage } from './internal/language.js';
import './internal/program-outcomes-picker-tree.js';
import './internal/orphaned-outcomes-warning.js';
import 'd2l-button/d2l-button.js';
import 'd2l-loading-spinner/d2l-loading-spinner.js';
import 'd2l-icons/tier3-icons.js';

class ProgramOutcomesPicker extends LitElement {
	
	static get properties() {
		return {
			registryId: { type: String, attribute: 'registry-id' },
			programs: { type: Array },
			loresEndpoint: { type: String, attribute: 'lores-endpoint' },
			outcomeTerm: { type: String, attribute: 'outcome-term' },
			noHeader: { type: Boolean, attribute: 'no-header' },
			
			_dataState: { type: Object },
			_loading: { type: Boolean },
			_selectedProgramRegistryId: { type: String },
			_changesToApply: { type: Object },
			_errored: { type: Boolean }
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
			
			.body {
				display: flex;
				flex-direction: column;
				flex-grow: 1;
				padding: 0 40px;
				height: 0;
			}
			
			select {
				min-width: 50%;
				margin-top: 0.5rem;
			}
			
			program-outcomes-picker-tree {
				flex-grow: 1;
				overflow-y: auto;
			}
			
			.button-tray {
				border-top: 1px solid var(--d2l-color-mica);
				padding: 11px 40px;
			}
			
			.button-spacer {
				display: inline-block;
				width: 13px;
			}
			
			.button-list {
				display: flex;
				flex-direction: column;
				margin-top: 0.5rem;
				max-width: 250px;
			}
			
			.flex-spacer {
				flex-grow: 1;
			}
			
			d2l-alert {
				margin: 4px;
				width: calc( 100% - 8px );
			}
		`;
		
		return [
			bodyStandardStyles, bodyCompactStyles,
			heading2Styles, heading3Styles,
			labelStyles,
			SelectStyle,
			componentStyle
		];
	}
	
	constructor() {
		super();
		this.registryId = null;
		this.programs = [];
		this.loresEndpoint = null;
		this.token = null;
		this._loading = true;
		this._selectedProgramRegistryId = null;
		this._changesToApply = null;
		this._onLanguageChanged = this.performUpdate.bind( this );
		this.outcomeTerm = 'standards';
		this._errored = false;
		
		this._dataState = {
			programRegistries: {},
			mergedProgramForestMap: {},
			rootOutcomes: new Set(),
			ownedAuthoredLeafOutcomes: new Set(),
			programState: null,
			expandState: {}
		};
	}
	
	connectedCallback() {
		this._dataState.currentRegistryId = this.registryId;
		this._dataState.availableProgramInfo = this.programs;
		this._dataState.selectedProgramRegistryId = this.programs[0].registryId;
		this._selectedProgramRegistryId = this.programs[0].registryId;
		CurrentLanguage.addChangeListener( this._onLanguageChanged );
		Lores.setEndpoint( this.loresEndpoint );
		super.connectedCallback();
	}
	
	disconnectedCallback() {
		CurrentLanguage.removeChangeListener( this._onLanguageChanged );
		super.disconnectedCallback();
	}
	
	_renderOptions() {
		return this.programs.map( function( program ) {
			return html`
				<option value="${program.registryId}">${program.name}</option>
			`;
		});
	}
	
	_localize( term ) {
		return CurrentLanguage.localize( term, { outcome: this.outcomesTerm } );
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
				@d2l-alert-closed="${() => this._errored = false}"
			>
				<span>${this._localize('ConnectionError')}</span>
			</d2l-alert>
		`;
	}
	
	_renderHeader() {
		if( this.noHeader ) {
			return '';
		}
		return html`
			<div class="header">
				<h1 class="d2l-heading-2">${this._localize('Title')}</h1>
				<div class="flex-spacer"></div>
				<d2l-button-icon
					icon="d2l-tier3:close-thick"
					text="${this._localize('Close')}"
					@click="${this._close}"
				></d2l-icon>
			</div>
		`;
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
		
		const options = this._renderOptions();
		return html`
			<program-outcomes-picker-warning-modal
				?open="${!!this._changesToApply}"
				.outcomesTerm="${this.outcomesTerm}"
				._dataState="${this._dataState}"
				._affectedOutcomes="${(this._changesToApply || {}).orphanedOwnedOutcomes || null}"
				@action-move="${this._moveOrphanedOutcomesAndSave}"
				@action-delete="${this._deleteOrphanedOutcomesAndSave}"
				@action-cancel="${this._cancelSave}"
			></program-outcomes-picker-warning-modal>
			<div class="main">
				${this._renderHeader()}
				<div class="body">
					${this._renderAlert()}
					<p class="d2l-body-standard">${this._localize('SelectProgram')}</p>
					<div>
						<label class="d2l-label-text" for="program-selector">${this._localize('ProgramOutcomes')}</label>
						<select class="d2l-body-compact" id="program-selector" @change="${this._onSelectProgram}">
							${options}
						</select>
					</div>
					<h2 class="d2l-heading-3" style="margin-bottom: 0;">${this._localize('AvailableOutcomes')}</h2>
					<program-outcomes-picker-tree
						tabindex="0"
						.programRegistryId="${this._selectedProgramRegistryId}"
						._dataState="${this._dataState}"
						@focus="${this._onFocusTree}"
						@mousedown="${event => event.preventDefault()}"
					></program-outcomes-picker-tree>
				</div>
				<div class="button-tray">
					<d2l-button primary @click="${this._finish}" class="done-button">${this._localize('Import')}</d2l-button>
					<div class="button-spacer"></div>
					<d2l-button @click="${this._close}">${this._localize('Cancel')}</d2l-button>
				</div>
			</div>
		`;
	}
	
	_onSelectProgram( event ) {
		const registryId = event.target.value;
		this._selectedProgramRegistryId = registryId;
		Actions.selectProgram( this._dataState, registryId );
	}
	
	_finish() {
		const result = Actions.buildNewRegistry( this._dataState, this.registryId );
		if( result.orphanedOwnedOutcomes.length ) {
			this._changesToApply = result;
		} else {
			this._saveAsync( result.newRegistryForest ).catch( () => null );
		}
		
	}
	
	_moveOrphanedOutcomesAndSave() {
		const newRegistryContents = this._changesToApply.newRegistryForest.concat( this._changesToApply.orphanedOwnedOutcomes );
		this._saveAsync( newRegistryContents ).then( () => {
			this._changesToApply.orphanedOwnedOutcomes.forEach( movedOutcome => {
				this._dataState.rootOutcomes.add( movedOutcome.id );
				const masterNode = this._dataState.mergedProgramForestMap[movedOutcome.id];
				masterNode.parent.children.splice( masterNode.parent.children.indexOf( masterNode ), 1 );
				masterNode.parent = null;
			});
		}).finally( () => {
			this._changesToApply = null;
		});
	}
	
	_deleteOrphanedOutcomesAndSave() {
		this._saveAsync( this._changesToApply.newRegistryForest ).then( () => {
			this._changesToApply.orphanedOwnedOutcomes.forEach( deletedOutcome => {
				const masterNode = this._dataState.mergedProgramForestMap[deletedOutcome.id];
				masterNode.parent.children.splice( masterNode.parent.children.indexOf( masterNode ), 1 );
				this._deleteOrphanedOutcomesRecursive( deletedOutcome );
			});
		}).finally( () => {
			this._changesToApply = null;
		});
	}
	
	_deleteOrphanedOutcomesRecursive( deletedOutcome ) {
		delete this._dataState.mergedProgramForestMap[deletedOutcome.id];
		if( deletedOutcome.children.length ) {
			deletedOutcome.children.forEach( this._deleteOrphanedOutcomesRecursive.bind( this ) );
		} else {
			this._dataState.ownedAuthoredLeafOutcomes.delete( deletedOutcome.id );
		}
	}
	
	_saveAsync( newRegistryContents ) {
		this._loading = true;
		this._errored = false;
		return Lores.updateRegistryAsync( this.registryId, newRegistryContents ).then( () => {
			this._loading = false;
			this.dispatchEvent(
				new CustomEvent(
					'd2l-program-outcomes-picker-import', {
						bubbles: false,
						detail: {
							newRegistryContents: newRegistryContents
						}
					} 
				)
			);
		}).catch( exception => {
			this._loading = false;
			this._errored = true;
			throw exception;
		});
	}
	
	_cancelSave() {
		this._changesToApply = null;
	}
	
	firstUpdated() {
		if( !this.programs.length ) {
			this._errored = true;
			return;
		}
		
		const programRegistryIds = this.programs.map( p => p.registryId );
		programRegistryIds.forEach( registryId => this._dataState.expandState[registryId] = {} );
		Actions.initializeAsync( this._dataState, this.registryId, programRegistryIds ).then(
			() => this._loading = false
		).catch( exception => {
			console.error( exception ); //eslint-disable-line no-console
			this._errored = true;
		});
	}
	
	_onFocusTree() {
		this._dataState.programState.forest[0].elementRef._focusNode();
	}
	
	_close() {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-program-outcomes-picker-cancel',
				{ bubbles: false } 
			)
		);
	}
	
} 

customElements.define( 'd2l-program-outcomes-picker', ProgramOutcomesPicker );
