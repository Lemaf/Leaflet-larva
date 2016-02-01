!function(){L.larva={version:"0.1.1",CTRL_KEY:17,NOP:function(){},getEventKeyCode:function(t){return t.keyCode||t.key},getHeight:function(t){return t.offsetHeight},getSourceEvent:function(t){return t.sourceEvent&&(t=t.sourceEvent),t.touches?t.touches[0]:t},getWidth:function(t){return t.offsetWidth},isFlat:function(t){return Array.isArray(t)&&t[0]instanceof L.LatLng?!0:!1},project:function(t){var e=L.Projection.Mercator.project(t);return e.y=0-e.y,e},unproject:function(t){return t=t.clone(),t.y=0-t.y,L.Projection.Mercator.unproject(t)}},L.larva.frame={},L.larva.frame.Rect=L.Layer.extend({statics:{TOP_LEFT:"tl",TOP_MIDDLE:"tm",TOP_RIGHT:"tr",MIDDLE_LEFT:"ml",MIDDLE_MIDDLE:"mm",MIDDLE_RIGHT:"mr",BOTTOM_LEFT:"bl",BOTTOM_MIDDLE:"bm",BOTTOM_RIGHT:"br"},options:{pane:"llarva-frame"},initialize:function(t){this._path=t},beforeAdd:function(t){t.getPane(this.options.pane)||t.createPane(this.options.pane)},getComputedStyle:function(t){return t?this._handles[t]?getComputedStyle(this._handles[t]):void 0:getComputedStyle(this._el)},getEvents:function(){return{zoom:this._onMapZoom}},getDraggable:function(){return this._draggable},getFrameClientRect:function(){return this._el.getBoundingClientRect()},getHandle:function(t){return this._handles[t]},getPosition:function(t){return t?L.DomUtil.getPosition(this._handles[t]):L.DomUtil.getPosition(this._el)},hideHandle:function(){for(var t=0;t<arguments.length;t++)this._handles[arguments[t]]&&(this._handles[arguments[t]].style.display="none")},onAdd:function(){var t=this._el=L.DomUtil.create("div","llarva-pathframe",this.getPane());L.DomEvent.on(t,L.Draggable.START.join(" "),this._onStart,this),this._handles={},["tl","tm","tr","ml","mm","mr","bl","bm","br"].forEach(function(e){this._handles[e]=L.DomUtil.create("div","llarva-"+e,t),this._handles[e]._id=e,L.DomEvent.on(this._handles[e],L.Draggable.START.join(" "),this._onStart,this)},this),this._draggable=new L.Draggable(t),this._draggables={},this._updateFrame(!1),this._updateHandles()},onRemove:function(){var t;this._draggable&&this._draggable.disable();for(t in this._draggables)this._draggables[t].disable();L.DomEvent.off(this._el,"mousedown click",L.DomEvent.stop);for(t in this._handles)L.DomEvent.off(this._handles[t],"mousedown click",L.DomEvent.stop);L.DomUtil.remove(this._el),L.DomUtil.empty(this._el),delete this._el},setElementStyle:function(t,e){e?(e=this._handles[e],e&&L.extend(e.style,t)):L.extend(this._el.style,t)},setStyle:function(t){var e,n,a=this._style;for(e in this._handles)n=this._handles[e],n.style.display="block",this._draggables[e]&&(this._draggables[e].disable(),delete this._draggables[e]),t[e]&&(t[e].hide&&(n.style.display="none"),t[e].draggable&&(this._draggables[e]=new L.Draggable(n),this._draggables[e].enable(),L.DomEvent.off(n,"mousedown click",L.DomEvent.stop)));a&&L.DomUtil.removeClass(this._el,a.className),L.DomUtil.addClass(this._el,t.className),this._style=t,this._updateHandles();for(e in this._draggables)this._updateDraggable(e)},updateBounds:function(){this._updateFrame(!1,Array.prototype.slice.call(arguments,0))},_onEnd:function(t){L.DomEvent.stop(t);for(var e in L.Draggable.MOVE)L.DomEvent.off(document,L.Draggable.MOVE[e],this._onMove,this).off(document,L.Draggable.END[e],this._onEnd,this);L.DomUtil.removeClass(document.body,"leaflet-dragging"),this.fire("drag:end",{sourceEvent:t})},_onMapZoom:function(){this._updateFrame(!0)},_onMove:function(t){L.DomEvent.stop(t),this.fire("drag:move",{sourceEvent:t})},_onStart:function(t){L.DomEvent.stop(t),this.fire("drag:start",{sourceEvent:t,handle:t.target._id}),L.DomEvent.on(document,L.Draggable.MOVE[t.type],this._onMove,this).on(document,L.Draggable.END[t.type],this._onEnd,this),L.DomUtil.addClass(document.body,"leaflet-dragging")},_updateDraggable:function(t){var e=this._handles[t],n=e.offsetLeft,a=e.offsetTop;e.style.marginLeft&&(n-=parseInt(e.style.marginLeft)),e.style.marginTop&&(a-=parseInt(e.style.marginTop)),L.extend(e.style,{left:"0px",top:"0px"}),L.DomUtil.setPosition(e,L.point(n,a))},_updateFrame:function(t,e){var n,a,i,o=L.DomUtil.getPosition(this._el),r=this._path.getBounds(),s=this._map.latLngToLayerPoint(r.getSouthEast()),l=this._map.latLngToLayerPoint(r.getNorthWest()),h=getComputedStyle(this._el);if(e&&e.length&&o)for(var d=0;d<e.length;d++)a=this._handles[e[d]],a&&(i=L.DomUtil.getPosition(a))&&(i=i.add(o),L.DomUtil.setPosition(a,i.subtract(l)));L.DomUtil.setPosition(this._el,l);var _,c,f=parseInt(h.borderLeftWidth)+parseInt(h.borderRightWidth),g=parseInt(h.borderTopWidth)+parseInt(h.borderBottomWidth);if(t&&(_=L.larva.getWidth(this._el),c=L.larva.getHeight(this._el)),this._el.style.width=s.x-l.x-f+"px",this._el.style.height=s.y-l.y-g+"px",t)for(n in this._handles)a=this._handles[n],i=L.DomUtil.getPosition(a),i&&L.DomUtil.setPosition(a,i.scaleBy(L.point(L.larva.getWidth(this._el)/_,L.larva.getHeight(this._el)/c)));this.southEastPoint=s,this.northWestPoint=l},_updateHandles:function(){var t,e,n,a,i,o,r=L.larva.getWidth,s=L.larva.getHeight;e=getComputedStyle(this._el);var l={bottom:"borderBottomWidth",left:"borderLeftWidth",right:"borderRightWidth",top:"borderTopWidth"};for(var h in l)l[h]=parseInt(e[l[h]])/2;t=this._handles.br,n=-(r(t)/2)-l.right+"px",a=-(s(t)/2)-l.bottom+"px",L.extend(t.style,{right:n,bottom:a}),t=this._handles.bm,i=-(r(t)/2)+"px",a=-(s(t)/2)-l.bottom+"px",L.extend(t.style,{left:"50%","margin-left":i,bottom:a}),t=this._handles.bl,i=-(r(t)/2)-l.left+"px",a=-(s(t)/2)-l.bottom+"px",L.extend(t.style,{left:i,bottom:a}),t=this._handles.mm,i=-(r(t)/2)+"px",o=-(s(t)/2)+"px",L.extend(t.style,{top:"50%",left:"50%","margin-left":i,"margin-top":o}),t=this._handles.ml,o=-(s(t)/2)+"px",i=-(r(t)/2)-l.left+"px",L.extend(t.style,{top:"50%","margin-top":o,left:i}),t=this._handles.mr,n=-(r(t)/2)-l.right+"px",o=-(s(t)/2)+"px",L.extend(t.style,{right:n,top:"50%","margin-top":o}),t=this._handles.tr,n=-(r(t)/2)-l.right+"px",o=-(s(t)/2)-l.top+"px",L.extend(t.style,{right:n,top:o}),t=this._handles.tm,o=-(s(t)/2)-l.top+"px",i=-(r(t)/2)+"px",L.extend(t.style,{left:"50%","margin-left":i,top:o}),t=this._handles.tl,o=-(s(t)/2)-l.top+"px",i=-(r(t)/2)-l.left+"px",L.extend(t.style,{left:i,top:o})}}),L.larva.frame.rect=function(t){return t&&t._rectFrame?t._rectFrame:t._rectFrame=new L.larva.frame.Rect(t)},L.larva.frame.RECT_STYLE={},L.larva.frame.RECT_STYLE.RESIZE={className:"llarva-pathframe-resize",mm:{hide:!0}},L.larva.frame.RECT_STYLE.ROTATE={className:"llarva-pathframe-rotate",tm:{hide:!0},ml:{hide:!0},mr:{hide:!0},bm:{hide:!0},mm:{draggable:!0}},L.Polyline.prototype.forEachLatLng||L.Polyline.include({forEachLatLng:function(t,e){for(var n,a,i,o=[this.getLatLngs()],r=e?function(n){t.call(e,n)}:t;o.length;)for(n=o.pop(),a=0,i=n.length;i>a;a++)Array.isArray(n[a])?o.push(n[a]):r(n[a])}}),L.Polyline.prototype.updateBounds||L.Polyline.include({updateBounds:function(){var t=this._bounds=new L.LatLngBounds;this.forEachLatLng(function(e){t.extend(e)})}}),L.Polyline.prototype.getType||(L.extend(L.Polyline,{POLYLINE:1,MULTIPOLYLINE:2}),L.Polyline.include({getType:function(){return Array.isArray(this._latlngs[0])?L.Polyline.MULTIPOLYLINE:L.Polyline.POLYLINE}})),L.Polyline.include({forEachLine:function(t,e){switch(this.getType()){case L.Polyline.POLYLINE:case L.Polyline.MULTIPOLYLINE:if(Array.isArray(this._latlngs[0]))for(var n=0;n<this._latlngs.length;n++)t.call(e,this._latlngs[n]);else t.call(e,this._latlngs);break;default:throw new Error("Invalid geometry type!")}}}),L.larva.handler={},L.larva.handler.Path=L.Handler.extend({includes:[L.Evented.prototype],initialize:function(t,e){L.setOptions(this,e),this._path=t},getMap:function(){return this._path._map},layerPointToWorldPoint:function(t,e){return L.larva.project(this.unproject(t,e))},unproject:function(t,e){return void 0!==e?this.getMap().layerPointToLatLng(L.point(t,e)):this.getMap().layerPointToLatLng(t)}}),L.Path.addInitHook(function(){this.larva={}}),L.larva.handler.Polyline=L.larva.handler.Path.extend({backupLatLngs:function(){this._path.forEachLatLng(function(t){t._original=t.clone()})}}),L.larva.handler.Polyline.Transform=L.larva.handler.Polyline.extend({options:{noUpdate:[]},initialize:function(t,e,n){L.larva.handler.Polyline.prototype.initialize.call(this,t,n),this._frameStyle=e},transform:function(){var t,e,n=L.point(0,0),a=[null,n].concat(Array.prototype.slice.call(arguments,0));this._path.forEachLatLng(function(i){t=a[0]=L.larva.project(i._original),n.x=t.x,n.y=t.y,this.transformPoint.apply(this,a),e=L.larva.unproject(n),i.lat=e.lat,i.lng=e.lng},this),this._path.updateBounds(),this._frame.updateBounds.apply(this._frame,this.options.noUpdate),this._path.redraw()},transformPoint:function(){throw new Error("Unsupported Operation!")}}),L.larva.handler.Polyline.Rotate=L.larva.handler.Polyline.Transform.extend({options:{noUpdate:[L.larva.frame.Rect.MIDDLE_MIDDLE]},addHooks:function(){this._frame=L.larva.frame.rect(this._path),this._frame.addTo(this.getMap()),this._frame.setStyle(this._frameStyle),this._frame.on("drag:start",this._onStart,this)},transformPoint:function(t,e,n,a,i,o){e.x=t.x*a-t.y*n+i,e.y=t.x*n+t.y*a+o},_onEnd:function(){this._frame.off("drag:move",this._onMove,this).off("drag:end",this._onEnd,this)},_onMove:function(t){var e=L.larva.getSourceEvent(t),n=this._centerElement.getBoundingClientRect(),a=n.left+n.width/2,i=n.top+n.height/2,o=e.clientX-a,r=e.clientY-i,s=Math.sqrt(o*o+r*r),l=(this._vector.i*r-this._vector.j*o)/s,h=(this._vector.i*o+this._vector.j*r)/s,d=this._frame.getFrameClientRect(),_=this._frame.getPosition();a=a-d.left+_.x,i=i-d.top+_.y;var c=this.layerPointToWorldPoint(a,i),f=c.x*(1-h)+c.y*l,g=c.y*(1-h)-c.x*l;this.transform(l,h,f,g)},_onStart:function(t){if(t.handle&&t.handle!==L.larva.frame.Rect.MIDDLE_MIDDLE){var e=this._centerElement=this._frame.getHandle(L.larva.frame.Rect.MIDDLE_MIDDLE),n=e.getBoundingClientRect(),a=t.sourceEvent.target.getBoundingClientRect(),i=this._vector={i:a.left+a.width/2-(n.left-n.width/2),j:a.top+a.height/2-(n.top-n.height/2)};i.length=Math.sqrt(i.i*i.i+i.j*i.j),i.i=i.i/i.length,i.j=i.j/i.length,i.length=1,this.backupLatLngs(),this._frame.on("drag:move",this._onMove,this).on("drag:end",this._onEnd,this)}}}),L.Polyline.addInitHook(function(){this.larva.rotate=new L.larva.handler.Polyline.Rotate(this,L.larva.frame.RECT_STYLE.ROTATE)}),L.larva.handler.Polyline.Move=L.larva.handler.Polyline.Transform.extend({addHooks:function(){this._frame=L.larva.frame.rect(this._path).addTo(this.getMap()),this._frame.on("drag:start",this._onStart,this),this._previousCursor=this._frame.getComputedStyle().cursor,this._frame.setElementStyle({cursor:"move"})},transformPoint:function(t,e,n,a){n&&(e.x=t.x+n),a&&(e.y=t.y+a)},_getEventWorldPoint:function(t){var e=this._frame.getFrameClientRect(),n=this._frame.getPosition();return L.larva.project(this.unproject(t.clientX-e.left+n.x,t.clientY-e.top+n.y))},_onEnd:function(){this._frame.off("drag:move",this._onMove,this).off("drag:end",this._onEnd)},_onMove:function(t){var e=L.larva.getSourceEvent(t),n=this._getEventWorldPoint(e),a=n.x-this._startPosition.x,i=n.y-this._startPosition.y;if(e.ctrlKey&&e.altKey){var o=Math.min(Math.abs(a),Math.abs(i));a=a>=0?o:-o,i=i>=0?o:-o}else e.altKey?i=null:e.ctrlKey&&(a=null);this.transform(a,i)},_onStart:function(t){t.handle||(this.backupLatLngs(),this._startPosition=this._getEventWorldPoint(L.larva.getSourceEvent(t)),this._frame.on("drag:move",this._onMove,this).on("drag:end",this._onEnd,this))}}),L.Polyline.addInitHook(function(){this.larva.move=new L.larva.handler.Polyline.Move(this)}),L.larva.handler.Polyline.Resize=L.larva.handler.Polyline.Transform.extend({addHooks:function(){this._frame=L.larva.frame.rect(this._path).addTo(this.getMap()),this._frame.setStyle(this._frameStyle),this._frame.on("drag:start",this._onStart,this)},transformPoint:function(t,e,n,a){null!==n&&(e.x=this._reference.point.x+n*(t.x-this._reference.point.x)),null!==a&&(e.y=this._reference.point.y+a*(t.y-this._reference.point.y))},_onEnd:function(){this._frame.off("drag:move",this._onMove,this).off("drag:end",this._onEnd,this),delete this._reference},_onMove:function(t){var e=L.larva.getSourceEvent(t),n=null,a=null;if(void 0!==this._reference.screenX&&(n=(e.clientX-this._reference.screenX)/this._reference.width,this._reference.invertX&&(n=-n)),void 0!==this._reference.screenY&&(a=(e.clientY-this._reference.screenY)/this._reference.height,this._reference.invertY&&(a=-a)),null!==n&&null!==a&&e.ctrlKey){var i=Math.max(Math.abs(n),Math.abs(a));n=n>=0?i:-i,a=a>=0?i:-i}this.transform(n,a)},_onStart:function(t){if(t.handle&&t.handle!==L.larva.frame.Rect.MIDDLE_MIDDLE){var e=this._frame.getFrameClientRect(),n=this._frame.getPosition(),a=this._reference={height:e.height,width:e.width};switch(t.handle){case L.larva.frame.Rect.TOP_LEFT:case L.larva.frame.Rect.MIDDLE_LEFT:case L.larva.frame.Rect.BOTTOM_LEFT:a.screenX=e.right;break;case L.larva.frame.Rect.TOP_MIDDLE:case L.larva.frame.Rect.BOTTOM_MIDDLE:a.screenX=e.left+a.width/2;break;case L.larva.frame.Rect.TOP_RIGHT:case L.larva.frame.Rect.MIDDLE_RIGHT:case L.larva.frame.Rect.BOTTOM_RIGHT:a.screenX=e.left}switch(t.handle){case L.larva.frame.Rect.TOP_LEFT:case L.larva.frame.Rect.TOP_MIDDLE:case L.larva.frame.Rect.TOP_RIGHT:a.screenY=e.bottom;break;case L.larva.frame.Rect.MIDDLE_LEFT:case L.larva.frame.Rect.MIDDLE_RIGHT:a.screenY=e.top+a.height/2;break;case L.larva.frame.Rect.BOTTOM_LEFT:case L.larva.frame.Rect.BOTTOM_MIDDLE:case L.larva.frame.Rect.BOTTOM_RIGHT:a.screenY=e.top}switch(t.handle){case L.larva.frame.Rect.TOP_LEFT:case L.larva.frame.Rect.MIDDLE_LEFT:case L.larva.frame.Rect.BOTTOM_LEFT:a.invertX=!0}switch(t.handle){case L.larva.frame.Rect.TOP_LEFT:case L.larva.frame.Rect.TOP_MIDDLE:case L.larva.frame.Rect.TOP_RIGHT:a.invertY=!0}switch(a.point=this.layerPointToWorldPoint(a.screenX-e.left+n.x,a.screenY-e.top+n.y),t.handle){case L.larva.frame.Rect.TOP_MIDDLE:case L.larva.frame.Rect.BOTTOM_MIDDLE:delete a.screenX;break;case L.larva.frame.Rect.MIDDLE_LEFT:case L.larva.frame.Rect.MIDDLE_RIGHT:delete a.screenY}this.backupLatLngs(),this._frame.on("drag:move",this._onMove,this).on("drag:end",this._onEnd,this)}}}),L.Polyline.addInitHook(function(){this.larva.resize=new L.larva.handler.Polyline.Resize(this,L.larva.frame.RECT_STYLE.RESIZE)}),L.extend(L.Polygon,{POLYGON:3,MULTIPOLYGON:4}),L.Polygon.include({getType:function(){var t=this._latlngs;return t.length&&!L.larva.isFlat(t[0])?L.Polygon.MULTIPOLYGON:L.Polygon.POLYGON},forEachPolygon:function(t,e){var n=this._latlngs;switch(this.getType()){case L.Polygon.POLYGON:e?t.call(e,n[0],n.slice(1)):t(n[0],n.slice(1));break;case L.Polygon.MULTIPOLYGON:for(var a=0,i=n.length;i>a;a++)e?t.call(e,n[a][0],n[a].slice(1)):t(n[a][0],n[a].slice(1))}}}),L.larva.Style=L.Class.extend({statics:{STYLES:["fillOpacity","fillColor","color","opacity"],TYPE:{fillOpacity:"number",opacity:"number",fillColor:"color",color:"color"}},initialize:function(t){t instanceof L.Path&&(t=t.options),L.larva.Style.STYLES.forEach(function(e){this[e]=t[e]},this)},subtract:function(t){return this._transform(t,function(t,e){return t-e})},multiplyBy:function(t){return this._transform(t,function(t,e){return t*e})},_transform:function(t,e){var n,a,i;for(n in t)if(n in this){switch(a=this[n],i=t[n],L.larva.Style.TYPE[n]){case"color":var o=L.larva.Style.getRGB(a);o&&(o[0]=e(o[0],i[0]),o[1]=e(o[1],i[1]),o[2]=e(o[2],i[2]),o=o.map(L.larva.Style.convertColorComponent),a="#"+o.join(""));break;case"number":a=e(a,i)}this[n]=a}return this}}),L.larva.Style.getRGB=function(t){if(t){var e,n,a;if(4===t.length)e=parseInt(t[1],16),n=parseInt(t[2],16),a=parseInt(t[3],16);else{if(7!==t.length)return;e=parseInt(t.substr(1,2),16),n=parseInt(t.substr(3,2),16),a=parseInt(t.substr(5,2),16)}return[e,n,a]}},L.larva.Style.convertColorComponent=function(t){return 0>t?t=0:t>255&&(t=255),t=parseInt(t).toString(16),2===t.length?t:"0"+t},L.larva.style=function(t){return new L.larva.Style(t)},L.larva.frame.Vertices=L.Layer.extend({statics:{MULTIPOLYGON:4,MULTIPOLYLINE:3,POLYGON:2,POLYLINE:1},options:{colorFactor:[2,.5,2],handleClassName:"llarva-vertex",opacityFactor:.5,pane:"llarva-frame",tolerance:10,simplifyZoom:-1},initialize:function(t){this._path=t},beforeAdd:function(t){t.getPane(this.options.pane)||t.createPane(this.options.pane)},getEvents:function(){return{moveend:this._updateView,zoomend:this._onZoomEnd}},getLatLng:function(t){return this._handles&&this._handles[t]?this._handles[t]._latlng:void 0},getPosition:function(t){return this._handles&&this._handles[t]?this._handles[t]._layerPoint:void 0},onAdd:function(){this._container=this.getPane(),this._updateHandles(),this._updateView()},onRemove:function(){var t,e;if(this._handles){for(t in this._handles)e=this._handles[t],e.offsetParent&&L.DomUtil.remove(e);delete this._handles}},createAura:function(t){var e=this._handles[t];if(!e)return!1;if(this._aura||(this._aura={}),!this._aura[t]){var n,a,i=[],o=e._latlng.clone(),r=L.larva.style(this._path).multiplyBy({color:this.options.colorFactor,opacity:this.options.opacityFactor});e._isPolygon?(a=e._prev?e._prev._latlng:e._last._latlng,i.push(a.clone()),i.push(o),a=e._next?e._next._latlng:e._first._latlng,i.push(a.clone())):(e._prev&&i.push(e._prev._latlng.clone()),i.push(o),e._next&&i.push(e._next._latlng.clone())),n=L.polyline(i,L.extend({},r,{noClip:!0})).addTo(this._map),this._aura[t]={isPolygon:!!e._isPolygon,polyline:n,latlng:o}}return!0},redraw:function(){return this._updateHandles(),this._updateView(),this},stopAura:function(t,e){var n;this._aura&&(n=this._aura[t])&&(this._map.removeLayer(this._aura[t].polyline),delete this._aura[t],e&&this._setLatLng(t,n.latlng))},updateAura:function(t,e){var n=this._aura?this._aura[t]:null;if(n){var a=this._map.layerPointToLatLng(e);n.latlng.lat=a.lat,n.latlng.lng=a.lng,n.polyline.updateBounds(),n.polyline.redraw(),this._updatePosition(this._handles[t],e)}},updateHandle:function(t){var e=this._handles[t];e&&(delete e._layerPoint,this._updatePosition(e))},_setLatLng:function(t,e){var n=this._handles[t];n&&(n._latlng.lat=e.lat,n._latlng.lng=e.lng,delete n._layerPoint,this._updatePosition(n),this._path.updateBounds(),this._path.redraw())},_createHandles:function(t,e,n){var a,i,o,r,s=[];for(a=0;a<t.length;a++)i=L.DomUtil.create("div",this.options.handleClassName),e&&(i._isPolygon=!0),n&&(i._isHole=!0),i._latlng=t[a],i._layerPoint=this._map.latLngToLayerPoint(i._latlng),L.DomEvent.on(i,L.Draggable.START.join(" "),this._onStart,this),this._handles[L.stamp(i)]=i,o?(o._next=i,i._prev=o,o=i,e&&r&&(i._first=r)):(r=i,o=i),s.push(i);return e&&(r._last=i),this._lines.push({handles:s,isHole:!!n,isPolygon:!!e}),s},_onEnd:function(t){L.DomEvent.stop(t);for(var e in L.Draggable.MOVE)L.DomEvent.off(document,L.Draggable.MOVE[e],this._onMove,this).off(document,L.Draggable.END[e],this._onEnd,this);L.DomUtil.removeClass(document.body,"leaflet-dragging"),this.fire("drag:end",{sourceEvent:t})},_onMove:function(t){L.DomEvent.stop(t),this.fire("drag:move",{sourceEvent:t})},_onStart:function(t){L.DomEvent.stop(t),this.fire("drag:start",{id:L.stamp(t.target),sourceEvent:t}),L.DomEvent.on(document,L.Draggable.MOVE[t.type],this._onMove,this).on(document,L.Draggable.END[t.type],this._onEnd,this),L.DomUtil.addClass(document.body,"leaflet-dragging")},_onZoomEnd:function(){var t,e;for(t in this._handles)e=this._handles[t],e._layerPoint=this._map.latLngToLayerPoint(e._latlng)},_updateHandles:function(){var t,e;if(this._handles)for(t in this._handles)e=this._handles[t],L.DomUtil.remove(e);this._handles={},this._lines=[];var n=this._path.getType();switch(n){case L.Polyline.POLYLINE:case L.Polyline.MULTIPOLYLINE:this._path.forEachLine(function(t){this._createHandles(t)},this);break;case L.Polygon.POLYGON:case L.Polygon.MULTIPOLYGON:this._path.forEachPolygon(function(t,e){this._createHandles(t,!0),e.forEach(function(t){this._createHandles(t,!0,!0)},this)},this);break;default:throw new Error("Invalid geometry type")}},_updatePosition:function(t,e){var n;e?n=e.clone():t._layerPoint?n=t._layerPoint.clone():(t._layerPoint=this._map.latLngToLayerPoint(t._latlng),n=t._layerPoint.clone()),t.offsetParent&&n._subtract({x:L.larva.getWidth(t)/2,y:L.larva.getHeight(t)/2}),L.DomUtil.setPosition(t,n)},_showHandles:function(t,e){var n,a=this._map.getPixelBounds(),i=this._map.getPixelOrigin(),o=t.map(function(t){var e=t._layerPoint.add(i);return e._handle=t,e});if(e)n=L.PolyUtil.clipPolygon(o,a).filter(function(t){return!!t._handle});else{var r,s,l;for(n=[],r=0,s=o.length-1;s>r;r++)l=L.LineUtil.clipSegment(o[r],o[r+1],a),l&&(l[0]._handle&&n.push(l[0]),l[1]._handle&&n.push(l[1]))}var h=!1;this.options.simplifyZoom>0?h=this._map.getZoom()<this.options.simplifyZoom:this.options.simplifyZoom<0&&(h=this._map.getZoom()<this._map.getMaxZoom()+this.options.simplifyZoom),h&&(n=L.LineUtil.simplify(n,this.options.tolerance)),n.forEach(function(t){t.offsetParent||this._container.appendChild(t._handle),this._updatePosition(t._handle)},this)},_updateView:function(){var t,e;for(t in this._handles)e=this._handles[t],e.offsetParent&&L.DomUtil.remove(e);this._lines.forEach(function(t){this._showHandles(t.handles,t.isPolygon,t.isHole)},this)}}),L.larva.frame.vertices=function(t){return t._verticesFrame?t._verticesFrame:t._verticesFrame=new L.larva.frame.Vertices(t)},L.larva.handler.Polyline.Edit=L.larva.handler.Polyline.extend({options:{aura:!0,maxDist:10},addHooks:function(){this._frame=L.larva.frame.vertices(this._path).addTo(this.getMap()),this._frame.on("drag:start",this._onDragStart,this),this._path.on("dblclick",this._onPathDblClick,this)},removeHooks:function(){this.getMap().removeLayer(this._frame),this._frame.off("drag:start",this._onDragStart,this).off("dblclick",this._onPathDblClick,this)},_searchNearestPoint:function(t){var e=[],n=this.getMap();return this._path.forEachLine(function(a){e=e.concat(L.larva.handler.Polyline.Edit.searchNearestPointIn(t,this.options.maxDist,a,n))},this),e},_addVertex:function(t){var e,n,a;e=this._searchNearestPoint(t),e.length&&1===e.length&&(n=e[0],a=this.getMap().layerPointToLatLng(n.point),n.latlngs.splice(n.index,0,a),this._path.updateBounds(),this._path.redraw(),this._frame.redraw())},_onPathDblClick:function(t){L.DomEvent.stop(t),this._addVertex(this.getMap().mouseEventToLayerPoint(t.originalEvent))},_onDragEnd:function(){this._frame.off("drag:move",this._onDragMove,this).off("drag:end",this._onDragEnd,this),this.options.aura&&(this._frame.stopAura(this._handleId,!0),this._path.updateBounds(),this._path.redraw())},_onDragMove:function(t){var e=L.larva.getSourceEvent(t),n=e.clientX-this._startPos.x,a=e.clientY-this._startPos.y,i=this._original.add(L.point(n,a));if(this._aura)this._frame.updateAura(this._handleId,i);else{var o=this._frame.getLatLng(this._handleId),r=this.getMap().layerPointToLatLng(i);o.lat=r.lat,o.lng=r.lng,this._path.updateBounds(),this._frame.updateHandle(this._handleId),this._path.redraw()}},_onDragStart:function(t){var e=L.larva.getSourceEvent(t);this._original=this._frame.getPosition(t.id).clone(),this._handleId=t.id,this._startPos={x:e.clientX,y:e.clientY},this.options.aura?this._aura=this._frame.createAura(t.id):delete this._aura,this._frame.on("drag:move",this._onDragMove,this).on("drag:end",this._onDragEnd,this)}}),L.larva.handler.Polyline.Edit.searchNearestPointIn=function(t,e,n,a,i){var o,r,s,l,h,d,_=[];for(h=i?n.length:n.length-1,s=0;h>s;s++)l=(s+1)%n.length,o=a.latLngToLayerPoint(n[s]),r=a.latLngToLayerPoint(n[l]),d=L.LineUtil.pointToSegmentDistance(t,o,r),e>=d&&_.push({point:L.LineUtil.closestPointOnSegment(t,o,r),index:l,latlngs:n});return _},L.larva.handler.Polygon=L.larva.handler.Path.extend({}),L.larva.Util={pointIsInside:function(t,e){var n,a,i=!1;for(n=0,a=e.length-1;n<e.length;a=n++)e[n].y>t.y!=e[a].y>t.y&&t.x<(e[a].x-e[n].x)*(t.y-e[n].y)/(e[a].y-e[n].y)+e[n].x&&(i=!i);return i}},L.larva.handler.New=L.Handler.extend({includes:[L.Evented.prototype],options:{allowFireOnMap:!0},initialize:function(t,e){L.Handler.prototype.initialize.call(this,t),e&&L.setOptions(this,e)},fireOnMap:function(t,e){this.options.allowFireOnMap&&this._map.fire(t,e)},project:function(t,e){return void 0!==e?this._map.latLngToLayerPoint(L.latLng(t,e)):this._map.latLngToLayerPoint(t)}}),L.larva.handler.New.Polyline=L.larva.handler.New.extend({options:{handleStyle:{border:"1px solid #0f0",cursor:"crosshair",height:"20px",position:"absolute",width:"20px"},layerOptions:{},onMove:L.larva.NOP,threshold:1},addHooks:function(){this._latlngs=[],this._pane=this._map.getPane("popupPane");var t=this._handle=L.DomUtil.create("div","llarva-new-vertex-handle",this._pane);L.extend(t.style,this.options.handleStyle),this._newLatLng=new L.LatLng(0,0),this._previewLayer=this._lineLayer=L.polyline([],L.extend({},this.options,{noClip:!0})),this._map.on("mousemove",this._onMapMouseMove,this).on("movestart",this._onMapMoveStart,this),L.DomEvent.on(t,"click",this._onClick,this).on(t,"dblclick",this._onDblClick,this)},addLatLng:function(t){this._newLatLng=t.clone(),this._pushLatLng()},createLayer:function(){return L.polyline([],L.extend({},this.options.layerOptions,{noClip:!0}))},_next:function(){if(this._latlngs.pop(),this._latlngs.length>=this.options.threshold)try{this._map.removeLayer(this._previewLayer),this._previewLayer.setLatLngs(this._latlngs),this.fire("ldraw:created",{layer:this._previewLayer}),this.fireOnMap("ldraw:created",{handler:this,layer:this._previewLayer})}finally{this._lineLayer.setLatLngs([]),this._latlngs=[],this._previewLayer=this._lineLayer,delete this._newLayer}},removeHooks:function(){L.DomEvent.off(this._handle,"click",this._onClick,this).off(this._handle,"dblclick",this._onDblClick,this),this._map.off("mousemove",this._onMapMouseMove,this).off("movestart",this._onMapMoveStart,this),L.DomUtil.remove(this._handle),this._previewLayer&&this._map.removeLayer(this._previewLayer)},_getEventLayerPoint:function(t){var e=this._pane.getBoundingClientRect();return t=L.larva.getSourceEvent(t),new L.Point(t.clientX-e.left,t.clientY-e.top)},_onClick:function(t){if(L.DomEvent.stop(t),this._lastClick){t=L.larva.getSourceEvent(t);var e=t.clientX-this._lastClick.x,n=t.clientY-this._lastClick.y;if(100>e*e+n*n)return}else this._lastClick={};this._lastClick.x=t.clientX,this._lastClick.y=t.clientY,this._moving?delete this._moving:this._pushLatLng()},_onDblClick:function(t){L.DomEvent.stop(t),this._pushLatLng(),this._next()},_onMapMouseMove:function(t){var e=t.latlng;this.options.onMove&&this.options.onMove(e),this._newLatLng.lat=e.lat,this._newLatLng.lng=e.lng;var n=this._map.latLngToLayerPoint(e);L.DomUtil.setPosition(this._handle,n.subtract(new L.Point(this._handle.offsetWidth/2,this._handle.offsetHeight/2))),this._latlngs.length&&this._previewLayer.redraw()},_onMapMoveStart:function(){this._moving=!0},_pushLatLng:function(){this._latlngs.push(this._newLatLng.clone()),this._latlngs.length===this.options.threshold&&(this._map.removeLayer(this._lineLayer),this._newLayer=this.createLayer().addTo(this._map),this._previewLayer=this._newLayer),this._previewLayer._map||this._map.addLayer(this._previewLayer),this._previewLayer.setLatLngs(this._latlngs.concat(this._newLatLng)),this._previewLayer.redraw()}}),L.larva.handler.newPolyline=function(t,e){return new L.larva.handler.New.Polyline(t,e)},L.larva.handler.New.Polygon=L.larva.handler.New.Polyline.extend({options:{threshold:2},createLayer:function(){return L.polygon([],this.options.layerOptions)}}),L.larva.handler.newPolygon=function(t,e){return new L.larva.handler.New.Polygon(t,e)},L.larva.handler.Polygon.Edit=L.larva.handler.Polyline.Edit.extend({options:{allowMakeHole:!0,makeHoleCursor:"crosshair",newHoleOptions:{}},addHooks:function(){L.larva.handler.Polyline.Edit.prototype.addHooks.call(this),this.options.allowMakeHole&&this._path.on("click",this._onPathClickHole,this)},_searchNearestPoint:function(t){var e=[],n=this.getMap(),a=this.options.maxDist,i=L.larva.handler.Polyline.Edit.searchNearestPointIn;return this._path.forEachPolygon(function(o,r){e=e.concat(i(t,a,o,n,!0)),r.forEach(function(o){e=e.concat(i(t,a,o,n,!0))},this)},this),e},_onNewHole:function(){this._shellHole},_onPathClickHole:function(t){if(!this._makingHole&&t.originalEvent.ctrlKey){this._makingHole=!0;var e,n=t.layerPoint,a=[];this._path.forEachPolygon(function(t){e=t.map(this.getMap().latLngToLayerPoint,this.getMap()),L.larva.Util.pointIsInside(n,e)&&a.push(t)},this),1===a.length&&(this._shellHole=a[0],this._newPolygonHole=new L.larva.handler.New.Polygon(this.getMap(),L.extend({},this.options.newHoleOptions,{allowFireOnMap:!1})),this._newPolygonHole.on("ldraw:created",this._onNewHole,this).enable(),this._newPolygonHole.addLatLng(t.latlng))}},_restoreCursor:function(){},_setHoleCursor:function(){}}),L.Polyline.addInitHook(function(){this instanceof L.Polygon?this.larva.edit=new L.larva.handler.Polygon.Edit(this):this.larva.edit=new L.larva.handler.Polyline.Edit(this)})}();