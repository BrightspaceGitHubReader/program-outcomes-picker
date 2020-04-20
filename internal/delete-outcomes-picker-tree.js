import { html } from 'lit-element/lit-element.js';
import OutcomeTree from './outcome-tree.js';
import './delete-outcomes-picker-node.js';

class DeleteOutcomesTree extends OutcomeTree {
	
	static get properties() {
		return Object.assign( {}, OutcomeTree.properties, {
			_dataState: { type: Object }
		});
	}
	
	static get styles() {
		return OutcomeTree.styles;
	}
	
	_renderNode( stateNode ) {
		return html`
			<delete-outcomes-picker-node
				tabindex="-1"
				.htmlId="node_${stateNode.outcomeId}"
				._stateNode="${stateNode}"
				._dataState="${this._dataState}"
				._depth="1"
			></delete-outcomes-picker-node>
		`;
	}
	
	_renderTree() {
		if( !this._dataState || !this._dataState.stateNodes ) {
			return '';
		}
		
		return this._dataState.stateNodes.map( this._renderNode.bind( this ) );
	}
	
	_getFirstNode() {
		return (this._dataState.stateNodes[0] || {}).elementRef;
	}
	
}

customElements.define( 'delete-outcomes-picker-tree', DeleteOutcomesTree );
