import { html } from 'lit-element/lit-element.js';
import OutcomeTree from './outcome-tree.js';
import './program-outcomes-picker-node.js';

class ProgramOutcomesTree extends OutcomeTree {
	
	static get properties() {
		return Object.assign( {}, OutcomeTree.properties, {
			programRegistryId: { type: String },
			_dataState: { type: Object }
		});
	}
	
	static get styles() {
		return OutcomeTree.styles;
	}
	
	_renderNode( programStateNode ) {
		return html`
			<program-outcomes-picker-node
				tabindex="-1"
				.htmlId="node_${programStateNode.outcomeId}"
				._programNode="${programStateNode}"
				._dataState="${this._dataState}"
				._depth="${1}"
			></program-outcomes-picker-node>
		`;
	}
	
	_renderTree() {
		const programState = this._dataState.programState;
		
		let programRoots = [];
		if( programState && programState.forest ) {
			programRoots = programState.forest.map( this._renderNode.bind( this ) );
		}
		
		return programRoots || '';
	}
	
	_getFirstNode() {
		return (this._dataState.programState.forest[0] || {}).elementRef;
	}
	
}

customElements.define( 'program-outcomes-picker-tree', ProgramOutcomesTree );
