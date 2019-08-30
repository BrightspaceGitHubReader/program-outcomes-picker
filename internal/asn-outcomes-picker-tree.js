import { html } from 'lit-element/lit-element.js';
import { bodyStandardStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { CheckboxState } from './enums.js';
import ASN from './asn.js';
import ASNActions from './asn-actions.js';
import SelectionStateNode from './selection-state-node.js';
import OutcomeTree from './outcome-tree.js';
import 'd2l-loading-spinner/d2l-loading-spinner.js';
import './asn-outcomes-picker-node.js';

class AsnOutcomesTree extends OutcomeTree {
	
	static get properties() {
		return Object.assign( {}, OutcomeTree.properties, {
			documentId: { type: String },
			subject: { type: String },
			educationLevel: { type: String },
			
			_loading: { type: Boolean },
			_dataState: { type: Object },
			_error: { type: Boolean }
		});
	}
	
	static get styles() {
		return [
			bodyStandardStyles,
			OutcomeTree.styles
		];
	}
	
	constructor() {
		super();
		this._fetchOutcomesPromise = null;
		this._error = false;
	}
	
	updated( changedProperties ) {
		if(
			changedProperties.has( 'documentId' ) ||
			changedProperties.has( 'subject' ) ||
			changedProperties.has( 'educationLevel' )
		) {
			if( this._fetchOutcomesPromise ) {
				this._fetchOutcomesPromise.cancelled = true;
			}
			
			ASNActions.commitChanges( this._dataState );
			
			this._dataState.currentTree = null;
			if( this.documentId && this.subject ) {
				this._loading = true;
				const cancellablePromise = {
					cancelled: false
				};
				cancellablePromise.promise = ASN.fetchOutcomesAsync(
					this.documentId,
					this.subject,
					this.educationLevel
				).then( rootOutcomes => {
					if( this._error ) {
						this._error = false;
						this._raiseBasicEvent( 'connection-error-resolved' );
					}
					if( !cancellablePromise.cancelled ) {
						this._initializeTreeData( rootOutcomes );
						this._loading = false;
						this.performUpdate();
					}
				}).catch( exception => {
					console.error( exception ); //eslint-disable-line no-console
					this._error = true;
					this._raiseBasicEvent( 'connection-error' );
				});
				this._fetchOutcomesPromise = cancellablePromise;
			} else {
				this._loading = false;
				this._fetchOutcomesPromise = null;
			}
		}
		super.updated( changedProperties );
	}
	
	_renderTree() {
		return this._dataState.currentTree.roots.map( rootNode => html`
			<asn-outcomes-picker-node
				tabindex="-1"
				.htmlId="node_${window.btoa( rootNode.sourceId ).replace( '+', '-' ).replace( '/', '_' )}"
				.sourceId="${rootNode.sourceId}"
				._treeData="${this._dataState.currentTree}"
				._depth="${1}"
			></asn-outcomes-picker-node>
		` );
	}
	
	_getFirstNode() {
		return (this._dataState.currentTree.roots[0] || {}).elementRef;
	}
	
	render() {
		if( this._loading ) {
			return html`
				<div style="margin: auto;">
					<d2l-loading-spinner size="200"></d2l-loading-spinner>
				</div>
			`;
		}
		
		if( !this._dataState.currentTree ) {
			return html`
				<span clas="d2l-body-standard">${this.localize( 'SelectFilters' )}</span>
			`;
		}
		
		super.render();
	}
	
	_raiseBasicEvent( eventName ) {
		this.dispatchEvent(
			new CustomEvent(
				eventName,
				{ bubbles: false }
			)
		);
	}
	
	_initializeTreeData( rootOutcomes ) {
		const map = new Map();
		this._dataState.currentTree = {
			roots: rootOutcomes.map( outcome => this._initializeTreeDataRecursive( outcome, map, null ) ),
			map: map
		};
	}
	
	_initializeTreeDataRecursive( outcome, map, parent ) {
		const outcomeData = Object.assign( {}, outcome );
		delete outcomeData.children;
		
		const stateNode = new SelectionStateNode(
			/* outcomeId */ outcome.source_id,
			/* parent */ parent,
			/* children */ null, // gets set after children are processed
			/* checkboxState */ null, // gets set after children are processed
			/* externallySelected */ false
		);
		stateNode.sourceId = outcome.source_id;
		stateNode.outcome = outcomeData;
		
		stateNode.children = outcome.children.map( child => this._initializeTreeDataRecursive( child, map, stateNode ) );
		if( stateNode.children.length ) {
			if( stateNode.children.every( c => c.checkboxState === CheckboxState.CHECKED ) ) {
				stateNode.checkboxState = CheckboxState.CHECKED;
			} else if( stateNode.children.some( c => c.checkboxState !== CheckboxState.NOT_CHECKED ) ) {
				stateNode.checkboxState = CheckboxState.PARTIAL;
			} else {
				stateNode.checkboxState = CheckboxState.NOT_CHECKED;
			}
		} else {
			stateNode.checkboxState = this._dataState.selectedOutcomes.has( outcome.source_id ) ? CheckboxState.CHECKED : CheckboxState.NOT_CHECKED;
		}
		
		map.set( outcome.source_id, stateNode );
		return stateNode;
	}
	
}

customElements.define( 'asn-outcomes-picker-tree', AsnOutcomesTree );
