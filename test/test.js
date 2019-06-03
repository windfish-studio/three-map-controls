'use strict';
import test from 'ava';
import * as THREE from 'three';
import MapControls from '../src/three-map-controls.js';

//test stubs
if(typeof window == 'undefined'){
    global.window = require('./stub_dom');
}

const aspect = window.document.body.clientWidth / window.document.body.clientHeight;
const camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);

global.inputEvents = {};

const addEventListenerStub = (key, listener) => {
    inputEvents[key] = listener;
};

window.document.addEventListener = addEventListenerStub;
window.document.body.addEventListener = addEventListenerStub;

const defaultOpts = {
    target: new THREE.Plane(new THREE.Vector3(0,0,1), 0),
    mode: 'plane',
    minDistance: 2.0,
    maxDistance: 20
};

let controls;

function advanceFrames(frames){
    (Array.apply(null, Array(frames))).forEach(function(){
        controls.update();
        controls.camera.updateMatrixWorld();
    });
};

function currentDistance(){
    return Math.abs(controls.target.distanceToPoint(controls.camera.position));
};

const stub = function(){};

function EventStub(data){

    this.preventDefault = stub;
    this.stopPropagation = stub;

    return Object.assign(this, data);
};

const sigfigs = 3;
const fastRound = (_n) => {
    const p = Math.pow(10, sigfigs);
    return (Math.round(_n*p)/p);
};


var initial_cam_pos = new THREE.Vector3(3,2,-20); //what it should be, used for comparisons

test("shouldn't allow initialization if camera intersects plane", function (t) {
    try{
        controls = new MapControls( camera, window.document.body, defaultOpts );
        t.fail('controls created where camera intersects target plane');
    }catch(e){
        t.pass('camera cannot intersect target plane on init');
    }

    camera.position.copy(initial_cam_pos.clone());
    camera.position.z = 1;

    try{
        controls = new MapControls( camera, window.document.body, defaultOpts );
        t.pass('controls created correctly');
    }catch(e){
        console.log(e);
        t.fail('controls not created successfully');
    }


});

test('should correctly determine the camera orientation to the target plane', function (t) {
    t.deepEqual(controls._camOrientation.toArray(), [0,0,-1]);
    camera.position.z = -1;
    controls = new MapControls( camera, window.document.body, defaultOpts );
    t.deepEqual(controls._camOrientation.toArray(), [0,0,1]);

});

test('should initialize with cam at controls.maxDistance by default', function(t){
    var distance = currentDistance();
    t.is(distance, controls.maxDistance);
    t.is(controls.getZoomAlpha(), controls.initialZoom);

});

test("shouldn't move from initial position if no input received", function(t){
    advanceFrames(10);
    var distance = currentDistance();
    t.is(distance, controls.maxDistance);
    t.truthy(initial_cam_pos.equals(controls.camera.position));
});

test("should automatically orient camera towards plane based on starting position", function(t){
    var cam_vec = new THREE.Vector3();
    camera.getWorldDirection(cam_vec);
    t.truthy(cam_vec.equals(controls.target.normal) || cam_vec.multiplyScalar(-1).equals(controls.target.normal));
    
});

test('should lerp camera towards target plane on mousewheel', function (t) {
    var lastDistance = currentDistance();
    inputEvents.mousewheel(new EventStub({wheelDelta: 1}));
    advanceFrames(1000);
    var distance = currentDistance();
    var expected = lastDistance * Math.pow(0.95, controls.zoomSpeed);
    t.is(fastRound(distance), fastRound(expected)); //round both to 3rd decimal place for comparison
    
});

test('should stop zooming at minDistance from target plane', function (t) {
    controls.reset();
    (Array.apply(null, Array(20))).forEach(function(){
        inputEvents.mousewheel(new EventStub({
            wheelDelta: 1,
            offsetX: window.document.body.clientWidth / 2,
            offsetY: window.document.body.clientHeight / 2
        }));
    });

    advanceFrames(1000);
    var distance = currentDistance();
    t.is(controls.minDistance, distance);
    t.is(controls.getZoomAlpha(), 1);
    

});

test('reset should revert camera to correct initial position', function(t){
    controls.reset();
    t.truthy(initial_cam_pos.equals(controls.camera.position));
    
});

