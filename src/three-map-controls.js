'use strict';

//Alex Pilafian 2016 - sikanrong@gmail.com

import * as THREE from 'three'
import _ from 'lodash'

class MapControls extends THREE.EventDispatcher{

        constructor(camera, domElement, options){
            super();

            this.camera = camera;

            //Object to use for listening for keyboard/mouse events
            this.domElement = ( domElement !== undefined ) ? domElement : document;

            // Set to false to disable this control (Disables all input events)
            this.enabled = true;

            // Must be set to instance of THREE.Plane
            this.target;

            // How far you can dolly in and out
            this.minDistance = 1; //probably should never be 0
            this.maxDistance = 100;

            // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
            // Set to false to disable zooming
            this.enableZoom = true;
            this.zoomSpeed = 6.0;
            this.zoomDampingAlpha = 0.1;
            this.initialZoom = 0; //start zoomed all the way out unless set in options.

            // Set to false to disable panning
            this.enablePan = true;
            this.keyPanSpeed = 12.0;	// pixels moved per arrow key push
            this.panDampingAlpha = 0.1;

            // Set to false to disable use of the keys
            this.enableKeys = true;

            // The four arrow keys
            this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

            // Mouse buttons
            this.mouseButtons = { ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.LEFT };

            //Copy options from parameters
            _.extend(this, options);

            // for reset
            this.target0 = this.target.clone();
            this.position0 = this.camera.position.clone();
            this.zoom0 = this.camera.zoom;

            this._mouse = new THREE.Vector2();

            this._finalTargetDistance;
            this._currentTargetDistance;

            this._changeEvent = { type: 'change' };
            this._startEvent = { type: 'start' };
            this._endEvent = { type: 'end' };

            this._STATES = { NONE : - 1, DOLLY : 1, PAN : 2, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };
            this._state = this._STATES.NONE;

            this._panTarget = new THREE.Vector3();
            this._panCurrent = new THREE.Vector3();

            this._minZoomPosition = new THREE.Vector3();
            this._maxZoomPosition = new THREE.Vector3();

            this._panStart = new THREE.Vector2();
            this._panEnd = new THREE.Vector2();
            this._panDelta = new THREE.Vector2();

            this._dollyStart = new THREE.Vector2();
            this._dollyEnd = new THREE.Vector2();
            this._dollyDelta = new THREE.Vector2();

            this._camOrientation = new THREE.Vector2();
            this._lastMouse = new THREE.Vector2();

            this._zoomAlpha;

            this._init();
        }

        _init (){
            if(this.target.distanceToPoint(this.camera.position) == 0){
                throw new Error("ORIENTATION_UNKNOWABLE: initial Camera position cannot intersect target plane.");
            }

            //establish initial camera orientation based on position w.r.t. _this.target plane
            this._straightDollyTrack();

            this.camera.position.lerpVectors(this._minZoomPosition, this._maxZoomPosition, this.initialZoom);
            this._finalTargetDistance = this._currentTargetDistance = Math.abs(this.target.distanceToPoint(this.camera.position));

            this.camera.lookAt(this._maxZoomPosition); //set the orientation of the camera towards the map.
            this._camOrientation = this._maxZoomPosition.clone().sub(this.camera.position).normalize();

            this._updateZoomAlpha();

            //Assign event listeners

            this.domElement.addEventListener( 'contextmenu', this._onContextMenu.bind(this), false );

            this.domElement.addEventListener( 'mousedown', this._onMouseDown.bind(this), false );
            this.domElement.addEventListener( 'mousewheel', this._onMouseWheel.bind(this), false );
            this.domElement.addEventListener( 'MozMousePixelScroll', this._onMouseWheel.bind(this), false ); // firefox

            this.domElement.addEventListener( 'touchstart', this._onTouchStart.bind(this), false );
            this.domElement.addEventListener( 'touchend', this._onTouchEnd.bind(this), false );
            this.domElement.addEventListener( 'touchmove', this._onTouchMove.bind(this), false );

            this.domElement.addEventListener( 'keydown', this._onKeyDown.bind(this), false );


            this.update();
        }

