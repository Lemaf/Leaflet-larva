L.larva = {
	version: '0.1.0'
};

// ############################################# 

L.larva.handler = {

};

// ############################################# 

/**
 * @requires package.js
 * 
 * Base class for Path handlers
 */
L.larva.handler.Path = L.Class.extend({

});

// ############################################# 

/**
 * @requires Path.js
 */
L.larva.handler.Polyline = L.larva.handler.Path.extend({

	options: {
		
	}

});

// ############################################# 

/**
 * @requires Polyline.js
 * 
 * @type {[type]}
 */
L.larva.handler.Polyline.Move = L.larva.handler.Polyline.extend({

});