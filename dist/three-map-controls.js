!function(t){var e={};function s(i){if(e[i])return e[i].exports;var a=e[i]={i:i,l:!1,exports:{}};return t[i].call(a.exports,a,a.exports,s),a.l=!0,a.exports}s.m=t,s.c=e,s.d=function(t,e,i){s.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:i})},s.r=function(t){Object.defineProperty(t,"__esModule",{value:!0})},s.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return s.d(e,"a",e),e},s.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},s.p="/",s(s.s=2)}([function(t,e,s){t.exports=s(1)(68)},function(t,e){t.exports=vendor},function(t,e,s){"use strict";s.r(e);var i=s(0);class a extends i.EventDispatcher{constructor(t,e,s){super(),this.camera=t,this.domElement=void 0!==e?e:document,this.enabled=!0,this.target,this.minDistance=1,this.maxDistance=100,this.enableZoom=!0,this.zoomSpeed=6,this.zoomDampingAlpha=.1,this.initialZoom=0,this.enablePan=!0,this.keyPanSpeed=12,this.panDampingAlpha=.1,this.enableKeys=!0,this.keys={LEFT:37,UP:38,RIGHT:39,BOTTOM:40},this.mouseButtons={ZOOM:i.MOUSE.MIDDLE,PAN:i.MOUSE.LEFT},Object.assign(this,s);let a=!1;if(void 0===this.mode)throw new Error("'mode' option must be set to either 'plane' or 'sphere'");switch(this.mode){case"plane":a=void 0!==this.target.normal&&void 0!==this.target.constant;break;case"sphere":a=void 0!==this.target.center&&void 0!==this.target.radius}if(!a)throw new Error("'target' option must be an instance of type THREE.Plane or THREE.Sphere");this.target0=this.target.clone(),this.position0=this.camera.position.clone(),this.zoom0=this.camera.zoom,this._mouse=new i.Vector2,this._finalTargetDistance,this._currentTargetDistance,this._changeEvent={type:"change"},this._startEvent={type:"start"},this._endEvent={type:"end"},this._STATES={NONE:-1,DOLLY:1,PAN:2,TOUCH_DOLLY:4,TOUCH_PAN:5},this._state=this._STATES.NONE,this._panTarget=new i.Vector3,this._panCurrent=new i.Vector3,this._minZoomPosition=new i.Vector3,this._maxZoomPosition=new i.Vector3,this._panStart=new i.Vector2,this._panEnd=new i.Vector2,this._panDelta=new i.Vector2,this._dollyStart=new i.Vector2,this._dollyEnd=new i.Vector2,this._dollyDelta=new i.Vector2,this._camOrientation=new i.Vector2,this._lastMouse=new i.Vector2,this._zoomAlpha,this._screenWorldXform=Math.tan(this.camera.fov/2*Math.PI/180),this._init()}_init(){if(0==this.target.distanceToPoint(this.camera.position))throw new Error("ORIENTATION_UNKNOWABLE: initial Camera position cannot intersect target plane.");this._straightDollyTrack(),this.camera.position.lerpVectors(this._minZoomPosition,this._maxZoomPosition,this.initialZoom),this._finalTargetDistance=this._currentTargetDistance=Math.abs(this.target.distanceToPoint(this.camera.position)),this.camera.lookAt(this._maxZoomPosition),this._camOrientation=this._maxZoomPosition.clone().sub(this.camera.position).normalize(),this._updateZoomAlpha(),this.domElement.addEventListener("contextmenu",this._onContextMenu.bind(this),!1),this.domElement.addEventListener("mousedown",this._onMouseDown.bind(this),!1),this.domElement.addEventListener("mousewheel",this._onMouseWheel.bind(this),!1),this.domElement.addEventListener("MozMousePixelScroll",this._onMouseWheel.bind(this),!1),this.domElement.addEventListener("touchstart",this._onTouchStart.bind(this),!1),this.domElement.addEventListener("touchend",this._onTouchEnd.bind(this),!1),this.domElement.addEventListener("touchmove",this._onTouchMove.bind(this),!1),this.domElement.addEventListener("keydown",this._onKeyDown.bind(this),!1),this.update()}_intersectCameraTarget(){let t,e;switch(this.mode){case"plane":[-1,1].forEach(s=>{t||(e=new i.Ray(this.camera.position,this.target.normal.clone().multiplyScalar(s)),t=e.intersectPlane(this.target))});break;case"sphere":e=new i.Ray(this.camera.position,(new i.Vector3).subVectors(this.target.center,this.camera.position)),t=e.intersectSphere(this.target)}return{intersection:t,ray:e}}_straightDollyTrack(){this._updateDollyTrack(this._intersectCameraTarget().ray)}getZoomAlpha(){return this._zoomAlpha}reset(){this.target.copy(this.target0),this.camera.position.copy(this.position0),this.camera.zoom=this.zoom0,this.camera.updateProjectionMatrix(),this._init(),this.dispatchEvent(this._changeEvent),this.update(),this._state=this._STATES.NONE}update(){var t=new i.Vector3,e=new i.Vector3,s=this.camera.position;switch(e.copy(this._panCurrent),this._panCurrent.lerp(this._panTarget,this.panDampingAlpha),t.subVectors(this._panCurrent,e),this.mode){case"plane":this._maxZoomPosition.add(t),this._minZoomPosition.add(t);break;case"sphere":const s=new i.Vector3,a=new i.Quaternion;a.setFromAxisAngle(s.setFromMatrixColumn(this.camera.matrix,1),t.x),this._maxZoomPosition.applyQuaternion(a),this._minZoomPosition.applyQuaternion(a),a.setFromAxisAngle(s.setFromMatrixColumn(this.camera.matrix,0),t.y),this._maxZoomPosition.applyQuaternion(a),this._minZoomPosition.applyQuaternion(a)}s.lerpVectors(this._minZoomPosition,this._maxZoomPosition,this._updateZoomAlpha()),"sphere"==this.mode&&this.camera.lookAt(this.target.center)}dispose(){this.domElement.removeEventListener("contextmenu",this._onContextMenu,!1),this.domElement.removeEventListener("mousedown",this._onMouseDown,!1),this.domElement.removeEventListener("mousewheel",this._onMouseWheel,!1),this.domElement.removeEventListener("MozMousePixelScroll",this._onMouseWheel,!1),this.domElement.removeEventListener("touchstart",this._onTouchStart,!1),this.domElement.removeEventListener("touchend",this._onTouchEnd,!1),this.domElement.removeEventListener("touchmove",this._onTouchMove,!1),document.removeEventListener("mousemove",this._onMouseMove,!1),document.removeEventListener("mouseup",this._onMouseUp,!1),this.domElement.removeEventListener("keydown",this._onKeyDown,!1)}zoomToFit(t,e,s,i){e=e||t.geometry.boundingSphere.center,s=s||2*t.geometry.boundingSphere.radius,void 0===i&&(i=s),this._panTarget.copy(t.localToWorld(e.clone())),this._panCurrent.copy(this._intersectCameraTarget().intersection),this._straightDollyTrack();var a=this.camera.fov*(Math.PI/180),o=2*Math.atan(Math.tan(a/2)*this.camera.aspect),n=s/i;this._finalTargetDistance=(n>this.camera.aspect?s:i)/2/Math.tan((n>this.camera.aspect?o:a)/2)}targetAreaVisible(){let t,e,s,a;switch(this.mode){case"plane":var o=new i.Ray(this.camera.position,this._camOrientation).distanceToPlane(this.target);a=this.camera.position.clone(),s=(e=this._screenWorldXform*o)*this.camera.aspect,t=new i.Box2(new i.Vector2(a.x-s,a.y-e),new i.Vector2(a.x+s,a.y+e));break;case"sphere":const n=(new i.Vector3).subVectors(this.target.center,this.camera.position),h=Math.PI/2;(a=new i.Vector2(n.angleTo(new i.Vector3(1,0,0)),n.angleTo(new i.Vector3(0,1,0)))).x=this.camera.position.z<0?2*Math.PI-a.x:a.x;const r=n.length();e=this._screenWorldXform*(r/this.target.radius-1),s=(e=Math.min(e,h))*this.camera.aspect,s=Math.min(s,h),(t=new i.Box2(new i.Vector2(a.x-s-h,a.y-e-h),new i.Vector2(a.x+s-h,a.y+e-h))).max.x=t.max.x>Math.PI?-2*Math.PI+t.max.x:t.max.x}return t}_updateZoomAlpha(){this._finalTargetDistance=Math.max(this.minDistance,Math.min(this.maxDistance,this._finalTargetDistance));var t=this._currentTargetDistance-this._finalTargetDistance,e=this.zoomDampingAlpha;this._currentTargetDistance-=t*e;return this._zoomAlpha=Math.abs(Math.round(1e5*(1-(this._currentTargetDistance-this.minDistance)/(this.maxDistance-this.minDistance)))/1e5),this._zoomAlpha}_updateDollyTrack(t){let e;switch(this.mode){case"plane":e=t.intersectPlane(this.target);break;case"sphere":e=t.intersectSphere(this.target)}e&&(this._maxZoomPosition.addVectors(e,(new i.Vector3).subVectors(this.camera.position,e).normalize().multiplyScalar(this.minDistance)),this._minZoomPosition.copy(this._calculateMinZoom(this.camera.position,e)),this._finalTargetDistance=this._currentTargetDistance=e.clone().sub(this.camera.position).length())}_getZoomScale(){return Math.pow(.95,this.zoomSpeed)}_panLeft(t,e){var s=new i.Vector3;switch(this.mode){case"sphere":s.set(-t,0,0);break;case"plane":s.setFromMatrixColumn(e,0),s.multiplyScalar(-t)}this._panTarget.add(s)}_panUp(t,e){var s=new i.Vector3;switch(this.mode){case"sphere":s.set(0,-t,0);break;case"plane":s.setFromMatrixColumn(e,1),s.multiplyScalar(t)}this._panTarget.add(s)}_pan(t,e){var s,a=this.domElement===document?this.domElement.body:this.domElement,o=new i.Ray(this.camera.position,this._camOrientation);switch(this.mode){case"plane":s=this._screenWorldXform*o.distanceToPlane(this.target);break;case"sphere":const t=(new i.Vector3).subVectors(this.camera.position,this.target.center);s=this._screenWorldXform*(t.length()/this.target.radius-1)}this._panLeft(2*t*s/a.clientHeight,this.camera.matrix),this._panUp(2*e*s/a.clientHeight,this.camera.matrix)}_dollyIn(t){this._cameraOfKnownType()?this._finalTargetDistance/=t:(console.warn("WARNING: MapControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyOut(t){this._cameraOfKnownType()?this._finalTargetDistance*=t:(console.warn("WARNING: MapControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_cameraOfKnownType(){return"PerspectiveCamera"===this.camera.type}_handleUpdateDollyTrackMouse(t){var e=this._mouse.clone();if(this._mouse.set(t.offsetX/this.domElement.clientWidth*2-1,-t.offsetY/this.domElement.clientHeight*2+1),!e.equals(this._mouse)){var s=new i.Raycaster;s.setFromCamera(this._mouse,this.camera),this._updateDollyTrack(s.ray)}}_handleMouseDownDolly(t){this._handleUpdateDollyTrackMouse(t),this._dollyStart.set(t.offsetX,t.offsetY)}_handleMouseDownPan(t){this._panStart.set(t.offsetX,t.offsetY)}_handleMouseMoveDolly(t){this._handleUpdateDollyTrackMouse(t),this._dollyEnd.set(t.offsetX,t.offsetY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyIn(this._getZoomScale()):this._dollyDelta.y<0&&this._dollyOut(this._getZoomScale()),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.offsetX,t.offsetY),this._panDelta.subVectors(this._panEnd,this._panStart),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseUp(t){}_calculateMinZoom(t,e){return e.clone().add(t.clone().sub(e).normalize().multiplyScalar(this.maxDistance))}_handleMouseWheel(t){this._handleUpdateDollyTrackMouse(t);var e=0;void 0!==t.wheelDelta?e=t.wheelDelta:void 0!==t.detail&&(e=-t.detail),e>0?this._dollyOut(this._getZoomScale()):e<0&&this._dollyIn(this._getZoomScale()),this.update()}_handleKeyDown(t){switch(t.keyCode){case this.keys.UP:this._pan(0,this.keyPanSpeed),this.update();break;case this.keys.BOTTOM:this._pan(0,-this.keyPanSpeed),this.update();break;case this.keys.LEFT:this._pan(this.keyPanSpeed,0),this.update();break;case this.keys.RIGHT:this._pan(-this.keyPanSpeed,0),this.update()}}_handleUpdateDollyTrackTouch(t){var e=new i.Vector2,s=t.touches[0].pageX-t.touches[1].pageX,a=t.touches[0].pageY-t.touches[1].pageY;e.x=t.touches[0].pageX+s/2,e.y=t.touches[0].pageY+a/2;var o=new i.Vector2;o.x=e.x/domElement.clientWidth*2-1,o.y=-e.y/domElement.clientHeight*2+1,this._updateDollyTrack(o)}_handleTouchStartDolly(t){this._handleUpdateDollyTrackTouch(t);var e=t.touches[0].pageX-t.touches[1].pageX,s=t.touches[0].pageY-t.touches[1].pageY,i=Math.sqrt(e*e+s*s);this._dollyStart.set(0,i)}_handleTouchStartPan(t){this._panStart.set(t.touches[0].pageX,t.touches[0].pageY)}_handleTouchMoveDolly(t){this._handleUpdateDollyTrackTouch(t);var e=t.touches[0].pageX-t.touches[1].pageX,s=t.touches[0].pageY-t.touches[1].pageY,i=Math.sqrt(e*e+s*s);this._dollyEnd.set(0,i),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale()):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale()),this._dollyStart.copy(this._dollyEnd),this.update()}_handleTouchMovePan(t){this._panEnd.set(t.touches[0].pageX,t.touches[0].pageY),this._panDelta.subVectors(this._panEnd,this._panStart),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleTouchEnd(t){}_onMouseDown(t){if(!1!==this.enabled){if(t.preventDefault(),t.button===this.mouseButtons.ZOOM){if(!1===this.enableZoom)return;this._handleMouseDownDolly(t),this._state=this._STATES.DOLLY}else if(t.button===this.mouseButtons.PAN){if(!1===this.enablePan)return;this._handleMouseDownPan(t),this._state=this._STATES.PAN}this._state!==this._STATES.NONE&&(document.addEventListener("mousemove",this._onMouseMove.bind(this),!1),document.addEventListener("mouseup",this._onMouseUp.bind(this),!1),this.dispatchEvent(this._startEvent))}}_onMouseMove(t){if(!1!==this.enabled)if(t.preventDefault(),this._state===this._STATES.DOLLY){if(!1===this.enableZoom)return;this._handleMouseMoveDolly(t)}else if(this._state===this._STATES.PAN){if(!1===this.enablePan)return;this._handleMouseMovePan(t)}}_onMouseUp(t){!1!==this.enabled&&(this._handleMouseUp(t),document.removeEventListener("mousemove",this._onMouseMove,!1),document.removeEventListener("mouseup",this._onMouseUp,!1),this.dispatchEvent(this._endEvent),this._state=this._STATES.NONE)}_onMouseWheel(t){!1!==this.enabled&&!1!==this.enableZoom&&this._state===this._STATES.NONE&&(t.preventDefault(),t.stopPropagation(),this._handleMouseWheel(t),this.dispatchEvent(this._startEvent),this.dispatchEvent(this._endEvent))}_onKeyDown(t){!1!==this.enabled&&!1!==this.enableKeys&&!1!==this.enablePan&&this._handleKeyDown(t)}_onTouchStart(t){if(!1!==this.enabled){switch(t.touches.length){case 1:if(!1===this.enablePan)return;this._handleTouchStartPan(t),this._state=this._STATES.TOUCH_PAN;break;case 2:if(!1===this.enableZoom)return;this._handleTouchStartDolly(t),this._state=this._STATES.TOUCH_DOLLY;break;default:this._state=this._STATES.NONE}this._state!==this._STATES.NONE&&this.dispatchEvent(this._startEvent)}}_onTouchMove(t){if(!1!==this.enabled)switch(t.preventDefault(),t.stopPropagation(),t.touches.length){case 1:if(!1===this.enablePan)return;if(this._state!==this._STATES.TOUCH_PAN)return;this._handleTouchMovePan(t);break;case 2:if(!1===this.enableZoom)return;if(this._state!==this._STATES.TOUCH_DOLLY)return;this._handleTouchMoveDolly(t);break;default:this._state=this._STATES.NONE}}_onTouchEnd(t){!1!==this.enabled&&(this._handleTouchEnd(t),this.dispatchEvent(this._endEvent),this._state=this._STATES.NONE)}_onContextMenu(t){t.preventDefault()}}window&&window.THREE&&(window.THREE.MapControls=a),e.default=a}]);
//# sourceMappingURL=three-map-controls.js.map