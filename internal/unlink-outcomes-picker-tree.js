import { html } from 'lit-element/lit-element.js';
import OutcomeTree from './outcome-tree.js';
import './unlink-outcomes-picker-node.js';

class UnlinkOutcomesTree extends OutcomeTree {
	
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
			<unlink-outcomes-picker-node
				tabindex="-1"
				.htmlId="node_${stateNode.outcomeId}"
				._stateNode="${stateNode}"
				._dataState="${this._dataState}"
				._depth="1"
			></unlink-outcomes-picker-node>
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

customElements.define( 'unlink-outcomes-picker-tree', UnlinkOutcomesTree );
