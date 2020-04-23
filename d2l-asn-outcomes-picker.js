import { css, html } from 'lit-element/lit-element.js';
import SelectStyle from './internal/select-style.js';
import { bodyStandardStyles, heading2Styles, heading3Styles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import Lores from './internal/lores.js';
import ASNActions from './internal/asn-actions.js';
import ASN from './internal/asn.js';
import LocalizedLitElement from './internal/localized-element.js';
import './internal/asn-outcomes-picker-tree.js';
import './internal/orphaned-outcomes-warning.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui/core/components/icons/icon.js';

/*
dataState:
	selectedOutcomes: Map<sourceId,sourceId>
	lockedOutcomes: Set<sourceId>
	externalOutcomes: { parentSourceId, tree }[]
	currentTree:
		roots: SelectionStateNode[]
		map: Map<sourceId,SelectionStateNode>
*/

class AsnOutcomesPicker extends LocalizedLitElement {
	
	static get properties() {
		return {
			registryId: { type: String, attribute: 'registry-id' },
			loresEndpoint: { type: String, attribute: 'lores-endpoint' },
			outcomesTerm: { type: String, attribute: 'outcome-term' },
			noHeader: { type: Boolean, attribute: 'no-header' },
			orgUnitId: { type: Number, attribute: 'org-unit-id' },
			
			_availableJurisdictions: { type: Array },
			_availableSubjects: { type: Array },
			_availableFrameworks: { type: Array },
			_availableEducationLevels: { type: Array },
			
			_jurisdiction: { type: String },
			_subject: { type: String },
			_documentId: { type: String },
			_educationLevel: { type: String },
			
			_dataState: { type: Object },
			_loading: { type: Boolean },
			_loadingFilters: { type: Boolean },
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
				overflow-y: auto;
			}
			
			tr[data-disabled] {
				opacity: 0.5;
			}
			
			td {
				padding: 4px 0;
			}
			
			td > label {
				float: right;
				white-space: nowrap;
				margin-right: 1ch;
			}
			
			td > select {
				width: 100%;
			}
			
			td:last-child {
				width: 100%;
				position: relative;
			}
			
			td:last-child > d2l-loading-spinner {
				position: absolute;
				top: 0.2rem;
				left: 0.2rem;
				--d2l-loading-spinner-size: calc( 1.6rem + 10px );
			}
			
			asn-outcomes-picker-tree {
				flex-grow: 1;
				overflow-y: auto;
				min-height: 200px;
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
			
			h2.d2l-heading-3 {
				margin: 1rem 0;
			}
			
			option {
				color: var(--d2l-color-ferrite);
			}
			
			option.nonselection, select[data-nonselection] {
				color: var(--d2l-color-tungsten);
			}
		`;
		
		return [
			bodyStandardStyles,
			heading2Styles,
			heading3Styles,
			labelStyles,
			SelectStyle,
			componentStyle
		];
	}
	
	constructor() {
		super();
		this.registryId = null;
		this.loresEndpoint = null;
		this.outcomesTerm = 'standards';
		this.noHeader = false;
		this._loading = true;
		this._loadingFilters = false;
		this._changesToApply = null;
		this._errored = false;
		
		this._availableJurisdictions = [];
		this._availableSubjects = [];
		this._availableFrameworks = [];
		this._availableEducationLevels = [];
		
		this._jurisdiction = null;
		this._subject = null;
		this._documentId = null;
		this._educationLevel = null;
		
		this._dataState = {
			selectedOutcomes: new Map(),
			lockedOutcomes: new Set(),
			externalOutcomes: [],
			currentTree: null
		};
	}
	
	connectedCallback() {
		Lores.setEndpoint( this.loresEndpoint );
		super.connectedCallback();
		if( !this._availableJurisdictions.length ) {
			this._loading = true;
			ASN.fetchJurisdictionsAsync().then( jurisdictions => {
				this._availableJurisdictions = jurisdictions;
				this._loading = false;
			}).catch( () => this._errored = true );
		}
	}
	
	localize( term ) {
		return super.localize( term, { outcome: this.outcomesTerm } );
	}
	
	_onAlertClosed() {
		this._errored = false;
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
				<h1 class="d2l-heading-2">${this.localize('TitleASN')}</h1>
				<div class="flex-spacer"></div>
				<d2l-button-icon
					icon="d2l-tier3:close-thick"
					text="${this.localize('Close')}"
					@click="${this._close}"
				></d2l-icon>
			</div>
		`;
	}
	
	_renderWarningModal() {
		const outcomeLookup = {};
		
		const buildLookup = function( forest ) {
			forest.forEach( outcome => {
				outcomeLookup[outcome.id] = outcome;
				buildLookup( outcome.children || [] );
			});
		};
		
		if( this._changesToApply && this._changesToApply.orphanedOutcomes ) {
			buildLookup( this._changesToApply.orphanedOutcomes );
		}
		
		const actions = {
			moveAndSave: () => {
				const newTrees = this._changesToApply.newRegistryForest;
				const existingTree = this._changesToApply.orphanedOutcomes.map( ASNActions.undecorateTree );
				this._save( existingTree.concat( newTrees ), this._changesToApply.mappings );
			},
			deleteAndSave: this._save.bind( this, this._changesToApply.newRegistryForest ),
			cancel: () => { this._changesToApply = null; }
		};
		
		return html`
			<program-outcomes-picker-warning-modal
				?open="${!!this._changesToApply}"
				.outcomesTerm="${this.outcomesTerm}"
				.outcomeLookup="${outcomeLookup}"
				._affectedOutcomes="${(this._changesToApply || {}).orphanedOutcomes || null}"
				?canMoveToRoot="${(this._changesToApply || {}).canMoveToRoot}"
				@action-move="${actions.moveAndSave}"
				@action-delete="${actions.deleteAndSave}"
				@action-cancel="${actions.cancel}"
			></program-outcomes-picker-warning-modal>
		`;
	}
	
	_renderLoadingOption( condition ) {
		return ( this._loadingFilters && condition ) ? html`<d2l-loading-spinner></d2l-loading-spinner>` : '';
	}
	
	_renderJurisdictionSelector() {
		const options = this._availableJurisdictions.map( jurisdiction => html`
			<option value="${jurisdiction}">${jurisdiction}</option>
		` );
		if( options.length > 0 ) {
			options.unshift( html`<option value="" class="nonselection">${this.localize( 'SelectJurisdiction' )}</option>` );
		}
		
		return html`<tr ?data-disabled="${this._loadingFilters}">
			<td>
				<label for="jurisdiction-select" class="d2l-label-text">${this.localize('Jurisdiction')}</label>
			</td>
			<td>
				<select
					id="jurisdiction-select"
					?disabled="${this._loadingFilters}"
					?data-nonselection="${!this._jurisdiction}"
					.value="${this._jurisdiction || ''}"
					@change="${this._onJurisdictionChanged}"
				>${options}</select>
				${this._renderLoadingOption( !this._jurisdiction )}
			</td>
		</tr>`;
	}
	
	_renderSubjectSelector() {
		const options = this._availableSubjects.map( subject => html`
			<option value="${subject}">${subject}</option>
		` );
		if( options.length > 1 ) {
			options.unshift( html`<option value="" class="nonselection">${this.localize( 'SelectSubject' )}</option>` );
		}
		
		return html`<tr ?data-disabled="${this._loadingFilters || !this._jurisdiction}">
			<td>
				<label for="subject-select" class="d2l-label-text">${this.localize('Subject')}</label>
			</td>
			<td>
				<select
					id="subject-select"
					?disabled="${this._loadingFilters || !this._jurisdiction}"
					?data-nonselection="${!this._subject}"
					.value="${this._subject || ''}"
					@change="${this._onSubjectChanged}"
				>${options}</select>
				${this._renderLoadingOption( this._jurisdiction && !this._subject )}
			</td>
		</tr>`;
	}
	
	_renderFrameworkSelector() {
		const options = this._availableFrameworks.map( framework => {
			let text = framework.framework;
			if( framework.year ) {
				text += ` (${framework.year})`;
			}
			return html`<option value="${framework.documentId}">${text}</option>`;
		});
		
		return html`<tr ?data-disabled="${this._loadingFilters || !this._subject}">
			<td>
				<label for="framework-select" class="d2l-label-text">${this.localize('Framework')}</label>
			</td>
			<td>
				<select
					id="framework-select"
					?disabled="${this._loadingFilters || !this._subject}"
					.value="${this._documentId || ''}"
					@change="${this._onFrameworkChanged}"
				>${options}</select>
				${this._renderLoadingOption( this._subject && !this._documentId )}
			</td>
		</tr>`;
	}
	
	_renderEducationLevelSelector() {
		const options = this._availableEducationLevels.map( educationLevel => html`
			<option value="${educationLevel}">${educationLevel}</option>
		` );
		if( options.length > 1 ) {
			options.unshift( html`<option value="*">${this.localize( 'All' )}</option>` );
		}
		
		return html`<tr ?data-disabled="${this._loadingFilters || !this._documentId}">
			<td>
				<label for="education-level-select" class="d2l-label-text">${this.localize('EducationLevel')}</label>
			</td>
			<td>
				<select
					id="education-level-select"
					?disabled="${this._loadingFilters || !this._documentId}"
					.value="${this._educationLevel || '*'}"
					@change="${this._onEducationLevelChanged}"
				>${options}</select>
				${this._renderLoadingOption( this._documentId )}
			</td>
		</tr>`;
	}
	
	_onConnectionError() {
		this._errored = true;
	}
	
	_onConnectionErrorResolved() {
		this._errored = false;
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
					<h2 class="d2l-heading-3">${this.localize('FilteringOptions')}</h2>
					<table class="filters">
						<tbody>
							${this._renderJurisdictionSelector()}
							${this._renderSubjectSelector()}
							${this._renderFrameworkSelector()}
							${this._renderEducationLevelSelector()}
						</tbody>
					</table>
					<h2 class="d2l-heading-3">${this.localize('AvailableOutcomes')}</h2>
					<asn-outcomes-picker-tree
						._dataState="${this._dataState}"
						.documentId="${this._documentId}"
						.subject="${this._subject}"
						.educationLevel="${this._educationLevel}"
						@connection-error="${this._onConnectionError}"
						@connection-error-resolved="${this._onConnectionErrorResolved}"
					></program-outcomes-picker-tree>
				</div>
				<div class="button-tray">
					<d2l-button primary class="done-button" @click="${this._onImport}">${this.localize('Import')}</d2l-button>
					<div class="button-spacer"></div>
					<d2l-button @click="${this._close}">${this.localize('Cancel')}</d2l-button>
				</div>
			</div>
		`;
	}
	
	updated( changedProperties ) {
		super.updated( changedProperties );
		if(
			changedProperties.has( 'registryId' ) || 
			changedProperties.has( 'loresEndpoint' )
		) {
			// First update or core property changed. Re-initialize.
			this._loading = true;
			this._errored = false;
			this._dataState = {
				selectedOutcomes: new Map(),
				externalOutcomes: [],
				currentTree: null,
				lockedOutcomes: new Set()
			};
			
			Lores.setEndpoint( this.loresEndpoint );
			this._reloadRegistry();
		}
	}
	
	_reloadRegistry() {
		this._dataState.selectedOutcomes.clear();
		this._dataState.externalOutcomes = [];
		this._dataState.lockedOutcomes = new Set();
		Lores.fetchRegistryAsync( this.registryId ).then( registry => {
			return Lores.getOwnedLockedOutcomesAsync( this.registryId ).then( lockedOutcomes => {
				const lockedOutcomesSet = new Set();
				lockedOutcomes.forEach( outcomeId => lockedOutcomesSet.add( outcomeId ) );
				
				registry.objectives.forEach(
					outcome => this._initSelectedRecursive( outcome, null, lockedOutcomesSet )
				);
				this._onJurisdictionChanged( null );
				this._loading = false;
				this.performUpdate();
			});
		}).catch( exception => {
			console.error( exception ); // eslint-disable-line no-console
			this._errored = true;
		});
	}
	
	_initSelectedRecursive( outcome, parent, lockedOutcomes ) {
		if( outcome.source === 'asn' ) {
			this._dataState.selectedOutcomes.set( outcome.source_id, parent ? parent.source_id : null );
			if( outcome.children ) {
				let locked = false;
				outcome.children.forEach( child => {
					locked = this._initSelectedRecursive( child, outcome, lockedOutcomes ) || locked;
				});
				if( locked ) {
					this._dataState.lockedOutcomes.add( outcome.source_id );
				}
				return locked;
			}
			return false;
		} else {
			this._dataState.externalOutcomes.push({
				parentSourceId: parent ? parent.source_id : null,
				tree: outcome
			});
			return this._hasLockedDescendant( outcome, lockedOutcomes );
		}
	}
	
	_hasLockedDescendant( outcome, lockedOutcomes ) {
		if( lockedOutcomes.has( outcome.id ) ) {
			return true;
		} else if( !outcome.children || !outcome.children.length ) {
			return false;
		}
		return outcome.children.some( c => this._hasLockedDescendant( c, lockedOutcomes ) );
	}
	
	_onJurisdictionChanged( jurisdiction ) {
		if( jurisdiction instanceof Event ) {
			jurisdiction = jurisdiction.target.value;
		}
		
		this._jurisdiction = jurisdiction || null;
		this._subject = null;
		this._documentId = null;
		this._educationLevel = null;
		
		this._availableSubjects = [];
		this._availableFrameworks = [];
		this._availableEducationLevels = [];
		
		if( this._jurisdiction ) {
			this._loadingFilters = true;
			ASN.fetchSubjectsAsync( this._jurisdiction ).then( subjects => {
				this._loadingFilters = false;
				this._errored = false;
				this._availableSubjects = subjects;
				if( subjects.length === 1 ) {
					this._onSubjectChanged( subjects[0] );
				}
			}).catch( () => {
				this._loadingFilters = false;
				this._errored = true;
			});
		}
	}
	
	_onSubjectChanged( subject ) {
		if( subject instanceof Event ) {
			subject = subject.target.value;
		}
		
		this._subject = subject || null;
		this._documentId = null;
		this._educationLevel = null;
		
		this._availableFrameworks = [];
		this._availableEducationLevels = [];
		
		if( this._subject ) {
			this._loadingFilters = true;
			ASN.fetchFrameworksAsync( this._jurisdiction, this._subject ).then( frameworks => {
				this._loadingFilters = false;
				this._errored = false;
				this._availableFrameworks = frameworks;
				if( frameworks.length ) {
					this._onFrameworkChanged( frameworks[0].documentId );
				}
			}).catch( exception => {
				console.error( exception ); // eslint-disable-line no-console
				this._loadingFilters = false;
				this._errored = true;
			});
		}
	}
	
	_onFrameworkChanged( documentId ) {
		if( documentId instanceof Event ) {
			documentId = documentId.target.value;
		}
		
		this._documentId = documentId || null;
		this._educationLevel = null;
		
		this._availableEducationLevels = [];
		
		if( this._documentId ) {
			this._loadingFilters = true;
			ASN.fetchEducationLevelsAsync( this._documentId, this._subject ).then( educationLevels => {
				this._loadingFilters = false;
				this._errored = false;
				this._availableEducationLevels = educationLevels;
				this._onEducationLevelChanged( educationLevels.length === 1 ? educationLevels[0] : null );
			}).catch( exception => {
				console.error( exception ); // eslint-disable-line no-console
				this._loadingFilters = false;
				this._errored = true;
			});
		}
	}
	
	_onEducationLevelChanged( educationLevel ) {
		if( educationLevel instanceof Event ) {
			educationLevel = educationLevel.target.value;
		}
		
		this._educationLevel = educationLevel === '*' ? null : educationLevel || null;
	}
	
	_close() {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-asn-outcomes-picker-cancel',
				{ bubbles: false } 
			)
		);
	}
	
	_onImport() {
		this._loading = true;
		ASNActions.buildNewRegistryAsync(
			this._dataState,
			this.orgUnitId
		).then( results => {
			if( results.orphanedOutcomes.length ) {
				results.canMoveToRoot = !results.orphanedOutcomes.some( o => o.owner !== this.registryId );
				this._changesToApply = results;
			} else {
				this._save( results.newRegistryForest, results.mappings );
			}
		}).catch( exception => {
			console.error( exception ); // eslint-disable-line no-console
			this._loading = false;
			this._errored = true;
		});
	}
	
	_save( newRegistryForest, mappings ) {
		this._loading = true;
		Lores.updateRegistryAsync( this.registryId, newRegistryForest ).then( () => {
			this._changesToApply = null;
			this.dispatchEvent(
				new CustomEvent(
					'd2l-asn-outcomes-picker-import', {
						bubbles: false,
						detail: {
							ObjectivesWithSource: mappings,
							ObjectiveTree: newRegistryForest
						}
					} 
				)
			);
		}).then( this._reloadRegistry.bind( this ) );
	}
	
} 

customElements.define( 'd2l-asn-outcomes-picker', AsnOutcomesPicker );
