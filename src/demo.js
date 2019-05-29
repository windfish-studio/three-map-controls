var THREE = require('three');
var MapControls = require('./three-map-controls.js').default || THREE.MapControls;

const SPHERE_RADIUS = 10;

class MapControlsDemo {
    constructor (mode) {
        this.container = document.body;
        this.scene = new THREE.Scene();
        this.renderer = null;
        this.meshes = [];
        this.dims = 10;
        this.selectedObject = null;
        this.controls;
        this.mode;

        this.debugCamViewInterval;

        this.camViewMesh;
        this.camViewLines;

        this.init();
        this.setMode(mode);
        this.animate();
    }

    setMode(mode) {
        this.mode = mode;
        const links = {
            sphere: document.getElementById('sphere-link'),
            plane: document.getElementById('plane-link')
        };

        links[this.mode].style.display = 'none';
        links[(this.mode == 'plane')? 'sphere' : 'plane'].style.display = 'inline-block';

        this.meshes.concat([this.camViewLines, this.camViewMesh]).forEach((_m) => {
            if(_m === undefined){
                return;
            }

            this.scene.remove(_m);
            _m.geometry.dispose();
        });

        this.camViewLines = this.camViewMesh = undefined;

        switch(this.mode){
            case 'sphere':
                this.initSphere();
                break;
            case 'plane':
                this.initPlane();
                break;
        }
    }

    initSphere(){

        var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
        camera.position.z = 40;
        this.controls = new MapControls( camera, this.renderer.domElement, {
            target: new THREE.Sphere(new THREE.Vector3(0,0,0), SPHERE_RADIUS),
            mode: 'sphere',
            minDistance: 1,
            maxDistance: camera.position.z
        });

        const colors = [];

        const geometry = new THREE.SphereBufferGeometry(SPHERE_RADIUS, this.dims, this.dims);
        geometry.computeBoundingSphere();

        const vertices = geometry.getAttribute('position').array;
        for(var i = 0; i < vertices.length; i += 3){
            var color = new THREE.Color();
            var vert = new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]);

            color.setRGB(
                ( vert.x / SPHERE_RADIUS ) + 0.5,
                ( vert.y / SPHERE_RADIUS ) + 0.5,
                ( vert.z / SPHERE_RADIUS ) + 0.5
            );

