import initializationHelper from './initialization.js';
import ProgramStateNode from './program-state-node.js';
import { SelectionState, CheckboxState } from './enums.js';

const selectProgram = function( dataState, registryId ) {
	applyProgramState( dataState );
	dataState.programState = {
		registryId: registryId,
		forest: buildProgramState( dataState, registryId )
	};
};

const setsOverlap = function( setA, setB ) {
	if( setA.size > setB.size ) {
		return setsOverlap( setB, setA );
	}
	for( const element of setA ) {
		if( setB.has( element ) ) {
			return true;
		}
	}
	return false;
};

const buildProgramState = function( dataState, registryId ) {
	const registry = dataState.programRegistries[registryId];
	return registry.objectives.map( outcome => buildProgramStateRecursive( dataState, outcome, null ) );
};

const buildProgramStateRecursive = function( dataState, registryOutcome, parentNode ) {
	const children = registryOutcome.children || [];
	const childIdSet = new Set();
	children.forEach( child => childIdSet.add( child.id ) );
	
	const masterForestNode = dataState.mergedProgramForestMap[registryOutcome.id];
	const externallySelected = (
		masterForestNode.selected === SelectionState.EXPLICIT ||
		(
			masterForestNode.selected === SelectionState.IMPLICIT &&
			masterForestNode.children.some( child =>
				child.selected !== SelectionState.NO &&
				!childIdSet.has( child.outcome.id )
			)
		)
	);
	
	const thisNode = new ProgramStateNode(
		/* outcomeId */ registryOutcome.id,
		/* parent */ parentNode,
		/* children */ null, // gets set after children are processed
		/* checkboxState */ null, // gets set after children are processed
		/* externallySelected */ externallySelected
	);
	
	thisNode.children = children.map( child => buildProgramStateRecursive( dataState, child, thisNode ) );
	if( thisNode.children.length ) {
		let allChildrenSelected = true;
		let someChildSelected = externallySelected;
		thisNode.children.forEach( child => {
			if( child.checkboxState === CheckboxState.NOT_CHECKED ) {
				allChildrenSelected = false;
			} else {
				someChildSelected = true;
			}
		});
		thisNode.checkboxState = allChildrenSelected ? CheckboxState.CHECKED : ( someChildSelected ? CheckboxState.PARTIAL : CheckboxState.NOT_CHECKED );
	} else {
		thisNode.checkboxState = externallySelected ? CheckboxState.CHECKED : CheckboxState.NOT_CHECKED;
	}
	
	return thisNode;
};

const applyProgramState = function( dataState ) {
	if( dataState.programState ) {
		dataState.programState.forest.forEach(
			tree => applyProgramStateRecursive( dataState, tree )
		);
	}
};

const applyProgramStateRecursive = function( dataState, programNode ) {
	const masterNode = dataState.mergedProgramForestMap[programNode.outcomeId];
	switch( programNode.checkboxState ) {
		case CheckboxState.CHECKED: {
			if( masterNode.selected !== SelectionState.EXPLICIT ) {
				masterNode.selected = programNode.children.length ? SelectionState.IMPLICIT : SelectionState.EXPLICIT;
			}
			break;
		}
		case CheckboxState.PARTIAL: {
			if( masterNode.selected === SelectionState.NO ) {
				masterNode.selected = SelectionState.IMPLICIT;
			}
			break;
		}
		case CheckboxState.NOT_CHECKED: {
			const programNodeChildren = new Set();
			programNode.children.forEach( child => programNodeChildren.add( child.outcomeId ) );
			
			masterNode.selected = SelectionState.NO;
			masterNode.children.forEach( child => {
				if( !programNodeChildren.has( child.outcome.id ) ) {
					uncheckRecursive( child );
				}
			});
			break;
		}
	}
	
	programNode.children.forEach(
		childNode => applyProgramStateRecursive( dataState, childNode )
	);
};

const uncheckRecursive = function( masterNode ) {
	masterNode.selected = SelectionState.NO;
	masterNode.children.forEach( uncheckRecursive );
};

const initializeAsync = function( dataState, registryId, programRegistryIds ) {
	return initializationHelper( dataState, registryId, programRegistryIds ).then(
		() => selectProgram( dataState, programRegistryIds[0] )
	);
};

const buildNewRegistryRecursive = function( registryId, masterNode, parentNode, orphanedOutcomesRef, inOrphanedOutcomesTree ) {
	const outcomeNode = { id: masterNode.outcome.id, children: [] };
	if(
		parentNode &&
		!inOrphanedOutcomesTree &&
		masterNode.selected === SelectionState.NO &&
		masterNode.outcome.owner === registryId
	) {
		orphanedOutcomesRef.push( outcomeNode );
		masterNode.children.forEach( child => buildNewRegistryRecursive( registryId, child, outcomeNode, orphanedOutcomesRef, true ) );
		return outcomeNode;
	} else if( parentNode && ( inOrphanedOutcomesTree || masterNode.selected !== SelectionState.NO ) ) {
		parentNode.children.push( outcomeNode );
	}
	
	masterNode.children.forEach( node => buildNewRegistryRecursive( registryId, node, outcomeNode, orphanedOutcomesRef, inOrphanedOutcomesTree ) );
	return outcomeNode;
};

const buildNewRegistry = function( dataState, registryId ) {
	applyProgramState( dataState );
	
	const orphanedOwnedOutcomes = [];
	const newForest = [];
	dataState.rootOutcomes.forEach( outcomeId => {
		const masterNode = dataState.mergedProgramForestMap[outcomeId];
		const tree = buildNewRegistryRecursive( registryId, masterNode, null, orphanedOwnedOutcomes, false );
		if( masterNode.selected !== SelectionState.NO ) {
			newForest.push( tree );
		}
	});
	
	return {
		newRegistryForest: newForest,
		orphanedOwnedOutcomes: orphanedOwnedOutcomes
	};
};

export default {
	initializeAsync: initializeAsync,
	selectProgram: selectProgram,
	buildNewRegistry: buildNewRegistry
};
