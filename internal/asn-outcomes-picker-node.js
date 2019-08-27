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
	
	static get styles() {
		return OutcomeTreeNode.styles;
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
				.sourceId="${node.sourceId}"
				.checkboxState="${node.checkboxState}"
				._treeData="${this._treeData}"
			></asn-outcomes-picker-node>
		`);
	}
	
	onCheckboxChanged( isChecked ) {
		const selectionNode = this._treeData.map.get( this.sourceId );
		isChecked ? selectionNode.select() : selectionNode.deselect();
	}
	
	hasChildren() {
		return this._treeData.map.get( this.sourceId ).children.length > 0;
	}
	
	getChildren() {
		return this._treeData.map.get( this.sourceId ).children.map( node => node.elementRef );
	}
	
	getParent() {
		const parentData = this._treeData.map.get( this.sourceId ).parent;
		return parentData ? parentData.elementRef : null;
	}
	
	getRoots() {
		return this._treeData.roots.map( node => node.elementRef );
	}
	
	getOutcome() {
		return this._treeData.map.get( this.sourceId ).outcome;
	}
	
}

customElements.define( 'asn-outcomes-picker-node', AsnOutcomeNode );
