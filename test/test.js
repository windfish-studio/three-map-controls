'use strict';

var tape = require('tape');
var dom = require('dom-stub');
var THREE = require('three');
var _ = require('lodash');
var MapControls = require('../lib/three-map-controls.js').default;


//Init stubs / test objects
global.document = dom();

var el = dom(); //render canvas is 100x100 pixels
el.width = 800;
el.height = 600;
el.clientHeight = el.height;
el.clientWidth = el.width;

var camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 1, 1000);

var inputEvents = {};
_.each([global.document, el], function(_el){
    _el.addEventListener = function(key, listener){
        inputEvents[key] = listener;
    };
    _el.removeEventListener = function(){};
});


var defaultOpts = {
    target: new THREE.Plane(new THREE.Vector3(0,0,1), 0),
    minDistance: 2.0,
    maxDistance: 20
};

var controls;

function advanceFrames(frames){
    _.each(new Array(frames), function(){
        controls.update();
    });
};

function currentDistance(){
    return Math.abs(controls.target.distanceToPoint(camera.position));
};

var stub = function(){};

function EventStub(data){

    this.preventDefault = stub;
    this.stopPropagation = stub;

    return _.extend(this, data);
};

var mouse_x = 400;
var mouse_y = 300;
var raycaster = new THREE.Raycaster();

//raycasts the current mouse position and intersects the target plane
var intersectMouse = function(){
    var mouse_pos = new THREE.Vector2(( mouse_x / el.width ) * 2 - 1, - ( mouse_y / el.height ) * 2 + 1); //NDC
    raycaster.setFromCamera(mouse_pos, controls.object);
    return raycaster.ray.intersectPlane(controls.target);
};

var initial_cam_pos = new THREE.Vector3(3,2,-20); //what it should be, used for comparisons

tape("shouldn't allow initialization if camera intersects plane", function (t) {
    try{
        controls = new MapControls( camera, el, defaultOpts );
        t.fail('controls created where camera intersects target plane');
    }catch(e){
        t.pass('camera cannot intersect target plane on init');
    }

    var _init_pos = initial_cam_pos.clone();
    _init_pos.z = -1;
    camera.position.copy(_init_pos);

    try{
        controls = new MapControls( camera, el, defaultOpts );
        t.pass('controls created correctly');
    }catch(e){
        t.fail('controls not created successfully');
    }

    t.end();
});

tape('should initialize with cam at controls.maxDistance by default', function(t){
    var distance = currentDistance();
    t.equals(distance, controls.maxDistance);
    t.equals(controls.getZoomAlpha(), controls.initialZoom);

    t.end();
});

tape("shouldn't move from initial position if no input received", function(t){
    advanceFrames(10);
    var distance = currentDistance();
    t.equals(distance, controls.maxDistance);
    t.ok(initial_cam_pos.equals(controls.object.position));
    t.end();
});

tape("should automatically orient camera towards plane based on starting position", function(t){
    var cam_vec = camera.getWorldDirection();
    t.ok(cam_vec.equals(controls.target.normal) || cam_vec.multiplyScalar(-1).equals(controls.target.normal));
    t.end();
});

tape('should lerp camera towards target plane on mousewheel', function (t) {
    var lastDistance = currentDistance();
    inputEvents.mousewheel(new EventStub({wheelDelta: 1}));
    advanceFrames(1000);
    var distance = currentDistance();
    var calculated = lastDistance * Math.pow(0.95, controls.zoomSpeed);
    t.equals(Math.round(calculated * 1000), Math.round(distance * 1000)); //round both to 3rd decimal place for comparison
    t.end();
});

tape('should stop zooming at minDistance from target plane', function (t) {

    _.each(new Array(20), function(){
        inputEvents.mousewheel(new EventStub({wheelDelta: 1}));
    });

    advanceFrames(1000);
    var distance = currentDistance();
    t.equals(Math.round(controls.minDistance * 1000), Math.round(distance * 1000));
    t.equals(controls.getZoomAlpha(), 1);
    t.end();

});

tape('reset should revert camera to correct initial position', function(t){
    controls.reset();
    t.ok(initial_cam_pos.equals(controls.object.position));
    t.end();
});

tape('should zoom into mouse pointer', function(t){ //e.g. should act like maps controls.
    var intersect = intersectMouse();

    //this is where the camera should end up when all-the-way zoomed
    var max_zoom_pos = new THREE.Vector3().addVectors(intersect, new THREE.Vector3().subVectors(controls.object.position, intersect).normalize().multiplyScalar(controls.minDistance));

    _.each(new Array(30), function(){
        inputEvents.mousewheel(new EventStub({
            wheelDelta: 1,
            clientX: mouse_x,
            clientY: mouse_y
        }));
    });

    advanceFrames(1000);
    var tolerance = 0.00001;
    var delta = Math.abs(new THREE.Vector3().subVectors(max_zoom_pos, controls.object.position).length());

    t.ok( delta <= tolerance );
    t.end();
});


var testPanCalibration = function(t, new_x, new_y){

    //push mouse button down..
    inputEvents.mousedown(new EventStub({
        clientX: mouse_x,
        clientY: mouse_y,
        button: controls.mouseButtons.PAN
    }));

    //record current mouse-target raycast intersection
    var first_intersect = new THREE.Vector3().subVectors(intersectMouse().multiplyScalar(-1), controls.object.position);

    //now move mouse...
    mouse_x = new_x;
    mouse_y = new_y;

    inputEvents.mousemove(new EventStub({
        clientX: mouse_x,
        clientY: mouse_y
    }));

    advanceFrames(1000);

    //record current mouse-target raycast intersection
    var second_intersect = new THREE.Vector3().subVectors(intersectMouse().multiplyScalar(-1), controls.object.position);

    //second_intersect should be the same as first_intersect; e.g. the point in world-space under the mouse should not
    //have changed during pan operation
    var tolerance = 0.0001;
    t.ok(Math.abs(new THREE.Vector3().subVectors(second_intersect, first_intersect).length()) <= tolerance);

};

tape('mouse should keep same world coordinates under it during camera pan (pan calibration)', function(t){
    controls.reset();

    testPanCalibration(t, 400, 500);

    t.end();
});

//reset mouse
mouse_x = 400;
mouse_y = 300;

tape('initialZoom parameter should set the default cam position correctly', function(t){
    controls.initialZoom = 0.5;
    controls.reset();

    var correct_z = initial_cam_pos.z + ((controls.maxDistance - controls.minDistance) / 2);
    t.equals(controls.object.position.z, correct_z);

    //try max zoom
    controls.initialZoom = 1;
    controls.reset();

    var correct_z = -controls.minDistance;
    t.equals(controls.object.position.z, correct_z);

    t.end();
});

tape('pan calibration should hold true when zoomed in', function(t){
    testPanCalibration(t, 400, 500);

    t.end();
});