test('should zoom into mouse pointer', function(t){ //e.g. should act like maps controls.
    (Array.apply(null, Array(30))).forEach(function(){
        inputEvents.mousewheel(new EventStub({
            wheelDelta: 1,
            offsetX: 400,
            offsetY: 300
        }));
    });

    advanceFrames(1000);
    var tolerance = Math.pow(10, -sigfigs);

    const desired = new THREE.Vector3(
        10.812787997105476,
        5.34833686125601,
        -1.8118972640060278
    );

    var delta = Math.abs(new THREE.Vector3().subVectors(desired, controls.camera.position).length());

    t.truthy( delta <= tolerance );
    
});


var testPanCalibration = function(t, new_x, new_y){

    const intersectMouse = function(x, y){
        var mouse_pos = new THREE.Vector2(
            ( x / window.document.body.clientWidth ) * 2 - 1,
            - ( y / window.document.body.clientHeight ) * 2 + 1); //NDC

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse_pos, controls.camera);

        var intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(controls.target, intersection);
        return intersection;
    };

    const mouse_x = 400, mouse_y = 300;
    //push mouse button down..
    inputEvents.mousedown(new EventStub({
        offsetX: mouse_x,
        offsetY: mouse_y,
        button: controls.mouseButtons.PAN
    }));

    var first_intersect = intersectMouse(mouse_x, mouse_y);

    inputEvents.mousemove(new EventStub({
        offsetX: new_x,
        offsetY: new_y
    }));

    advanceFrames(1000);

    var second_intersect = intersectMouse(new_x, new_y);

    //second_intersect should be the same as first_intersect; e.g. the point in world-space under the mouse should not
    //have changed during pan operation
    var tolerance = 0.0001;
    const delta = Math.abs(new THREE.Vector3().subVectors(second_intersect, first_intersect).length());
    t.truthy(delta <= tolerance);
};

test('mouse should keep same world coordinates under it during camera pan (pan calibration)', function(t){
    controls.reset();
    testPanCalibration(t, 400, 500);
});


test('initialZoom parameter should set the default cam position correctly', function(t){
    controls.initialZoom = 0.5;
    controls.reset();

    var correct_z = initial_cam_pos.z + ((controls.maxDistance - controls.minDistance) / 2);
    t.is(controls.camera.position.z, correct_z);

    //try max zoom
    controls.initialZoom = 1;
    controls.reset();

    var correct_z = -controls.minDistance;
    t.is(controls.camera.position.z, correct_z);
    
});

test('pan calibration should hold true when zoomed in', function(t){
    controls.reset();
    controls.camera.updateWorldMatrix();
    testPanCalibration(t, 400, 500);
});

test('sphere camera should return correct targetVisibleArea', function (t) {
    controls.dispose();
    controls = undefined;

    camera.position.set(0,0,100);
    camera.lookAt(new THREE.Vector3(0,0,0));
    camera.updateWorldMatrix();
    controls = new MapControls( camera, window.document.body, {
        target: new THREE.Sphere(new THREE.Vector3(0,0,0), 10),
        mode: 'sphere',
        minDistance: 2,
        maxDistance: 100
    });

    const bbox = controls.targetAreaVisible();
    const bbox_ar = Array.prototype.concat.apply([], [bbox.min, bbox.max].map(_v => {return _v.toArray()}));
    t.deepEqual(
        bbox_ar,
        [-Math.PI/2, -Math.PI/2, Math.PI/2, Math.PI/2]
    );
});

test('sphere camera should return correct targetVisibleArea on zoom', function (t) {

    (Array.apply(null, Array(20))).forEach(function(){
        inputEvents.mousewheel(new EventStub({
            wheelDelta: 1,
            offsetX: window.document.body.clientWidth / 2,
            offsetY: window.document.body.clientHeight / 2
        }));
    });

    advanceFrames(1000);

    const bbox = controls.targetAreaVisible();
    const bbox_ar = Array.prototype.concat.apply([], [bbox.min, bbox.max].map(_v => {return _v.toArray()}));
    t.deepEqual(
        bbox_ar,
        [
            -0.14727593328821142,
            -0.08284271247461894,
            0.14727593328821142,
            0.08284271247461894
        ]
    );
});
