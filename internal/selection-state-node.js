import { CheckboxState } from './enums.js';

class SelectionStateNode {
	
	constructor( outcomeId, parent, children, checkboxState, externallySelected ) {
		this.outcomeId = outcomeId;
		this.checkboxState = checkboxState;
		this.parent = parent;
		this.externallySelected = !!externallySelected;
		this.children = children || [];
		this.elementRef = null;
	}
	
	_propegateDown( newState ) {
		this.externallySelected = false;
		this.checkboxState = newState;
		this.children.forEach( c => c._propegateDown( newState ) );
		this._sync();
	}
	
	_sync() {
		if( this.elementRef ) {
			this.elementRef.checkboxState = this.checkboxState;
		}
	}
	
	select() {
		this._propegateDown( CheckboxState.CHECKED );
		for( let ancestor = this.parent; ancestor; ancestor = ancestor.parent ) {
			if( ancestor.checkboxState !== CheckboxState.CHECKED ) {
				ancestor.checkboxState = ancestor.children.every(
					c => c.checkboxState === CheckboxState.CHECKED
				) ? CheckboxState.CHECKED : CheckboxState.PARTIAL;
				ancestor._sync();
			}
		}
	}
	
	deselect() {
		this._propegateDown( CheckboxState.NOT_CHECKED );
		for( let ancestor = this.parent; ancestor; ancestor = ancestor.parent ) {
			ancestor.checkboxState = (
				ancestor.externallySelected ||
				ancestor.children.some( c => c.checkboxState !== CheckboxState.NOT_CHECKED )
			) ? CheckboxState.PARTIAL : CheckboxState.NOT_CHECKED;
			ancestor._sync();
		}
	}
	
}

export default SelectionStateNode;