        _intersectCameraTarget(){
            var intersection, ray;
            _.each([-1, 1], function(orientation){
                if(intersection)
                    return;

                ray = new THREE.Ray(this.camera.position, this.target.normal.clone().multiplyScalar(orientation));
                intersection = ray.intersectPlane(this.target);
            }.bind(this));

            return {
                intersection: intersection,
                ray: ray
            }
        }

        _straightDollyTrack(){
            this._updateDollyTrack(this._intersectCameraTarget().ray);
        }

        getZoomAlpha () {
            return this._zoomAlpha;
        }

        reset () {

            this.target.copy( this.target0 );
            this.camera.position.copy( this.position0 );
            this.camera.zoom = this.zoom0;

            this.camera.updateProjectionMatrix();

            this._init(); //reinit

            this.dispatchEvent( this._changeEvent );

            this.update();

            this._state = this._STATES.NONE;

        };

        // this method is exposed, but perhaps it would be better if we can make it private...
        update () {
            var panDelta = new THREE.Vector3();
            var oldPanCurrent = new THREE.Vector3();
            var position = this.camera.position;

            // move target to panned location
            oldPanCurrent.copy(this._panCurrent);
            this._panCurrent.lerp( this._panTarget, this.panDampingAlpha );
            panDelta.subVectors(this._panCurrent, oldPanCurrent);

            this._maxZoomPosition.add(panDelta);
            this._minZoomPosition.add(panDelta);

            position.lerpVectors(this._minZoomPosition, this._maxZoomPosition, this._updateZoomAlpha());
        }

        dispose () {
            this.domElement.removeEventListener( 'contextmenu', this._onContextMenu, false );
            this.domElement.removeEventListener( 'mousedown', this._onMouseDown, false );
            this.domElement.removeEventListener( 'mousewheel', this._onMouseWheel, false );
            this.domElement.removeEventListener( 'MozMousePixelScroll', this._onMouseWheel, false ); // firefox

            this.domElement.removeEventListener( 'touchstart', this._onTouchStart, false );
            this.domElement.removeEventListener( 'touchend', this._onTouchEnd, false );
            this.domElement.removeEventListener( 'touchmove', this._onTouchMove, false );

            document.removeEventListener( 'mousemove', this._onMouseMove, false );
            document.removeEventListener( 'mouseup', this._onMouseUp, false );

            this.domElement.removeEventListener( 'keydown', this._onKeyDown, false );
        };

        zoomToFit (mesh, center, width, height){
            //if only width is passed interpret it as radius and set height equal to width
            center = center || mesh.geometry.boundingSphere.center;
            width = width || (mesh.geometry.boundingSphere.radius * 2);

            if(height === undefined)
                height = width;

            this._panTarget.copy(mesh.localToWorld(center.clone()));
            this._panCurrent.copy(this._intersectCameraTarget().intersection);

            this._straightDollyTrack();

            var vFOV = this.camera.fov * (Math.PI / 180);
            var hFOV = 2 * Math.atan( Math.tan( vFOV / 2 ) * this.camera.aspect );
            var obj_aspect = width / height;

            this._finalTargetDistance = ((((obj_aspect > this.camera.aspect)? width : height) / 2) / Math.tan(((obj_aspect > this.camera.aspect)? hFOV : vFOV) / 2));


        };

        _updateZoomAlpha(){
            this._finalTargetDistance = Math.max( this.minDistance, Math.min( this.maxDistance, this._finalTargetDistance ) );
            var diff = this._currentTargetDistance - this._finalTargetDistance;
            var damping_alpha = this.zoomDampingAlpha;
            this._currentTargetDistance -= diff * damping_alpha;
            var rounding_places = 100000;
            this._zoomAlpha = Math.abs(Math.round((1 - ((this._currentTargetDistance - this.minDistance) / (this.maxDistance - this.minDistance))) * rounding_places ) / rounding_places);

            return this._zoomAlpha;
        }

