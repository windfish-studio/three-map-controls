'use strict';

//Alex Pilafian 2016 - sikanrong@gmail.com

if(typeof module == 'undefined')
  var module = {};

module.exports = (function(THREE, _){

    THREE.MapControls = function ( object, domElement, options ) {

        //
        // Public Variables
        //

        this.object = object;

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
        this.panDampingAlpha = 0.2;

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
        this.position0 = this.object.position.clone();
        this.zoom0 = this.object.zoom;


        //
        // private vars
        //

        var scope = this;
        var mouse = new THREE.Vector2();

        var changeEvent = { type: 'change' };
        var startEvent = { type: 'start' };
        var endEvent = { type: 'end' };

        var STATE = { NONE : - 1, DOLLY : 1, PAN : 2, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

        var state = STATE.NONE;
        
        var finalTargetDistance;
        var currentTargetDistance;

        var panTarget = new THREE.Vector3();
        var panCurrent = new THREE.Vector3();

        var minZoomPosition = new THREE.Vector3();
        var maxZoomPosition = new THREE.Vector3();

        var panStart = new THREE.Vector2();
        var panEnd = new THREE.Vector2();
        var panDelta = new THREE.Vector2();

        var dollyStart = new THREE.Vector2();
        var dollyEnd = new THREE.Vector2();
        var dollyDelta = new THREE.Vector2();

        var camOrientation = new THREE.Vector2();
        var lastMouse = new THREE.Vector2();

        var zoomAlpha, init;

        // Init (IIFE-style constructor)
        (init = function(_scope){

            if(_scope.target.distanceToPoint(_scope.object.position) == 0){
                throw new Error("ORIENTATION_UNKNOWABLE: initial Camera position cannot intersect target plane.");
            }

            //establish initial camera orientation based on position w.r.t. _scope.target plane
            var intersection, ray;
            _.each([-1, 1], function(orientation){
                if(intersection)
                    return;
                ray = new THREE.Ray(scope.object.position, scope.target.normal.clone().multiplyScalar(orientation));
                intersection = ray.intersectPlane(scope.target);
            });

            updateDollyTrack(ray);

            //place camera at _scope.initialZoom
            _scope.object.position.lerpVectors(minZoomPosition, maxZoomPosition, _scope.initialZoom);
            finalTargetDistance = currentTargetDistance = Math.abs(_scope.target.distanceToPoint(_scope.object.position));

            scope.object.lookAt(maxZoomPosition); //set the orientation of the camera towards the map.
            camOrientation = maxZoomPosition.clone().sub(scope.object.position).normalize();

            updateZoomAlpha();

        })(this);

        //
        // Public functions
        //

        this.getZoomAlpha = function () {
            return zoomAlpha;
        };

        this.reset = function () {

            scope.target.copy( scope.target0 );
            scope.object.position.copy( scope.position0 );
            scope.object.zoom = scope.zoom0;

            scope.object.updateProjectionMatrix();

            init(scope); //reinit

            scope.dispatchEvent( changeEvent );

            scope.update();

            state = STATE.NONE;

        };

        // this method is exposed, but perhaps it would be better if we can make it private...
        this.update = function() {

            var offset = new THREE.Vector3();
            var offsetMaxZoom = new THREE.Vector3();
            var offsetMinZoom = new THREE.Vector3();

            return function update () {

                var position = scope.object.position;

                offsetMaxZoom.copy( maxZoomPosition ).sub( panCurrent );
                offsetMinZoom.copy( minZoomPosition ).sub( panCurrent );

                // move target to panned location
                panCurrent.lerp( panTarget, scope.panDampingAlpha );

                maxZoomPosition.copy( panCurrent ).add( offsetMaxZoom );
                minZoomPosition.copy( panCurrent ).add( offsetMinZoom );

                position.lerpVectors(minZoomPosition, maxZoomPosition, updateZoomAlpha());

                return false;

            };

        }();

        this.dispose = function() {

            scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
            scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
            scope.domElement.removeEventListener( 'mousewheel', onMouseWheel, false );
            scope.domElement.removeEventListener( 'MozMousePixelScroll', onMouseWheel, false ); // firefox

            scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
            scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
            scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

            document.removeEventListener( 'mousemove', onMouseMove, false );
            document.removeEventListener( 'mouseup', onMouseUp, false );

            scope.domElement.removeEventListener( 'keydown', onKeyDown, false );

            //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

        };

        //
        // Private functions
        //

        function updateZoomAlpha(){
            finalTargetDistance = Math.max( scope.minDistance, Math.min( scope.maxDistance, finalTargetDistance ) );
            var diff = currentTargetDistance - finalTargetDistance;
            var damping_alpha = scope.zoomDampingAlpha;
            currentTargetDistance -= diff * damping_alpha;
            var rounding_places = 100000;
            zoomAlpha = Math.abs(Math.round((1 - ((currentTargetDistance - scope.minDistance) / (scope.maxDistance - scope.minDistance))) * rounding_places ) / rounding_places);

            return zoomAlpha;
        }

        function updateDollyTrack(ray){

            // calculate objects intersecting the picking ray
            var intersect = ray.intersectPlane(scope.target);

            if(intersect){
                maxZoomPosition.addVectors(intersect, new THREE.Vector3().subVectors(scope.object.position, intersect).normalize().multiplyScalar(scope.minDistance));
                minZoomPosition.copy(calculateMinZoom(scope.object.position, intersect));

                finalTargetDistance = currentTargetDistance = intersect.clone().sub(scope.object.position).length();
            }
        }

        function getZoomScale() {

            return Math.pow( 0.95, scope.zoomSpeed );

        }


        var panLeft = function() {

            var v = new THREE.Vector3();

            return function panLeft( distance, objectMatrix ) {

                v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
                v.multiplyScalar( - distance );

                panTarget.add( v );

            };

        }();

        var panUp = function() {

            var v = new THREE.Vector3();

            return function panUp( distance, objectMatrix ) {

                v.setFromMatrixColumn( objectMatrix, 1 ); // get Y column of objectMatrix
                v.multiplyScalar( distance );

                panTarget.add( v );

            };

        }();

        // deltaX and deltaY are in pixels; right and down are positive
        var pan = function() {

            return function pan ( deltaX, deltaY ) {


                var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

                var r = new THREE.Ray(scope.object.position, camOrientation);
                var targetDistance = r.distanceToPlane(scope.target);

                // half of the fov is center to top of screen
                targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

                // we actually don't use screenWidth, since perspective camera is fixed to screen height
                panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
                panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );


            };

        }();

        function dollyIn( dollyScale ) {

            if ( scope.object instanceof THREE.PerspectiveCamera ) {

                finalTargetDistance /= dollyScale;

            } else {

                console.warn( 'WARNING: MapControls.js encountered an unknown camera type - dolly/zoom disabled.' );
                scope.enableZoom = false;

            }
        }

        function dollyOut( dollyScale ) {

            if ( scope.object instanceof THREE.PerspectiveCamera ) {

                finalTargetDistance *= dollyScale;

            } else {

                console.warn( 'WARNING: MapControls.js encountered an unknown camera type - dolly/zoom disabled.' );
                scope.enableZoom = false;

            }
        }

        function handleUpdateDollyTrackMouse(event){
            var prevMouse = mouse.clone();
            mouse.set(( event.clientX / domElement.width ) * 2 - 1, - ( event.clientY / domElement.height ) * 2 + 1);

            if(!prevMouse.equals(mouse)){
                var rc = new THREE.Raycaster();
                rc.setFromCamera(mouse, scope.object);
                updateDollyTrack(rc.ray);
            }
        }

        function handleMouseDownDolly( event ) {

            handleUpdateDollyTrackMouse(event);

            //console.log( 'handleMouseDownDolly' );

            dollyStart.set( event.clientX, event.clientY );

        }

        function handleMouseDownPan( event ) {

            //console.log( 'handleMouseDownPan' );

            panStart.set( event.clientX, event.clientY );

        }

        function handleMouseMoveDolly( event ) {

            handleUpdateDollyTrackMouse(event);

            //console.log( 'handleMouseMoveDolly' );

            dollyEnd.set( event.clientX, event.clientY );

            dollyDelta.subVectors( dollyEnd, dollyStart );

            if ( dollyDelta.y > 0 ) {

                dollyIn( getZoomScale() );

            } else if ( dollyDelta.y < 0 ) {

                dollyOut( getZoomScale() );

            }

            dollyStart.copy( dollyEnd );

            scope.update();

        }

        function handleMouseMovePan( event ) {

            //console.log( 'handleMouseMovePan' );

            panEnd.set( event.clientX, event.clientY );

            panDelta.subVectors( panEnd, panStart );

            pan( panDelta.x, panDelta.y );

            panStart.copy( panEnd );

            scope.update();

        }

        function handleMouseUp( event ) {

            //console.log( 'handleMouseUp' );

        }

        function calculateMinZoom(cam_pos, map_intersect){
            return map_intersect.clone().add(
                cam_pos.clone()
                        .sub(map_intersect)
                        .normalize()
                        .multiplyScalar(scope.maxDistance)
                );
        }


        function handleMouseWheel( event ) {
            handleUpdateDollyTrackMouse(event);

            var delta = 0;

            if ( event.wheelDelta !== undefined ) {

                // WebKit / Opera / Explorer 9

                delta = event.wheelDelta;

            } else if ( event.detail !== undefined ) {

                // Firefox

                delta = - event.detail;

            }

            if ( delta > 0 ) {
                dollyOut( getZoomScale() );
            } else if ( delta < 0 ) {
                dollyIn( getZoomScale() );
            }



            scope.update();

        }

        function handleKeyDown( event ) {

            //console.log( 'handleKeyDown' );

            switch ( event.keyCode ) {

                case scope.keys.UP:
                    pan( 0, scope.keyPanSpeed );
                    scope.update();
                    break;

                case scope.keys.BOTTOM:
                    pan( 0, - scope.keyPanSpeed );
                    scope.update();
                    break;

                case scope.keys.LEFT:
                    pan( scope.keyPanSpeed, 0 );
                    scope.update();
                    break;

                case scope.keys.RIGHT:
                    pan( - scope.keyPanSpeed, 0 );
                    scope.update();
                    break;

            }

        }

        function handleUpdateDollyTrackTouch( event ){
            var centerpoint = new THREE.Vector2();

            var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
            var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

            centerpoint.x = event.touches[ 0 ].pageX + (dx / 2);
            centerpoint.y = event.touches[ 0 ].pageY + (dy / 2);

            var mouse = new THREE.Vector2();
            mouse.x = ( centerpoint.x / domElement.width ) * 2 - 1;
            mouse.y = - ( centerpoint.y / domElement.height ) * 2 + 1;

            updateDollyTrack(mouse);
        }

        function handleTouchStartDolly( event ) {
            handleUpdateDollyTrackTouch(event);

            var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
            var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

            var distance = Math.sqrt( dx * dx + dy * dy );

            dollyStart.set( 0, distance );

        }

        function handleTouchStartPan( event ) {

            //console.log( 'handleTouchStartPan' );

            panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

        }


        function handleTouchMoveDolly( event ) {
            handleUpdateDollyTrackTouch(event);

            //console.log( 'handleTouchMoveDolly' );

            var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
            var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

            var distance = Math.sqrt( dx * dx + dy * dy );

            dollyEnd.set( 0, distance );

            dollyDelta.subVectors( dollyEnd, dollyStart );

            if ( dollyDelta.y > 0 ) {

                dollyOut( getZoomScale() );

            } else if ( dollyDelta.y < 0 ) {

                dollyIn( getZoomScale() );

            }

            dollyStart.copy( dollyEnd );

            scope.update();

        }

        function handleTouchMovePan( event ) {

            //console.log( 'handleTouchMovePan' );

            panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

            panDelta.subVectors( panEnd, panStart );

            pan( panDelta.x, panDelta.y );

            panStart.copy( panEnd );

            scope.update();

        }

        function handleTouchEnd( event ) {

            //console.log( 'handleTouchEnd' );

        }

        //
        // event handlers - FSM: listen for events and reset state
        //

        function onMouseDown( event ) {

            if ( scope.enabled === false ) return;

            event.preventDefault();

            if ( event.button === scope.mouseButtons.ZOOM ) {

                if ( scope.enableZoom === false ) return;

                handleMouseDownDolly( event );

                state = STATE.DOLLY;

            } else if ( event.button === scope.mouseButtons.PAN ) {

                if ( scope.enablePan === false ) return;

                handleMouseDownPan( event );

                state = STATE.PAN;

            }

            if ( state !== STATE.NONE ) {

                document.addEventListener( 'mousemove', onMouseMove, false );
                document.addEventListener( 'mouseup', onMouseUp, false );

                scope.dispatchEvent( startEvent );

            }

        }

        function onMouseMove( event ) {

            if ( scope.enabled === false ) return;

            event.preventDefault();

            if ( state === STATE.DOLLY ) {

                if ( scope.enableZoom === false ) return;

                handleMouseMoveDolly( event );

            } else if ( state === STATE.PAN ) {

                if ( scope.enablePan === false ) return;

                handleMouseMovePan( event );

            }

        }

        function onMouseUp( event ) {

            if ( scope.enabled === false ) return;

            handleMouseUp( event );

            document.removeEventListener( 'mousemove', onMouseMove, false );
            document.removeEventListener( 'mouseup', onMouseUp, false );

            scope.dispatchEvent( endEvent );

            state = STATE.NONE;

        }

        function onMouseWheel( event ) {

            if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE ) ) return;

            event.preventDefault();
            event.stopPropagation();

            handleMouseWheel( event );

            scope.dispatchEvent( startEvent ); // not sure why these are here...
            scope.dispatchEvent( endEvent );

        }

        function onKeyDown( event ) {

            if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;

            handleKeyDown( event );

        }

        function onTouchStart( event ) {

            if ( scope.enabled === false ) return;

            switch ( event.touches.length ) {
                case 1: // three-fingered touch: pan

                    if ( scope.enablePan === false ) return;

                    handleTouchStartPan( event );

                    state = STATE.TOUCH_PAN;

                    break;

                case 2:	// two-fingered touch: dolly

                    if ( scope.enableZoom === false ) return;

                    handleTouchStartDolly( event );

                    state = STATE.TOUCH_DOLLY;

                    break;

                default:

                    state = STATE.NONE;

            }

            if ( state !== STATE.NONE ) {

                scope.dispatchEvent( startEvent );

            }

        }

        function onTouchMove( event ) {

            if ( scope.enabled === false ) return;

            event.preventDefault();
            event.stopPropagation();

            switch ( event.touches.length ) {

                case 1: // one-fingered touch: pan
                    if ( scope.enablePan === false ) return;
                    if ( state !== STATE.TOUCH_PAN ) return; // is this needed?...

                    handleTouchMovePan( event );

                    break;

                case 2: // two-fingered touch: dolly

                    if ( scope.enableZoom === false ) return;
                    if ( state !== STATE.TOUCH_DOLLY ) return; // is this needed?...

                    handleTouchMoveDolly( event );

                    break;

                default:

                    state = STATE.NONE;

            }

        }

        function onTouchEnd( event ) {

            if ( scope.enabled === false ) return;

            handleTouchEnd( event );

            scope.dispatchEvent( endEvent );

            state = STATE.NONE;

        }

        function onContextMenu( event ) {

            event.preventDefault();

        }

        //

        scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );

        scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
        scope.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
        scope.domElement.addEventListener( 'MozMousePixelScroll', onMouseWheel, false ); // firefox

        scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
        scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
        scope.domElement.addEventListener( 'touchmove', onTouchMove, false );

        scope.domElement.addEventListener( 'keydown', onKeyDown, false );

        // force an update at start

        this.update();

    };

    THREE.MapControls.prototype = Object.create( THREE.EventDispatcher.prototype );
    THREE.MapControls.prototype.constructor = THREE.MapControls;

    return THREE.MapControls;

})(require('three') || window.THREE, require('lodash') || window._);