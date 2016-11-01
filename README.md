# three-map-controls
Map controls class for threeJS (pan and zoom with respect to a THREE.Plane)

Works with mobile device touch events.

##usage

```javascript
new THREE.MapControls( camera, renderer.domElement, {
    target: new THREE.Plane(new THREE.Vector3(0,0,1), 0),
    minDistance: 2.0,
    maxDistance: 20
});
```

Here's a [jsfiddle demo]: https://jsfiddle.net/sikanrong/m8c250o2/1/


##options

```javascript
// this.[option] = [default value];

// Set to false to disable this control (Disables all input events)
this.enabled = true;

// Must be set to instance of THREE.Plane
this.target;

// How far you can dolly in and out
this.minDistance = 0;
this.maxDistance = Infinity;

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

//returns current zoom (value between 0 and 1)
this.getZoomAlpha();

//needs to be called on each animation frame.
this.update();

```