        _updateDollyTrack(ray){

            // calculate cameras intersecting the picking ray
            var intersect = ray.intersectPlane(this.target);

            if(intersect){
                this._maxZoomPosition.addVectors(intersect, new THREE.Vector3().subVectors(this.camera.position, intersect).normalize().multiplyScalar(this.minDistance));
                this._minZoomPosition.copy(this._calculateMinZoom(this.camera.position, intersect));

                this._finalTargetDistance = this._currentTargetDistance = intersect.clone().sub(this.camera.position).length();
            }
        }

        _getZoomScale() {
            return Math.pow( 0.95, this.zoomSpeed );
        }


        _panLeft( distance, cameraMatrix ) {
            var v = new THREE.Vector3();

            v.setFromMatrixColumn( cameraMatrix, 0 ); // get X column of cameraMatrix
            v.multiplyScalar( - distance );

            this._panTarget.add( v );
        }

        _panUp ( distance, cameraMatrix ) {

            var v = new THREE.Vector3();

            v.setFromMatrixColumn( cameraMatrix, 1 ); // get Y column of cameraMatrix
            v.multiplyScalar( distance );

            this._panTarget.add( v );

        }

        // deltaX and deltaY are in pixels; right and down are positive
        _pan (deltaX, deltaY) {

            var element = this.domElement === document ? this.domElement.body : this.domElement;

            var r = new THREE.Ray(this.camera.position, this._camOrientation);
            var targetDistance = r.distanceToPlane(this.target);

            // half of the fov is center to top of screen
            targetDistance *= Math.tan( ( this.camera.fov / 2 ) * Math.PI / 180.0 );

            // we actually don't use screenWidth, since perspective camera is fixed to screen height
            this._panLeft( 2 * deltaX * targetDistance / element.clientHeight, this.camera.matrix );
            this._panUp( 2 * deltaY * targetDistance / element.clientHeight, this.camera.matrix );

        }

        _dollyIn( dollyScale ) {
            if ( this._cameraOfKnownType() ) {
                this._finalTargetDistance /= dollyScale;
            } else {
                console.warn( 'WARNING: MapControls.js encountered an unknown camera type - dolly/zoom disabled.' );
                this.enableZoom = false;
            }
        }

        _dollyOut( dollyScale ) {
            if ( this._cameraOfKnownType() ) {
                this._finalTargetDistance *= dollyScale;
            } else {
                console.warn( 'WARNING: MapControls.js encountered an unknown camera type - dolly/zoom disabled.' );
                this.enableZoom = false;
            }
        }

        _cameraOfKnownType() {
            return this.camera.type === 'PerspectiveCamera'
        }

        _handleUpdateDollyTrackMouse(event){
            var prevMouse = this._mouse.clone();
            this._mouse.set(( event.offsetX / this.domElement.clientWidth ) * 2 - 1, - ( event.offsetY / this.domElement.clientHeight ) * 2 + 1);

            if(!prevMouse.equals(this._mouse)){
                var rc = new THREE.Raycaster();
                rc.setFromCamera(this._mouse, this.camera);
                this._updateDollyTrack(rc.ray);
            }
        }

        _handleMouseDownDolly( event ) {
            this._handleUpdateDollyTrackMouse(event);
            this._dollyStart.set( event.offsetX, event.offsetY );
        }

        _handleMouseDownPan( event ) {

            this._panStart.set( event.offsetX, event.offsetY );

        }

        _handleMouseMoveDolly( event ) {

            this._handleUpdateDollyTrackMouse(event);

            //console.log( 'handleMouseMoveDolly' );

            this._dollyEnd.set( event.offsetX, event.offsetY );

            this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart );

            if ( this._dollyDelta.y > 0 ) {

                this._dollyIn( this._getZoomScale() );

            } else if ( this._dollyDelta.y < 0 ) {

                this._dollyOut( this._getZoomScale() );

            }