            colors.push( color.r, color.g, color.b );
        }

        geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( Float32Array.from(colors), 3 ) );

        const points = new THREE.Points(
            geometry,
            new THREE.PointsMaterial( { size: 1, vertexColors: THREE.VertexColors } )
        );

        this.scene.add( points );
        this.meshes.push( points );

        const polys = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({
                vertexColors: THREE.VertexColors,
                transparent: true,
                opacity: 0.2

            })
        );

        this.meshes.push( polys );
        this.scene.add( polys );

        const lines = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({
                vertexColors: THREE.VertexColors,
                wireframe: true
            })
        );

        this.meshes.push( lines );
        this.scene.add( lines );

    }

    toggleDebugCamView(e){
        if(!e.target.checked){
            clearInterval(this.debugCamViewInterval);
            this.scene.remove( this.camViewMesh );
            this.scene.remove( this.camViewLines );
            this.camViewMesh.geometry.dispose();
            this.camViewLines.geometry.dispose();
            this.camViewLines = this.camViewMesh = undefined;
            return true;
        }

        this.debugCamViewInterval = setInterval(() => {
            const bbox = this.controls.targetAreaVisible();
            console.log(`${bbox.min.x}, ${bbox.min.y}, ${bbox.max.x}, ${bbox.max.y}`);

            let geometry, position;
            position = new THREE.Vector3(0,0,0);

            switch (this.mode) {
                case 'sphere':
                    let phidelta = Math.abs(bbox.max.x - bbox.min.x);
                    if(phidelta > Math.PI){
                        phidelta = Math.abs((bbox.max.x + Math.PI*2) - bbox.min.x);
                    }
                    geometry = new THREE.SphereBufferGeometry(SPHERE_RADIUS, this.dims, this.dims,
                        bbox.min.x + Math.PI/2, //phistart
                        phidelta, //philength
                        -bbox.max.y + Math.PI/2, //thetastart
                        Math.abs(bbox.max.y - bbox.min.y) //thetalength
                    );
                    break;
                case 'plane':

                    geometry = new THREE.PlaneBufferGeometry(
                        (bbox.max.x - bbox.min.x),
                        (bbox.max.y - bbox.min.y),
                        this.dims, this.dims
                    );

                    position.copy(this.controls.camera.position);
                    position.z = 0;

                    break;
            }

            if(this.camViewMesh == undefined){
                this.camViewMesh = new THREE.Mesh(
                    geometry,
                    new THREE.MeshBasicMaterial({
                        color: new THREE.Color(255, 0, 0),
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.5
                    })
                );

                this.camViewLines = new THREE.Mesh(
                    geometry,
                    new THREE.MeshBasicMaterial({
                        color: new THREE.Color(255, 0, 0),
                        wireframe: true
                    })
                );

                this.scene.add( this.camViewMesh );
                this.scene.add( this.camViewLines );
            }else{

                this.camViewMesh.geometry.copy(geometry);
                this.camViewLines.geometry.copy(geometry);

                geometry.dispose();
            }

            this.camViewMesh.geometry.computeBoundingSphere();
            this.camViewMesh.position.copy(position);
            this.camViewLines.position.copy(position);

        }, 1000);
    }

    initPlane(){

        var camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
        camera.position.z = 20;
        this.controls = new MapControls( camera, this.renderer.domElement, {
            target: new THREE.Plane(new THREE.Vector3(0,0,1), 0),
            mode: 'plane',
            minDistance: 2.0,
            maxDistance: 20
        });

        var offset = 3;

        for(var x = 0; x < this.dims; x++){
            for(var y = 0; y < this.dims; y++){
                var geometry = new THREE.CubeGeometry(1, 1, 1);
                var material = new THREE.MeshNormalMaterial();

                var mesh = new THREE.Mesh( geometry, material );
                mesh.position.x += ((-0.5 * this.dims * offset) + (x * offset));
                mesh.position.y += ((-0.5 * this.dims * offset) + (y * offset));

                this.meshes.push( mesh );
                this.scene.add( mesh );

                mesh.geometry.computeBoundingSphere();
            }
        }
    }

    init () {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        this.container.appendChild( this.renderer.domElement );

        window.addEventListener( 'resize', ()=>{
            this.onWindowResize();
        }, false );

        this.renderer.domElement.addEventListener( 'mousedown', (_e) => {this.pick(_e)} );
        this.renderer.domElement.addEventListener( 'dblclick', (_e) => {this.zoomTo(_e)} );

        const cb = document.getElementById('toggleCamDebug');
        cb.addEventListener('click', this.toggleDebugCamView.bind(this));
    }

    zoomTo(){
        if(!this.selectedObject)
            return;

        this.controls.zoomToFit(this.selectedObject);
    }

    pick(event){
        var mouse = new THREE.Vector2();

        mouse.x = ( event.clientX / this.renderer.domElement.clientWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / this.renderer.domElement.clientHeight ) * 2 + 1;

        var raycaster = new THREE.Raycaster();

        raycaster.setFromCamera(mouse, this.controls.camera);

        // calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects( this.scene.children, true );
        if(intersects.length > 0){
            this.selectedObject = intersects[0].object;
        }else{
            this.selectedObject = null;
        }

    }

    onWindowResize(){
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.controls.camera.aspect = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight;
        this.controls.camera.updateProjectionMatrix();
        this.renderer.setSize( this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight );
    }

    animate(){
        requestAnimationFrame( () => {
            this.animate();
        } );

        if(this.mode == 'plane'){
            this.meshes.forEach(( mesh ) => {
                mesh.rotation.x += 0.005;
                mesh.rotation.y += 0.01;
            });
        }

        this.controls.update();
        this.renderer.render( this.scene, this.controls.camera );
    }
};

window.addEventListener('load', () => {
    window.demo = new MapControlsDemo('sphere');
});