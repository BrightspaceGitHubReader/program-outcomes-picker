// Get the status of hidden outcomes leaves (outcomes that are leaf nodes in the
// current resgitry, but are not present in any of the available programs)
const processHiddenOutcomes = function( dataState ) {
	const attachedOutcomes = [];
	const orphanedOutcomes = [];
	
	dataState.initialLeafNodes.forEach( function( objectiveId ) {
		if(
			dataState.selectedLeafNodes.has( objectiveId ) ||
			dataState.programLeafNodes.has( objectiveId )
		) {
			return;
		}
		
		for( let ancestor = dataState.outcomeNodes[objectiveId]; ancestor; ancestor = ancestor.parent ) {
			if( dataState.programLeafNodes.has( ancestor.outcome.id ) ) {
				attachedOutcomes.push( objectiveId );
				return;
			}
		}
		
		if( isAuthoredOutcome( dataState, objectiveId ) ) {
			orphanedOutcomes.push( objectiveId );
		}
	});
	
	return {
		attachedOutcomes: attachedOutcomes,
		orphanedOutcomes: orphanedOutcomes
	};
};

const getAllAncestors = function( dataState, outcomes ) {
	const results = new Set();
	outcomes.forEach( function( objectiveId ) {
		let outcome = dataState.outcomeNodes[objectiveId];
		while( outcome ) {
			results.add( outcome.outcome.id );
			outcome = outcome.parent;
		}
	});
	return results;
};

const buildNewRegistryTree = function( dataState ) {
	const processedOutcomes = {};
	const roots = [];
	
	dataState.selectedLeafNodes.forEach( function( objectiveId ) {
		if( processedOutcomes[objectiveId] ) {
			return;
		}
		
		let childNode = {
			id: objectiveId,
			children: []
		};
		processedOutcomes[objectiveId] = childNode;
		
		let ancestor = dataState.outcomeNodes[objectiveId].parent;
		while( ancestor && !processedOutcomes[ancestor.outcome.id] ) {
			childNode = {
				id: ancestor.outcome.id,
				children: [ childNode ]
			};
			processedOutcomes[ancestor.outcome.id] = childNode;
			ancestor = ancestor.parent;
		}
		
		if( ancestor ) {
			processedOutcomes[ancestor.outcome.id].children.push( childNode );
		} else {
			roots.push( childNode );
		}
		
	});
	
	return roots;
};

export default {
	processHiddenOutcomes: processHiddenOutcomes,
	getAllAncestors: getAllAncestors,
	buildNewRegistryTree: buildNewRegistryTree
};
