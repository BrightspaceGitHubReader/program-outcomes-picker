import { CheckboxState } from './enums.js';

class ISelectionStateNode {
	
	constructor( outcomeId, parent, children, checkboxState, externallySelected, locked, assessed, disabled ) {
		this.outcomeId = outcomeId;
		this.checkboxState = checkboxState;
		this.parent = parent;
		this.externallySelected = !!externallySelected;
		this.children = children || [];
		this.elementRef = null;
		this.locked = !!locked;
		this.assessed = !!assessed;
		this.disabled = !!disabled;
	}
	
	_sync() {
		if( this.elementRef ) {
			this.elementRef.checkboxState = this.checkboxState;
		}
	}

	isDisabled() {
		return this.locked || this.disabled;
	}
	
	select() {
		/* override */
	}
	
	deselect() {
		/* override */
	}
	
	toggle() {
		return (this.checkboxState === CheckboxState.NOT_CHECKED) ? this.select() : this.deselect();
	}
	
}

/* VirtualParents behaviour:
The selection state of parent nodes is computed based on its children.
Selecting or deselecting a parent will cascade the (de)selection down
to its children. If some (but not all) of a nodes children are selected,
it is in an intermediate state.
*/
class SelectionStateNode_VirtualParents extends ISelectionStateNode {
	
	_propegateDown( newState ) {
		if( this.isDisabled() ) {
			return true;
		}
		
		this.externallySelected = false;
		
		let hasDisabledDescendant = false;
		this.children.forEach( c => hasDisabledDescendant = c._propegateDown( newState ) || hasDisabledDescendant );
		
		if( newState === CheckboxState.NOT_CHECKED && hasDisabledDescendant ) {
			this.checkboxState = CheckboxState.PARTIAL;
		} else {
			this.checkboxState = newState;
		}
		
		this._sync();
		return hasDisabledDescendant;
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
		return this.checkboxState;
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
		return this.checkboxState;
	}
	
}

/* CascadesDown behaviour
Selection or deselection of a parent node cascades the selection
down to its children, but does NOT cascade up to its parent. A
parent node may still be unselected even if all of its children
are selected. Checkboxes are in the intermediate state if at least
one child is selected, but the node itself is not (even if all
children are selected).
*/
class SelectionStateNode_CascadesDown extends ISelectionStateNode {
	
	_propegateDown( newState ) {
		if( this.isDisabled() ) {
			return true;
		}
		
		let hasDisabledDescendant = false;
		this.children.forEach( c => hasDisabledDescendant = c._propegateDown( newState ) || hasDisabledDescendant );
		
		if( !hasDisabledDescendant ) {
			this.checkboxState = newState;
			this.externallySelected = false;
		}
		
		this._sync();
		return hasDisabledDescendant;
	}
	
	select() {
		this._propegateDown( CheckboxState.CHECKED );
		for( let ancestor = this.parent; ancestor; ancestor = ancestor.parent ) {
			if( ancestor.checkboxState === CheckboxState.NOT_CHECKED ) {
				ancestor.checkboxState = CheckboxState.PARTIAL;
				ancestor._sync();
			}
		}
		return this.checkboxState;
	}
	
	deselect() {
		this._propegateDown( CheckboxState.NOT_CHECKED );
		let hasSelectedChild = false;
		for( let ancestor = this.parent; ancestor; ancestor = ancestor.parent ) {
			if( !hasSelectedChild ) {
				hasSelectedChild |= ancestor.children.some( c => c.checkboxState !== CheckboxState.NOT_CHECKED );
			}
			
			const oldState = ancestor.checkboxState;
			const newState = hasSelectedChild ? CheckboxState.PARTIAL : CheckboxState.NOT_CHECKED;
			if( oldState === newState ) {
				break;
			}
			
			ancestor.checkboxState = newState;
			ancestor._sync();
		}
		return this.checkboxState;
	}
	
}

const TreeBehaviour = Object.freeze({
	VirtualParents: 0,
	CascadesDown: 1
});

const createNode = function( behaviour, params ) {
	switch( behaviour ) {
		case TreeBehaviour.VirtualParents:
			return new SelectionStateNode_VirtualParents(
				params.outcomeId,
				params.parent || null,
				params.children || [],
				params.checkboxState || CheckboxState.NOT_CHECKED,
				!!params.externallySelected,
				!!params.locked,
				!!params.assessed,
				!!params.disabled
			);
		case TreeBehaviour.CascadesDown:
			return new SelectionStateNode_CascadesDown(
				params.outcomeId,
				params.parent || null,
				params.children || [],
				params.checkboxState || CheckboxState.NOT_CHECKED,
				!!params.externallySelected,
				!!params.locked,
				!!params.assessed,
				!!params.disabled
			);
		default:
			throw 'Unknown TreeBehaviour';
	}
};

export { createNode, TreeBehaviour };
