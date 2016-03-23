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

L.larva.frame.RECT_STYLE.RESIZE = {
	className: 'llarva-frame-rect-resize',

	handleSuffix: 'resize',

	mm: {
		hide: true
	}
};

L.larva.frame.RECT_STYLE.ROTATE = {
	className: 'llarva-frame-rect-rotate',

	handleSuffix: 'rotate',

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