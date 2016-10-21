# three-map-controls
Map controls class for threeJS (pan and zoom with respect to a THREE.Plane)

##usage

```javascript
new THREE.MapControls( camera, renderer.domElement, {
    target: new THREE.Plane(new THREE.Vector3(0,0,1), 0),
    minDistance: 2.0,
    maxDistance: 20
});
```

Here's a [jsfiddle demo]: https://jsfiddle.net/sikanrong/m8c250o2/1/