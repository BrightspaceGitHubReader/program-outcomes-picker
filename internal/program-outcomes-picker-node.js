import { html } from 'lit-element/lit-element.js';
import OutcomeTreeNode from './outcome-tree-node.js';

class ProgramOutcomeNode extends OutcomeTreeNode {
	
	static get properties() {
		return Object.assign( {},
			OutcomeTreeNode.properties, {
				_programNode: { type: Object },
				_dataState: { type: Object }
			}
		);
	}
	
	static get styles() {
		return OutcomeTreeNode.styles;
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
	}
	
	connectedCallback() {
		this._programNode.elementRef = this;
		this.checkboxState = this._programNode.checkboxState;
		super.connectedCallback();
	}
	
	renderChildren() {
		return this._programNode.children.map( programNode => html`
			<program-outcomes-picker-node
				tabindex="-1"
				.checkboxState="${programNode.checkboxState}"
				._programNode="${programNode}"
				._dataState="${this._dataState}"
			></program-outcomes-picker-node>
		`);
	}
	
	onCheckboxChanged( isChecked ) {
		isChecked ? this._programNode.select() : this._programNode.deselect();
	}

	onSetExpanded( isExpanded ) {
		const programRegistryId = this._dataState.programState.registryId;
		const outcomeId = this._programNode.outcomeId;
		this._dataState.expandState[programRegistryId][outcomeId] = isExpanded;
	}
	
	hasChildren() {
		return !!this._programNode.children.length;
	}
	
	getChildren() {
		return this._programNode.children.map( pn => pn.elementRef );
	}
	
	getParent() {
		const parentData = this._programNode.parent;
		return parentData ? parentData.elementRef : null;
	}
	
	getRoots() {
		return this._dataState.programState.forest.map( pn => pn.elementRef );
	}
	
	getOutcome() {
		return this._dataState.mergedProgramForestMap[this._programNode.outcomeId].outcome;
	}
	
}

customElements.define( 'program-outcomes-picker-node', ProgramOutcomeNode );
