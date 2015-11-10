/**
 * @requires package.js
 */

L.larva.frame.Style = {
	
};

L.larva.frame.Style.Move = {
	className: 'llarva-pathframe-move',
	
	tl: {
		hide: true
	},

	tr: {
		hide: true
	},

	mm: {
		hide: true
	},

	bl: {
		hide: true
	},

	br: {
		hide: true
	}
};

L.larva.frame.Style.Resize = {
	className: 'llarva-pathframe-resize',
	mm: {
		hide: true
	}
};

L.larva.frame.Style.Rotate = {
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