            this._dollyStart.copy( this._dollyEnd );

            this.update();

        }

        _handleMouseMovePan( event ) {

            //console.log( 'handleMouseMovePan' );

            this._panEnd.set( event.offsetX, event.offsetY );

            this._panDelta.subVectors( this._panEnd, this._panStart );

            this._pan( this._panDelta.x, this._panDelta.y );

            this._panStart.copy( this._panEnd );

            this.update();

        }

        _handleMouseUp( event ) {

            //console.log( 'handleMouseUp' );

        }

        _calculateMinZoom(cam_pos, map_intersect){
            return map_intersect.clone().add(
                cam_pos.clone()
                .sub(map_intersect)
                .normalize()
                .multiplyScalar(this.maxDistance)
            );
        }


        _handleMouseWheel( event ) {
            this._handleUpdateDollyTrackMouse(event);

            var delta = 0;

            if ( event.wheelDelta !== undefined ) {

                // WebKit / Opera / Explorer 9

                delta = event.wheelDelta;

            } else if ( event.detail !== undefined ) {

                // Firefox

                delta = - event.detail;

            }

            if ( delta > 0 ) {
                this._dollyOut( this._getZoomScale() );
            } else if ( delta < 0 ) {
                this._dollyIn( this._getZoomScale() );
            }

            this.update();
        }

        _handleKeyDown( event ) {

            //console.log( 'handleKeyDown' );

            switch ( event.keyCode ) {

                case this.keys.UP:
                    this._pan( 0, this.keyPanSpeed );
                    this.update();
                    break;

                case this.keys.BOTTOM:
                    this._pan( 0, - this.keyPanSpeed );
                    this.update();
                    break;

                case this.keys.LEFT:
                    this._pan( this.keyPanSpeed, 0 );
                    this.update();
                    break;

                case this.keys.RIGHT:
                    this._pan( - this.keyPanSpeed, 0 );
                    this.update();
                    break;

            }

        }

        _handleUpdateDollyTrackTouch( event ){
            var centerpoint = new THREE.Vector2();

            var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
            var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

            centerpoint.x = event.touches[ 0 ].pageX + (dx / 2);
            centerpoint.y = event.touches[ 0 ].pageY + (dy / 2);

            var mouse = new THREE.Vector2();
            mouse.x = ( centerpoint.x / domElement.clientWidth ) * 2 - 1;
            mouse.y = - ( centerpoint.y / domElement.clientHeight ) * 2 + 1;

            this._updateDollyTrack(mouse);
        }

        _handleTouchStartDolly( event ) {
            this._handleUpdateDollyTrackTouch(event);

            var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
            var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

            var distance = Math.sqrt( dx * dx + dy * dy );

            this._dollyStart.set( 0, distance );

        }

        _handleTouchStartPan( event ) {

            //console.log( 'handleTouchStartPan' );

            this._panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

        }


        _handleTouchMoveDolly( event ) {
            this._handleUpdateDollyTrackTouch(event);

            //console.log( 'handleTouchMoveDolly' );

            var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
            var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

            var distance = Math.sqrt( dx * dx + dy * dy );

            this._dollyEnd.set( 0, distance );

            this._dollyDelta.subVectors( this._dollyEnd, this._dollyStart );

            if ( this._dollyDelta.y > 0 ) {

                this._dollyOut( this._getZoomScale() );

            } else if ( this._dollyDelta.y < 0 ) {

                this._dollyIn( this._getZoomScale() );

            }

            this._dollyStart.copy( this._dollyEnd );

            this.update();

        }

        _handleTouchMovePan( event ) {

            this._panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

            this._panDelta.subVectors( this._panEnd, this._panStart );

            this._pan( this._panDelta.x, this._panDelta.y );

            this._panStart.copy( this._panEnd );

            this.update();

        }

        _handleTouchEnd( event ) {
            //console.log( 'handleTouchEnd' );
        }

        //
        // event handlers - FSM: listen for events and reset state
        //

        _onMouseDown( event ) {

            if ( this.enabled === false ) return;

            event.preventDefault();

            if ( event.button === this.mouseButtons.ZOOM ) {

                if ( this.enableZoom === false ) return;

                this._handleMouseDownDolly( event );

                this._state = this._STATES.DOLLY;

            } else if ( event.button === this.mouseButtons.PAN ) {

                if ( this.enablePan === false ) return;

                this._handleMouseDownPan( event );

                this._state = this._STATES.PAN;

            }

            if ( this._state !== this._STATES.NONE ) {

                document.addEventListener( 'mousemove', this._onMouseMove.bind(this), false );
                document.addEventListener( 'mouseup', this._onMouseUp.bind(this), false );

                this.dispatchEvent( this._startEvent );

            }

        }

        _onMouseMove( event ) {

            if ( this.enabled === false ) return;

            event.preventDefault();

            if ( this._state === this._STATES.DOLLY ) {

                if ( this.enableZoom === false ) return;

                this._handleMouseMoveDolly( event );

            } else if ( this._state === this._STATES.PAN ) {

                if ( this.enablePan === false ) return;

                this._handleMouseMovePan( event );
            }
        }

        _onMouseUp( event ) {

            if ( this.enabled === false ) return;

            this._handleMouseUp( event );

            document.removeEventListener( 'mousemove', this._onMouseMove, false );
            document.removeEventListener( 'mouseup', this._onMouseUp, false );

            this.dispatchEvent( this._endEvent );

            this._state = this._STATES.NONE;

        }

        _onMouseWheel( event ) {
            if ( this.enabled === false || this.enableZoom === false || ( this._state !== this._STATES.NONE ) ) return;

            event.preventDefault();
            event.stopPropagation();

            this._handleMouseWheel( event );

            this.dispatchEvent( this._startEvent ); // not sure why these are here...
            this.dispatchEvent( this._endEvent );

        }

        _onKeyDown( event ) {

            if ( this.enabled === false || this.enableKeys === false || this.enablePan === false ) return;

            this._handleKeyDown( event );

        }

        _onTouchStart( event ) {

            if ( this.enabled === false ) return;

            switch ( event.touches.length ) {
                case 1: // three-fingered touch: pan

                    if ( this.enablePan === false ) return;

                    this._handleTouchStartPan( event );

                    this._state = this._STATES.TOUCH_PAN;

                    break;

                case 2:	// two-fingered touch: dolly

                    if ( this.enableZoom === false ) return;

                    this._handleTouchStartDolly( event );

                    this._state = this._STATES.TOUCH_DOLLY;

                    break;

                default:

                    this._state = this._STATES.NONE;

            }

            if ( this._state !== this._STATES.NONE ) {

                this.dispatchEvent( this._startEvent );

            }

        }

        _onTouchMove( event ) {

            if ( this.enabled === false ) return;

            event.preventDefault();
            event.stopPropagation();

            switch ( event.touches.length ) {

                case 1: // one-fingered touch: pan
                    if ( this.enablePan === false ) return;
                    if ( this._state !== this._STATES.TOUCH_PAN ) return; // is this needed?...

                    this._handleTouchMovePan( event );

                    break;

                case 2: // two-fingered touch: dolly

                    if ( this.enableZoom === false ) return;
                    if ( this._state !== this._STATES.TOUCH_DOLLY ) return; // is this needed?...

                    this._handleTouchMoveDolly( event );

                    break;

                default:

                    this._state = this._STATES.NONE;

            }

        }

        _onTouchEnd( event ) {

            if ( this.enabled === false ) return;

            this._handleTouchEnd( event );

            this.dispatchEvent( this._endEvent );

            this._state = this._STATES.NONE;

        }

        _onContextMenu( event ) {
            event.preventDefault();
        }

};

THREE.MapControls = MapControls;
export default MapControls;
