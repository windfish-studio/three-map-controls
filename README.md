# three-map-controls
Map controls class for threeJS (pan and zoom with respect to a THREE.Plane)

Works with mobile device touch events.

##usage

```javascript
import MapControls from 'three-map-controls'

// currently, only PerspectiveCamera is supported
new MapControls( camera, renderer.domElement, {
    target: new THREE.Plane(new THREE.Vector3(0,0,1), 0),
    minDistance: 2.0,
    maxDistance: 20
});
```

Here's a [jsfiddle demo]: https://jsfiddle.net/sikanrong/m8c250o2/


##options

```javascript
// this.[option] = [default value];

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
this.zoomSpeed = 3.0;
this.zoomDampingAlpha = 0.1;

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

```

##public functions
```javascript

// returns current zoom value [range between 0 and 1];
// O represents the camera at maxDistance from the target-plane, and 1 is the camera at minDistance.
this.getZoomAlpha();

//needs to be called on each animation frame.
this.update();

```

##TAP-compatible tests
```
$ node test/test.js

TAP version 13
# shouldn't allow initialization if camera intersects plane
ok 1 camera cannot intersect target plane on init
ok 2 controls created correctly
# should initialize with cam at controls.maxDistance by default
ok 3 should be equal
ok 4 should be equal
# shouldn't move from initial position if no input received
ok 5 should be equal
ok 6 should be truthy
# should automatically orient camera towards plane based on starting position
ok 7 should be truthy
# should lerp camera towards target plane on mousewheel
ok 8 should be equal
# should stop zooming at minDistance from target plane
ok 9 should be equal
ok 10 should be equal
# reset should revert camera to correct initial position
ok 11 should be truthy
# should zoom into mouse pointer
ok 12 should be truthy
# mouse should keep same world coordinates under it during camera pan (pan calibration)
ok 13 should be truthy
# initialZoom parameter should set the default cam position correctly
ok 14 should be equal
ok 15 should be equal
# pan calibration should hold true when zoomed in
ok 16 should be truthy

1..16
# tests 16
# pass  16

# ok
```
