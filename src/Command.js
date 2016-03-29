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

	initialize: function (config) {
		this._undoable = config.undoable;
		this._desc = config.desc;
		this._doFn = config.doFn;
		this._doArgs = config.doArgs || Array.prototype;
		this._undoFn = config.undoFn;
		this._undoArgs = config.undoArgs || Array.prototype;

		if (config.applied) {
			this._nextState = L.larva.Command.UNAPPLY;
		}
	},
	/**
	 */
	apply: function () {
		if (!this._nextState || (this._nextState === L.larva.Command.APPLY)) {
			try {
				this._doFn.apply(this._undoable, this._doArgs);
			} finally {
				this._nextState = L.larva.Command.UNAPPLY;
			}
		}
	},

	description: function () {
		return this._desc;
	},

	/**
	 * @return {Number}
	 */
	nextState: function () {
		return this._nextState;
	},

	/**
	 */
	unapply: function () {
		if (!this._nextState || (this._nextState === L.larva.Command.UNAPPLY)) {
			try {
					this._undoFn.apply(this._undoable, this._undoArgs);
			} finally {
				this._nextState = L.larva.Command.APPLY;
			}
		}
	},

	/**
	 * @return {*}
	 */
	undoable: function () {
		return this._undoable;
	}
});

/**
 * @param  {L.larva.Undoable} undoable
 * @param  {Function} doFn
 * @param  {Function} undoFn
 * @param  {Any[]} args
 * @return {L.larva.Command}
 */
L.larva.command = function (config) {
	return new L.larva.Command(config);
};