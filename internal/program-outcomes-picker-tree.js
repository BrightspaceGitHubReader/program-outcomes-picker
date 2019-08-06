import { css, html, LitElement } from 'lit-element/lit-element.js';
import './program-outcomes-picker-node.js';

class ProgramOutcomesTree extends LitElement {
	
	static get properties() {
		return {
			programRegistryId: { type: String },
			_dataState: { type: Object }
		};
	}
	
	static get styles() {
		return css`
			.outcomes-tree {
				overflow-y: auto;
				overflow-x: hidden;
			}

			.root-outcomes {
				display: flex;
				flex-direction: column;
			}
			
			ul, li {
				list-style-type: none;
				padding: 0;
			}
		`;
	}
	
	_renderNode( programStateNode ) {
		return html`
			<li>
				<program-outcomes-picker-node
					tabindex="-1"
					._programNode="${programStateNode}"
					._dataState="${this._dataState}"
				></program-outcomes-picker-node>
			</li>
		`;
	}
	
	render() {
		const programState = this._dataState.programState;
		
		let programRoots = [];
		if( programState && programState.forest ) {
			programRoots = programState.forest.map( this._renderNode.bind( this ) );
		}
		
		return html`
			<div class="outcomes-tree">
				<ul class="root-outcomes" role="tree">
					${programRoots}
				</ul>
			</div>
		`;
	}
	
}

customElements.define( 'program-outcomes-picker-tree', ProgramOutcomesTree );
