var THREE = require('three');
var MapControls = require('./three-map-controls.js').default || THREE.MapControls;
var _ = require('lodash');

window.MapControlsDemo = function(){
    var container = document.body;
    var scene, renderer;
    var meshes = [];
    var dims = 10;
    var selectedObject = null;
    var controls;

    init();
    animate();

    function init(){
        var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
        camera.position.z = 20;

        scene = new THREE.Scene();

        var offset = 3;

        for(var x = 0; x < dims; x++){
            for(var y = 0; y < dims; y++){
                var geometry = new THREE.CubeGeometry(1, 1, 1);
                var material = new THREE.MeshNormalMaterial();

                var mesh = new THREE.Mesh( geometry, material );
                mesh.position.x += ((-0.5 * dims * offset) + (x * offset));
                mesh.position.y += ((-0.5 * dims * offset) + (y * offset));

                meshes.push(mesh);

                scene.add( mesh );
                mesh.geometry.computeBoundingSphere();
            }
        }

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );

        container.appendChild( renderer.domElement );

        controls = new MapControls( camera, renderer.domElement, {
            target: new THREE.Plane(new THREE.Vector3(0,0,1), 0),
            minDistance: 2.0,
            maxDistance: 20
        });

        window.addEventListener( 'resize', onWindowResize, false );
        renderer.domElement.addEventListener( 'mousedown', pick);
        renderer.domElement.addEventListener( 'dblclick', zoomTo );
    }

    function zoomTo(){
        if(!selectedObject)
            return;

        controls.zoomToFit(selectedObject);
    }

    function pick(event){
        var mouse = new THREE.Vector2();

        mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

        var raycaster = new THREE.Raycaster();

        raycaster.setFromCamera(mouse, controls.camera);

        // calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects( scene.children, true );
        if(intersects.length > 0){
            selectedObject = intersects[0].object;
        }else{
            selectedObject = null;
        }

    }

    function onWindowResize(){
        renderer.setSize( window.innerWidth, window.innerHeight );
        controls.camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
        controls.camera.updateProjectionMatrix();
        renderer.setSize( renderer.domElement.clientWidth, renderer.domElement.clientHeight );
    }

    function animate(){
        requestAnimationFrame( animate );

        _.each(meshes, function( mesh ){
            mesh.rotation.x += 0.005;
            mesh.rotation.y += 0.01;
        });
        controls.update();
        renderer.render( scene, controls.camera );
    }
};

window.onload = window.MapControlsDemo;