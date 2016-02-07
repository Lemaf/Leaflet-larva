/**
 * @class
 *
 * @param {L.larva.Undoable} undoable
 * @param {String} desc
 * @param {Function} doFn
 * @param {Function} undoFn
 */
L.larva.Command = L.Class.extend({

	initialize: function (undoable, desc, doFn, undoFn, args) {
		this._undoable = undoable;
		this._desc = desc;
		this._doFn = doFn;
		this._undoFn = undoFn;
		this._args = args;
	},

	apply: function () {
		this._doFn.apply(this._undoable, this._args);
	},

	unapply: function () {
		this._undoFn.apply(this._undoable, this._args);
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