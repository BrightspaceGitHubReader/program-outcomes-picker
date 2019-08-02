import { html } from 'lit-element/lit-element.js';

const flattenList = function(doc, listElement) {
	const flattenedList = doc.createElement( 'span' );
	flattenedList.appendChild( doc.createTextNode(' ') );
	for( let i = 0; i < listElement.childNodes.length; i++ ) {
		const child = listElement.childNodes[i];
		if( !child.tagName || child.tagName.toLowerCase() !== 'li' ) {
			continue;
		}

		while( child.firstChild ) {
			flattenedList.appendChild( child.firstChild );
		}
		flattenedList.appendChild( doc.createTextNode(', ') );
	}

	flattenedList.replaceChild( doc.createTextNode(' '), flattenedList.lastChild );
	flattenedList.normalize();
	return flattenedList;
};

const proccessHTML = function( htmlDescription ) {
	const parsedHtml = new DOMParser().parseFromString( htmlDescription, 'text/html' );
	const listElements = parsedHtml.body.querySelectorAll( 'ul, ol, dl' );
	
	for( let i = 0; i < listElements.length; i++ ) {
		const list = listElements[i];
		list.parentElement.replaceChild( flattenList( parsedHtml, list ), list );
	}
	
	return parsedHtml.body.innerHTML;
};

const renderOutcome = function( outcome ) {
	const parts = [];
	const notation = outcome.notation || outcome.alt_notation;
	if( notation && notation.trim() ) {
		parts.push( html`<b>${notation.trim() + ' '}</b>` );
	}
	
	if( outcome.label && outcome.label.trim() ) {
		parts.push( html`<b>${outcome.label.trim() + ' '}` );
	}
	
	if( outcome.list_id && outcome.list_id.trim() ) {
		parts.push( html`<b>${outcome.list_id.trim() + ' '}` );
	}
	
	const description = (outcome.description || '').trim();
	if( description && outcome.source === 'asn' ) {
		parts.push( html`<span .innerHTML="${proccessHTML(description)}"></span>` );
	} else {
		parts.push( html`<span>${description}</span>` );
	}
	
	return html`${parts}`;
};

export default {
	render: renderOutcome
};
