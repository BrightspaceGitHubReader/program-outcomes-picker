import Lores from './lores.js';
import { SelectionState } from './enums.js';

const initializeAsync = function( dataState, registryId, programRegistryIds ) {
	const selectedLeafOutcomes = new Set();
	return Lores.fetchRegistryAsync( registryId ).then( function( registry ) {
		processRegistry( dataState, selectedLeafOutcomes, registry, false );
		return Promise.all( programRegistryIds.map( function( programRegistryId ) {
			return Lores.fetchRegistryAsync( programRegistryId ).then( function( programRegistry ) {
				dataState.programRegistries[programRegistryId] = programRegistry;
				processRegistry( dataState, selectedLeafOutcomes, programRegistry, true );
			});
		}));
	}).then( function() {
		selectedLeafOutcomes.forEach( outcomeId => {
			const outcome = dataState.mergedProgramForestMap[outcomeId];
			if( outcome.owner === registryId ) {
				dataState.ownedAuthoredLeafOutcomes.add( outcomeId );
			}
		});
		
		return Lores.getLockedOutcomesAsync( registryId ).then( lockedOutcomes => {
			lockedOutcomes.forEach( outcomeId => {
				let outcomeNode = dataState.mergedProgramForestMap[outcomeId];
				while( outcomeNode && !outcomeNode.locked ) {
					outcomeNode.locked = true;
					outcomeNode = outcomeNode.parent;
				}
			});
		});
	});
};

const processRegistry = function( dataState, selectedLeafOutcomes, registry, isProgram ) {
	registry.objectives.forEach( function( rootOutcome ) {
		dataState.rootOutcomes.add( rootOutcome.id );
		processOutcome( dataState, selectedLeafOutcomes, rootOutcome, null, isProgram );
	});
};

const processOutcome = function( dataState, selectedLeafOutcomes, outcome, parentNode, isProgram ) {
	const hasChildren = outcome.children && outcome.children.length;
	if( !dataState.mergedProgramForestMap[outcome.id] ) {
		const newNode = {
			outcome: outcome,
			parent: parentNode,
			children: [],
			selected: isProgram ? SelectionState.NO : ( hasChildren ? SelectionState.IMPLICIT : SelectionState.EXPLICIT ),
			locked: false
		};
		dataState.mergedProgramForestMap[outcome.id] = newNode;
		if( parentNode ) {
			parentNode.children.push( newNode );
		}
	}
	if( hasChildren ) {
		outcome.children.forEach( function( child ) {
			processOutcome( dataState, selectedLeafOutcomes, child, dataState.mergedProgramForestMap[outcome.id], isProgram );
		});
	} else if( !isProgram ) {
		selectedLeafOutcomes.add( outcome.id );
	}
};

export default initializeAsync;
