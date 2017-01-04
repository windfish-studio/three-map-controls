'use strict';

var tape = require('tape');
var dom = require('dom-stub');
var THREE = require('three');
var _ = require('lodash');
require('../lib/three-map-controls.js');


//Init stubs / test objects
var camera = new THREE.PerspectiveCamera(45, (16 / 9), 1, 1000);

global.document = dom();
var el = dom();
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
}

var stub = function(){};

function EventStub(data){

    this.preventDefault = stub;
    this.stopPropagation = stub;

    return _.extend(this, data);
}

tape("shouldn't allow initialization if camera intersects plane", function (t) {
    try{
        controls = new THREE.MapControls( camera, el, defaultOpts );
        t.fail('controls created where camera intersects target plane');
    }catch(e){
        t.pass('camera cannot intersect target plane on init');
    }

    camera.position.set(2,1,-500);

    try{
        controls = new THREE.MapControls( camera, el, defaultOpts );
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

tape('should detect orientation from initial cam position', function(t){
    //-20 because the camera initializes on the negative-z side of our target plane
    t.ok((new THREE.Vector3(2,1,-20)).equals(controls.object.position));
    t.end();
});

tape("shouldn't move from initial position if no input received", function(t){
    advanceFrames(10);
    var distance = currentDistance();
    t.equals(distance, controls.maxDistance);
    t.end();
});

tape("should orient camera towards plane", function(t){
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
    t.equals(Math.round(calculated * 1000), Math.round(distance * 1000));
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