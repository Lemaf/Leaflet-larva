/**
 * @class
 *
 * @param {L.larva.Undoable} undoable
 * @param {String} desc
 * @param {Function} doFn
 * @param {Function} undoFn
 */
L.larva.Command = L.Class.extend(
/** @lends L.larva.Command.prototype */
{

	statics: {
		APPLY: 1,
		UNAPPLY: 2
	},

	/**
	 * @type {L.larva.Command}
	 */
	next: null,
	/**
	 * @type {L.larva.Command}
	 */
	prev: null,

	initialize: function (undoable, desc, doFn, undoFn, args) {
		this._undoable = undoable;
		this._desc = desc;
		this._doFn = doFn;
		this._undoFn = undoFn;
		this._args = args;
	},

	apply: function () {
		try {
			if (!this._nextState || (this._nextState === L.larva.Command.APPLY)) {
				this._doFn.apply(this._undoable, this._args);
			}
		} finally {
			this._nextState = L.larva.Command.UNAPPLY;
		}
	},

	unapply: function () {
		try {
			if (!this._nextState || (this._nextState === L.larva.Command.UNAPPLY)) {
				this._undoFn.apply(this._undoable, this._args);
			}
		} finally {
			this._nextState = L.larva.Command.APPLY;
		}
	},
	/**
	 * @return {Number}
	 */
	nextState: function () {
		return this._nextState;
	}

});

/**
 * @param  {L.larva.Undoable} undoable
 * @param  {Function} doFn
 * @param  {Function} undoFn
 * @param  {Any[]} args
 * @return {L.larva.Command}
 */
L.larva.command = function (undoable, desc, doFn, undoFn, args) {
	return new L.larva.Command(undoable, desc, doFn, undoFn, args);
};