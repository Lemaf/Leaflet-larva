/**
 * @requires package.js
 */

/**
 * 
 * **L.larva.frame.RECT_STYLE.RESIZE**
 *
 * *Resizable* frame properties
 *
 * **L.larva.frame.RECT_STYLE.ROTATE**
 *
 * *Rotateable* frame properties
 * 
 */
L.larva.frame.RECT_STYLE = {};

/**
 * @type {Object}
 */
L.larva.frame.RECT_STYLE.RESIZE = {
	className: 'llarva-pathframe-resize',
	mm: {
		hide: true
	}
};

/**
 * @type {Object}
 */
L.larva.frame.RECT_STYLE.ROTATE = {
	className: 'llarva-pathframe-rotate',
	tm: {
		hide: true
	},

	ml: {
		hide: true
	},

	mr: {
		hide: true
	},

	bm: {
		hide: true
	},

	mm: {
		draggable: true
	}
};