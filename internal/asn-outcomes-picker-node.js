import { html } from 'lit-element/lit-element.js';
import OutcomeTreeNode from './outcome-tree-node.js';

class AsnOutcomeNode extends OutcomeTreeNode {
	
	static get properties() {
		return Object.assign( {},
			OutcomeTreeNode.properties, {
				sourceId: { type: String },
				_treeData: { type: Object }
			}
		);
	}
	
	update( changedProperties ) {
		super.update( changedProperties );
		this._treeData.map.get( this.sourceId ).elementRef = this;
	}
	
	updated( changedProperties ) {
		if( changedProperties.has( 'sourceId' ) ) {
			this._expanded = false;
			this.checkboxState = this._treeData.map.get( this.sourceId ).checkboxState;
		}
		super.updated( changedProperties );
	}
	
	connectedCallback() {
		this._treeData.map.get( this.sourceId ).elementRef = this;
		this._expanded = false;
		this.checkboxState = this._treeData.map.get( this.sourceId ).checkboxState;
		super.connectedCallback();
	}
	
	renderChildren() {
		return this._treeData.map.get( this.sourceId ).children.map( node => html`
			<asn-outcomes-picker-node
				tabindex="-1"
				.htmlId="node_${window.btoa( node.sourceId ).replace( '+', '-' ).replace( '/', '_' )}"
				.sourceId="${node.sourceId}"
				.checkboxState="${node.checkboxState}"
				._treeData="${this._treeData}"
				._depth="${this._depth + 1}"
			></asn-outcomes-picker-node>
		`);
	}
	
	getSelectionNode() {
		return this._treeData.map.get( this.sourceId );
	}
	
	getRoots() {
		return this._treeData.roots.map( node => node.elementRef );
	}
	
	getOutcome() {
		return this._treeData.map.get( this.sourceId ).outcome;
	}
	
}

customElements.define( 'asn-outcomes-picker-node', AsnOutcomeNode );
