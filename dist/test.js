!function(t){var e={};function i(s){if(e[s])return e[s].exports;var a=e[s]={i:s,l:!1,exports:{}};return t[s].call(a.exports,a,a.exports,i),a.l=!0,a.exports}i.m=t,i.c=e,i.d=function(t,e,s){i.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:s})},i.r=function(t){Object.defineProperty(t,"__esModule",{value:!0})},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="/",i(i.s=5)}([function(t,e,i){t.exports=i(1)(68)},function(t,e){t.exports=vendor},function(t,e,i){"use strict";i.r(e);var s=i(0);class a extends s.EventDispatcher{constructor(t,e,i){super(),this.camera=t,this.domElement=void 0!==e?e:document,this.enabled=!0,this.target,this.minDistance=1,this.maxDistance=100,this.enableZoom=!0,this.zoomSpeed=6,this.zoomDampingAlpha=.1,this.initialZoom=0,this.enablePan=!0,this.keyPanSpeed=12,this.panDampingAlpha=.1,this.enableKeys=!0,this.keys={LEFT:37,UP:38,RIGHT:39,BOTTOM:40},this.mouseButtons={ZOOM:s.MOUSE.MIDDLE,PAN:s.MOUSE.LEFT},Object.assign(this,i);let a=!1;if(void 0===this.mode)throw new Error("'mode' option must be set to either 'plane' or 'sphere'");switch(this.mode){case"plane":a=void 0!==this.target.normal&&void 0!==this.target.constant;break;case"sphere":a=void 0!==this.target.center&&void 0!==this.target.radius}if(!a)throw new Error("'target' option must be an instance of type THREE.Plane or THREE.Sphere");this.target0=this.target.clone(),this.position0=this.camera.position.clone(),this.zoom0=this.camera.zoom,this._mouse=new s.Vector2,this._finalTargetDistance,this._currentTargetDistance,this._changeEvent={type:"change"},this._startEvent={type:"start"},this._endEvent={type:"end"},this._STATES={NONE:-1,DOLLY:1,PAN:2,TOUCH_DOLLY:4,TOUCH_PAN:5},this._state=this._STATES.NONE,this._panTarget=new s.Vector3,this._panCurrent=new s.Vector3,this._minZoomPosition=new s.Vector3,this._maxZoomPosition=new s.Vector3,this._panStart=new s.Vector2,this._panEnd=new s.Vector2,this._panDelta=new s.Vector2,this._dollyStart=new s.Vector2,this._dollyEnd=new s.Vector2,this._dollyDelta=new s.Vector2,this._camOrientation=new s.Vector2,this._lastMouse=new s.Vector2,this._zoomAlpha,this._init()}_init(){if(0==this.target.distanceToPoint(this.camera.position))throw new Error("ORIENTATION_UNKNOWABLE: initial Camera position cannot intersect target plane.");this._straightDollyTrack(),this.camera.position.lerpVectors(this._minZoomPosition,this._maxZoomPosition,this.initialZoom),this._finalTargetDistance=this._currentTargetDistance=Math.abs(this.target.distanceToPoint(this.camera.position)),this.camera.lookAt(this._maxZoomPosition),this._camOrientation=this._maxZoomPosition.clone().sub(this.camera.position).normalize(),this._updateZoomAlpha(),this.domElement.addEventListener("contextmenu",this._onContextMenu.bind(this),!1),this.domElement.addEventListener("mousedown",this._onMouseDown.bind(this),!1),this.domElement.addEventListener("mousewheel",this._onMouseWheel.bind(this),!1),this.domElement.addEventListener("MozMousePixelScroll",this._onMouseWheel.bind(this),!1),this.domElement.addEventListener("touchstart",this._onTouchStart.bind(this),!1),this.domElement.addEventListener("touchend",this._onTouchEnd.bind(this),!1),this.domElement.addEventListener("touchmove",this._onTouchMove.bind(this),!1),this.domElement.addEventListener("keydown",this._onKeyDown.bind(this),!1),this.update()}_intersectCameraTarget(){let t,e;switch(this.mode){case"plane":[-1,1].forEach(i=>{t||(e=new s.Ray(this.camera.position,this.target.normal.clone().multiplyScalar(i)),t=e.intersectPlane(this.target))});break;case"sphere":e=new s.Ray(this.camera.position,(new s.Vector3).subVectors(this.target.center,this.camera.position)),t=e.intersectSphere(this.target)}return{intersection:t,ray:e}}_straightDollyTrack(){this._updateDollyTrack(this._intersectCameraTarget().ray)}getZoomAlpha(){return this._zoomAlpha}reset(){this.target.copy(this.target0),this.camera.position.copy(this.position0),this.camera.zoom=this.zoom0,this.camera.updateProjectionMatrix(),this._init(),this.dispatchEvent(this._changeEvent),this.update(),this._state=this._STATES.NONE}update(){var t=new s.Vector3,e=new s.Vector3,i=this.camera.position;switch(e.copy(this._panCurrent),this._panCurrent.lerp(this._panTarget,this.panDampingAlpha),t.subVectors(this._panCurrent,e),this.mode){case"plane":this._maxZoomPosition.add(t),this._minZoomPosition.add(t);break;case"sphere":const i=new s.Vector3,a=new s.Quaternion,n=this.target.radius;a.setFromAxisAngle(i.setFromMatrixColumn(this.camera.matrix,1),t.x/n),this._maxZoomPosition.applyQuaternion(a),this._minZoomPosition.applyQuaternion(a),a.setFromAxisAngle(i.setFromMatrixColumn(this.camera.matrix,0),t.y/n),this._maxZoomPosition.applyQuaternion(a),this._minZoomPosition.applyQuaternion(a)}i.lerpVectors(this._minZoomPosition,this._maxZoomPosition,this._updateZoomAlpha()),"sphere"==this.mode&&this.camera.lookAt(this.target.center)}dispose(){this.domElement.removeEventListener("contextmenu",this._onContextMenu,!1),this.domElement.removeEventListener("mousedown",this._onMouseDown,!1),this.domElement.removeEventListener("mousewheel",this._onMouseWheel,!1),this.domElement.removeEventListener("MozMousePixelScroll",this._onMouseWheel,!1),this.domElement.removeEventListener("touchstart",this._onTouchStart,!1),this.domElement.removeEventListener("touchend",this._onTouchEnd,!1),this.domElement.removeEventListener("touchmove",this._onTouchMove,!1),document.removeEventListener("mousemove",this._onMouseMove,!1),document.removeEventListener("mouseup",this._onMouseUp,!1),this.domElement.removeEventListener("keydown",this._onKeyDown,!1)}zoomToFit(t,e,i,s){e=e||t.geometry.boundingSphere.center,i=i||2*t.geometry.boundingSphere.radius,void 0===s&&(s=i),this._panTarget.copy(t.localToWorld(e.clone())),this._panCurrent.copy(this._intersectCameraTarget().intersection),this._straightDollyTrack();var a=this.camera.fov*(Math.PI/180),n=2*Math.atan(Math.tan(a/2)*this.camera.aspect),o=i/s;this._finalTargetDistance=(o>this.camera.aspect?i:s)/2/Math.tan((o>this.camera.aspect?n:a)/2)}_updateZoomAlpha(){this._finalTargetDistance=Math.max(this.minDistance,Math.min(this.maxDistance,this._finalTargetDistance));var t=this._currentTargetDistance-this._finalTargetDistance,e=this.zoomDampingAlpha;this._currentTargetDistance-=t*e;return this._zoomAlpha=Math.abs(Math.round(1e5*(1-(this._currentTargetDistance-this.minDistance)/(this.maxDistance-this.minDistance)))/1e5),this._zoomAlpha}_updateDollyTrack(t){let e;switch(this.mode){case"plane":e=t.intersectPlane(this.target);break;case"sphere":e=t.intersectSphere(this.target)}e&&(this._maxZoomPosition.addVectors(e,(new s.Vector3).subVectors(this.camera.position,e).normalize().multiplyScalar(this.minDistance)),this._minZoomPosition.copy(this._calculateMinZoom(this.camera.position,e)),this._finalTargetDistance=this._currentTargetDistance=e.clone().sub(this.camera.position).length())}_getZoomScale(){return Math.pow(.95,this.zoomSpeed)}_panLeft(t,e){var i=new s.Vector3;switch(this.mode){case"sphere":i.set(-t,0,0);break;case"plane":i.setFromMatrixColumn(e,0),i.multiplyScalar(-t)}this._panTarget.add(i)}_panUp(t,e){var i=new s.Vector3;switch(this.mode){case"sphere":i.set(0,-t,0);break;case"plane":i.setFromMatrixColumn(e,1),i.multiplyScalar(t)}this._panTarget.add(i)}_pan(t,e){var i,a=this.domElement===document?this.domElement.body:this.domElement,n=new s.Ray(this.camera.position,this._camOrientation);switch(this.mode){case"plane":i=n.distanceToPlane(this.target);break;case"sphere":i=this.camera.position.length()-this.target.radius}i*=Math.tan(this.camera.fov/2*Math.PI/180),this._panLeft(2*t*i/a.clientHeight,this.camera.matrix),this._panUp(2*e*i/a.clientHeight,this.camera.matrix)}_dollyIn(t){this._cameraOfKnownType()?this._finalTargetDistance/=t:(console.warn("WARNING: MapControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyOut(t){this._cameraOfKnownType()?this._finalTargetDistance*=t:(console.warn("WARNING: MapControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_cameraOfKnownType(){return"PerspectiveCamera"===this.camera.type}_handleUpdateDollyTrackMouse(t){var e=this._mouse.clone();if(this._mouse.set(t.offsetX/this.domElement.clientWidth*2-1,-t.offsetY/this.domElement.clientHeight*2+1),!e.equals(this._mouse)){var i=new s.Raycaster;i.setFromCamera(this._mouse,this.camera),this._updateDollyTrack(i.ray)}}_handleMouseDownDolly(t){this._handleUpdateDollyTrackMouse(t),this._dollyStart.set(t.offsetX,t.offsetY)}_handleMouseDownPan(t){this._panStart.set(t.offsetX,t.offsetY)}_handleMouseMoveDolly(t){this._handleUpdateDollyTrackMouse(t),this._dollyEnd.set(t.offsetX,t.offsetY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyIn(this._getZoomScale()):this._dollyDelta.y<0&&this._dollyOut(this._getZoomScale()),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.offsetX,t.offsetY),this._panDelta.subVectors(this._panEnd,this._panStart),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseUp(t){}_calculateMinZoom(t,e){return e.clone().add(t.clone().sub(e).normalize().multiplyScalar(this.maxDistance))}_handleMouseWheel(t){this._handleUpdateDollyTrackMouse(t);var e=0;void 0!==t.wheelDelta?e=t.wheelDelta:void 0!==t.detail&&(e=-t.detail),e>0?this._dollyOut(this._getZoomScale()):e<0&&this._dollyIn(this._getZoomScale()),this.update()}_handleKeyDown(t){switch(t.keyCode){case this.keys.UP:this._pan(0,this.keyPanSpeed),this.update();break;case this.keys.BOTTOM:this._pan(0,-this.keyPanSpeed),this.update();break;case this.keys.LEFT:this._pan(this.keyPanSpeed,0),this.update();break;case this.keys.RIGHT:this._pan(-this.keyPanSpeed,0),this.update()}}_handleUpdateDollyTrackTouch(t){var e=new s.Vector2,i=t.touches[0].pageX-t.touches[1].pageX,a=t.touches[0].pageY-t.touches[1].pageY;e.x=t.touches[0].pageX+i/2,e.y=t.touches[0].pageY+a/2;var n=new s.Vector2;n.x=e.x/domElement.clientWidth*2-1,n.y=-e.y/domElement.clientHeight*2+1,this._updateDollyTrack(n)}_handleTouchStartDolly(t){this._handleUpdateDollyTrackTouch(t);var e=t.touches[0].pageX-t.touches[1].pageX,i=t.touches[0].pageY-t.touches[1].pageY,s=Math.sqrt(e*e+i*i);this._dollyStart.set(0,s)}_handleTouchStartPan(t){this._panStart.set(t.touches[0].pageX,t.touches[0].pageY)}_handleTouchMoveDolly(t){this._handleUpdateDollyTrackTouch(t);var e=t.touches[0].pageX-t.touches[1].pageX,i=t.touches[0].pageY-t.touches[1].pageY,s=Math.sqrt(e*e+i*i);this._dollyEnd.set(0,s),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale()):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale()),this._dollyStart.copy(this._dollyEnd),this.update()}_handleTouchMovePan(t){this._panEnd.set(t.touches[0].pageX,t.touches[0].pageY),this._panDelta.subVectors(this._panEnd,this._panStart),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleTouchEnd(t){}_onMouseDown(t){if(!1!==this.enabled){if(t.preventDefault(),t.button===this.mouseButtons.ZOOM){if(!1===this.enableZoom)return;this._handleMouseDownDolly(t),this._state=this._STATES.DOLLY}else if(t.button===this.mouseButtons.PAN){if(!1===this.enablePan)return;this._handleMouseDownPan(t),this._state=this._STATES.PAN}this._state!==this._STATES.NONE&&(document.addEventListener("mousemove",this._onMouseMove.bind(this),!1),document.addEventListener("mouseup",this._onMouseUp.bind(this),!1),this.dispatchEvent(this._startEvent))}}_onMouseMove(t){if(!1!==this.enabled)if(t.preventDefault(),this._state===this._STATES.DOLLY){if(!1===this.enableZoom)return;this._handleMouseMoveDolly(t)}else if(this._state===this._STATES.PAN){if(!1===this.enablePan)return;this._handleMouseMovePan(t)}}_onMouseUp(t){!1!==this.enabled&&(this._handleMouseUp(t),document.removeEventListener("mousemove",this._onMouseMove,!1),document.removeEventListener("mouseup",this._onMouseUp,!1),this.dispatchEvent(this._endEvent),this._state=this._STATES.NONE)}_onMouseWheel(t){!1!==this.enabled&&!1!==this.enableZoom&&this._state===this._STATES.NONE&&(t.preventDefault(),t.stopPropagation(),this._handleMouseWheel(t),this.dispatchEvent(this._startEvent),this.dispatchEvent(this._endEvent))}_onKeyDown(t){!1!==this.enabled&&!1!==this.enableKeys&&!1!==this.enablePan&&this._handleKeyDown(t)}_onTouchStart(t){if(!1!==this.enabled){switch(t.touches.length){case 1:if(!1===this.enablePan)return;this._handleTouchStartPan(t),this._state=this._STATES.TOUCH_PAN;break;case 2:if(!1===this.enableZoom)return;this._handleTouchStartDolly(t),this._state=this._STATES.TOUCH_DOLLY;break;default:this._state=this._STATES.NONE}this._state!==this._STATES.NONE&&this.dispatchEvent(this._startEvent)}}_onTouchMove(t){if(!1!==this.enabled)switch(t.preventDefault(),t.stopPropagation(),t.touches.length){case 1:if(!1===this.enablePan)return;if(this._state!==this._STATES.TOUCH_PAN)return;this._handleTouchMovePan(t);break;case 2:if(!1===this.enableZoom)return;if(this._state!==this._STATES.TOUCH_DOLLY)return;this._handleTouchMoveDolly(t);break;default:this._state=this._STATES.NONE}}_onTouchEnd(t){!1!==this.enabled&&(this._handleTouchEnd(t),this.dispatchEvent(this._endEvent),this._state=this._STATES.NONE)}_onContextMenu(t){t.preventDefault()}}window&&window.THREE&&(window.THREE.MapControls=a),e.default=a},function(t,e,i){t.exports=i(1)(67)},function(t,e,i){t.exports=i(1)(3)},function(t,e,i){"use strict";(function(t){var e=i(3),s=i(0),a=i(2).default;console.log=function(t){var e=document.createElement("div");e.className="log",e.innerText=t,window.document.body.appendChild(e)},window.onload=function(){var i=document.body,n=new s.PerspectiveCamera(45,i.clientWidth/i.clientHeight,1,1e3),o={};[t.document,i].forEach(t=>{t.addEventListener=function(t,e){o[t]=e},t.removeEventListener=function(){}});var h,r={target:new s.Plane(new s.Vector3(0,0,1),0),minDistance:2,maxDistance:20};function l(t){new Array(t).forEach(function(){h.update()})}function c(){return Math.abs(h.target.distanceToPoint(n.position))}var u=function(){};function d(t){return this.preventDefault=u,this.stopPropagation=u,Object.assign(this,t)}var m=400,p=300,_=new s.Raycaster,y=function(){var t=new s.Vector2(m/i.width*2-1,-p/i.height*2+1);return _.setFromCamera(t,h.camera),_.ray.intersectPlane(h.target)},v=new s.Vector3(3,2,-20);e("shouldn't allow initialization if camera intersects plane",function(t){try{h=new a(n,i,r),t.fail("controls created where camera intersects target plane")}catch(e){t.pass("camera cannot intersect target plane on init")}var e=v.clone();e.z=-1,n.position.copy(e);try{h=new a(n,i,r),t.pass("controls created correctly")}catch(e){t.fail("controls not created successfully")}t.end()}),e("should initialize with cam at controls.maxDistance by default",function(t){var e=c();t.equals(e,h.maxDistance),t.equals(h.getZoomAlpha(),h.initialZoom),t.end()}),e("shouldn't move from initial position if no input received",function(t){l(10);var e=c();t.equals(e,h.maxDistance),t.ok(v.equals(h.camera.position)),t.end()}),e("should automatically orient camera towards plane based on starting position",function(t){var e=n.getWorldDirection();t.ok(e.equals(h.target.normal)||e.multiplyScalar(-1).equals(h.target.normal)),t.end()}),e("should lerp camera towards target plane on mousewheel",function(t){var e=c();o.mousewheel(new d({wheelDelta:1})),l(1e3);var i=c(),s=e*Math.pow(.95,h.zoomSpeed);t.equals(Math.round(1e3*s),Math.round(1e3*i)),t.end()}),e("should stop zooming at minDistance from target plane",function(t){new Array(20).forEach(function(){o.mousewheel(new d({wheelDelta:1}))}),l(1e3);var e=c();t.equals(Math.round(1e3*h.minDistance),Math.round(1e3*e)),t.equals(h.getZoomAlpha(),1),t.end()}),e("reset should revert camera to correct initial position",function(t){h.reset(),t.ok(v.equals(h.camera.position)),t.end()}),e("should zoom into mouse pointer",function(t){var e=y(),i=(new s.Vector3).addVectors(e,(new s.Vector3).subVectors(h.camera.position,e).normalize().multiplyScalar(h.minDistance));new Array(30).forEach(function(){o.mousewheel(new d({wheelDelta:1,clientX:m,clientY:p}))}),l(1e3);var a=Math.abs((new s.Vector3).subVectors(i,h.camera.position).length());t.ok(a<=1e-5),t.end()});var E=function(t,e,i){o.mousedown(new d({clientX:m,clientY:p,button:h.mouseButtons.PAN}));var a=(new s.Vector3).subVectors(y().multiplyScalar(-1),h.camera.position);m=e,p=i,o.mousemove(new d({clientX:m,clientY:p})),l(1e3);var n=(new s.Vector3).subVectors(y().multiplyScalar(-1),h.camera.position);t.ok(Math.abs((new s.Vector3).subVectors(n,a).length())<=1e-4)};e("mouse should keep same world coordinates under it during camera pan (pan calibration)",function(t){h.reset(),E(t,400,500),t.end()}),m=400,p=300,e("initialZoom parameter should set the default cam position correctly",function(t){h.initialZoom=.5,h.reset();var e=v.z+(h.maxDistance-h.minDistance)/2;t.equals(h.camera.position.z,e),h.initialZoom=1,h.reset();e=-h.minDistance;t.equals(h.camera.position.z,e),t.end()}),e("pan calibration should hold true when zoomed in",function(t){E(t,400,500),t.end()})}}).call(this,i(4))}]);
//# sourceMappingURL=test.js.map