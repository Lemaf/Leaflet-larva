!function(){L.larva={version:"0.1.0",getHeight:function(t){return t.offsetHeight},getWidth:function(t){return t.offsetWidth}},L.larva.handler={},L.larva.handler.Path=L.Handler.extend({includes:[L.Evented.prototype],initialize:function(t,a){L.setOptions(this,a),this._path=t}}),L.larva.handler.Polyline=L.larva.handler.Path.extend({options:{}}),L.larva.PathFrame=L.Layer.extend({options:{pane:"llarvaPathframe"},initialize:function(t){return t._pathFrame&&t._pathFrame instanceof L.larva.PathFrame?t._pathFrame:(t._pathFrame=this,void(this._path=t))},beforeAdd:function(t){t.getPane(this.options.pane)||t.createPane(this.options.pane)},getEvents:function(){return{zoom:this._onZoom}},getDraggable:function(){return this._draggable},getPosition:function(){return L.DomUtil.getPosition(this._el)},onAdd:function(){var t=this._el=L.DomUtil.create("div","llarva-pathframe",this.getPane());L.DomEvent.on(t,"mousedown",L.DomEvent.stop),this._elements={tl:null,tm:null,tr:null,ml:null,mm:null,mr:null,bl:null,bm:null,br:null};for(var a in this._elements)this._elements[a]=L.DomUtil.create("div","llarva-pathframe-"+a+" "+a,t);this._draggable=new L.Draggable(t),this._updateHandles(),this._onZoom()},_onZoom:function(){var t=this._path.getBounds(),a=this._map.latLngToLayerPoint(t.getSouthEast()),e=this._map.latLngToLayerPoint(t.getNorthWest());L.DomUtil.setPosition(this._el,e),this._el.style.width=a.x-e.x+"px",this._el.style.height=a.y-e.y+"px",this.southEastPoint=a,this.northWestPoint=e},_updateHandles:function(){var t,a,e,n=L.larva.getWidth;a=getComputedStyle(this._elements.el),t=this._elements.br,e=-(n(t)/2)+"px",L.extend(t.style,{right:e})}}),L.larva.pathFrame=function(t){return new L.larva.PathFrame(t)},L.Polyline.prototype.forEachLatLng||L.Polyline.include({forEachLatLng:function(t,a){var e=this.getLatLngs();e.length&&(Array.isArray(e[0])&&(e=e.reduce(function(t,a){return t.concat(a)},[])),e.forEach(t,a))}}),L.larva.handler.Polyline.Move=L.larva.handler.Polyline.extend({addHooks:function(){this._frame=new L.larva.PathFrame(this._path).addTo(this._path._map),this._draggable=this._frame.getDraggable(),this._draggable.on({drag:this._onDrag,dragstart:this._onDragStart,dragend:this._onDragEnd},this),this._draggable.enable()},_onDrag:function(){var t,a,e=this._path._map,n=this._frame.getPosition().subtract(this._layerProjectedPoint);console.log(n),this._path.forEachLatLng(function(i){t=e.latLngToLayerPoint(i._original),a=e.layerPointToLatLng(t.add(n)),i.lat=a.lat,i.lng=a.lng}),this._path.setLatLngs(this._path.getLatLngs())},_onDragEnd:function(){},_onDragStart:function(){this._layerProjectedPoint=this._path._map.latLngToLayerPoint(this._path.getBounds().getNorthWest()),this._path.forEachLatLng(function(t){t._original=t.clone()})}}),L.Polyline.addInitHook(function(){this.larva||(this.larva={}),this.larva.move=new L.larva.handler.Polyline.Move(this)})}();