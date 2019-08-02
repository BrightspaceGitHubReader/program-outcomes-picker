import { css } from 'lit-element/lit-element.js';

/* Temporary hard-coded styling for select until d2l-input is ported to Lit Element */

export default css`
	select {
		display: block;
		position: relative;
		vertical-align: middle;
		
		appearance: none;
		-moz-appearance: none;
		-webkit-appearance: none;
		
		min-height: calc(2rem + 2px);
		min-width: calc(2rem + 1em);
		box-sizing: border-box;
		margin: 0;
		padding: 0.4rem calc(0.75rem + 42px) 0.4rem 0.75rem;
		
		border: 1px solid var(--d2l-color-galena);
		border-radius: 0.3rem;
		box-shadow: inset 0 2px 0 0 rgba(181, 189, 194, .2);
		
		color: var(--d2l-color-ferrite);
		background-color: white;
		background-image: url("data:image/svg+xml,%3Csvg%20width%3D%2242%22%20height%3D%2242%22%20viewBox%3D%220%200%2042%2042%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20fill%3D%22%23f2f3f5%22%20d%3D%22M0%200h42v42H0z%22%2F%3E%3Cpath%20stroke%3D%22%23d3d9e3%22%20d%3D%22M0%200v42%22%2F%3E%3Cpath%20d%3D%22M14.99%2019.582l4.95%204.95a1.5%201.5%200%200%200%202.122%200l4.95-4.95a1.5%201.5%200%200%200-2.122-2.122L21%2021.35l-3.888-3.89a1.5%201.5%200%200%200-2.12%202.122z%22%20fill%3D%22%23565A5C%22%2F%3E%3C%2Fsvg%3E");
		background-position: right center;
		background-repeat: no-repeat;
		background-size: contain;
		transition: background-color 0.5s ease, border-color 0.001s ease;
		
		font-size: 0.8rem;
		font-weight: 400;
		letter-spacing: 0.02rem;
		line-height: 1.2rem;
	}
	
	
	:dir(rtl) select {
		background-position: left center;
	}
	
	/* Edge */
	:host([dir="rtl"]) select {
		background-position: left center;
	}
	
	select:hover, select:focus {
		border-color: var(--d2l-color-celestine);
		border-width: 2px;
		outline-style: none;
		outline-width: 0;
		padding: calc(0.4rem - 1px) calc(0.75rem + 41px) calc(0.4rem - 1px) calc(0.75rem - 1px);
	}
`;
