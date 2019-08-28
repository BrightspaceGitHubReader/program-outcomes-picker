import { CheckboxState } from './enums.js';
import Lores from './lores.js';

const commitChanges = function( dataState ) {
	if( dataState.currentTree ) {
		for( const outcomeState of dataState.currentTree.map.values() ) {
			if( outcomeState.checkboxState !== CheckboxState.NOT_CHECKED ) {
				dataState.selectedOutcomes.set( outcomeState.sourceId, outcomeState.parent ? outcomeState.parent.sourceId : null );
			} else {
				dataState.selectedOutcomes.delete( outcomeState.sourceId );
			}
		}
	}
};

const buildNewRegistryAsync = function( dataState, orgUnitId ) {
	commitChanges( dataState );
	
	const sourceData = [];
	dataState.selectedOutcomes.forEach( ( parentSourceId, sourceId ) => {
		sourceData.push({
			source_id: sourceId,
			source_type: 'asn'
		});
	});
	
	return Lores.createOutcomesAsync( orgUnitId, sourceData ).then( mappings => {
		const outcomeMappings = new Map();
		const newTreeMap = new Map();
		mappings.forEach( mapping => {
			const sourceId = mapping.source.source_id;
			const parentSourceId = dataState.selectedOutcomes.get( mapping.source.source_id ) || null;
			const outcomeId = mapping.id;
			
			outcomeMappings.set( sourceId, {
				sourceId: sourceId,
				parentSourceId: parentSourceId,
				outcomeId: outcomeId
			});
			
			newTreeMap.set( sourceId, {
				id: outcomeId,
				children: []
			});
		});
		
		const newRoots = [];
		dataState.selectedOutcomes.forEach( ( parentSourceId, sourceId ) => {
			const treeNode = newTreeMap.get( sourceId );
			if( !treeNode ) {
				return;
			}
			
			if( !parentSourceId ) {
				newRoots.push( treeNode );
			} else {
				const parentNode = newTreeMap.get( parentSourceId );
				if( parentNode ) {
					parentNode.children.push( treeNode );
				}
			}
		});
		
		const orphanedOutcomes = [];
		dataState.externalOutcomes.forEach( externalOutcome => {
			if( !externalOutcome.parentSourceId ) {
				newRoots.push( undecorateTree( externalOutcome.tree ) );
				return;
			}
			
			const treeNode = newTreeMap.get( externalOutcome.parentSourceId );
			if( treeNode ) {
				treeNode.children.push( undecorateTree( externalOutcome.tree ) );
			} else {
				orphanedOutcomes.push( externalOutcome.tree );
			}
		});
		
		return {
			newRegistryForest: newRoots,
			orphanedOutcomes: orphanedOutcomes
		};
	});
};

const undecorateTree = function( outcomeNode ) {
	return {
		id: outcomeNode.id,
		children: (outcomeNode.children || []).map( undecorateTree )
	};
};

export default {
	commitChanges: commitChanges,
	buildNewRegistryAsync: buildNewRegistryAsync,
	undecorateTree: undecorateTree
};
