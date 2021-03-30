var width = window.innerWidth-20;
var height = window.innerHeight-50;
var aspectRatio = width / height;
var viewSize = 20;

var numberOfVertices = 100;
var numberOfEdges = 125;

var worldMax = (width/3)*Math.log(Math.log(numberOfVertices));
var camDim = worldMax*3/2;

var layoutIterations = 40;
var layoutScale = 25;
var layoutGravity = 1;

let container;
let camera, scene, raycaster, renderer, controls, graph;
let INTERSECTED, SELECTED;
const mouse = new THREE.Vector2();

// start the show!
init();
animate();

function animate() {
    requestAnimationFrame( animate );
    //updateStickyDiv();
    render();
}

function init () {
    container = document.createElement( 'div' );
    container.id = 'main';
    document.body.appendChild( container );

    // initialise the camera
    //camera = new THREE.OrthographicCamera(-aspectRatio * viewSize / 2, aspectRatio * viewSize / 2, viewSize / 2, -viewSize / 2, -500, 500);
    camera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, -width, width);
    camera.position.set(0, 0, width/2);
    //camera.zoom = 0.09;
    camera.updateProjectionMatrix();

    scene = new THREE.Scene();
    fogColor = new THREE.Color(0x2d2d2d);
    scene.background = fogColor;
    scene.fog = new THREE.Fog(fogColor, 2500, 5000);

    // initialise the lighting
    var ambientLight = new THREE.AmbientLight(0x404040, 3.0);
    var light = new THREE.DirectionalLight(0x3822E4, 0.75);
    light.position.set(1, 1, 1).normalize();
    scene.add(ambientLight);
    scene.add(light);

    // initialise the orbital controls
    controls = new THREE.OrbitControls(camera);
    controls.enablePan = true;
    controls.enableRotate = true;

    // create a renderer and append to the dom
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(width, height);
    renderer.setClearColor(0xffffff, 1);
    container.appendChild(renderer.domElement);

    // create a new graph object
    graph = new Graph(-worldMax, worldMax, -worldMax, worldMax, -worldMax, worldMax);

    raycaster = new THREE.Raycaster();

    //var geometry = new THREE.SphereGeometry( 10, 8, 8 );
	//var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
	//lock = new THREE.Mesh( geometry, material );
	//lock.position.y = 500;
	//lock.visible = false;
    //scene.add(lock);

    // attach the event listeners to create new graphs
    // add event listeners to button
    document.getElementById('fruchterman-reingold-button').addEventListener('click', function() {
        restart();
        graph.removeMeshes(scene);
        graph.initRandomGraph(numberOfVertices, numberOfEdges);
        graph.applyLayout(layoutIterations, layoutScale, layoutGravity);
        graph.update();
        graph.initMeshes(scene);
    });

    document.getElementById('community-button').addEventListener('click', function() {
        restart();
        graph.removeMeshes(scene);
        graph.initCommunityGraph(numberOfVertices, 4, 0.35, 0.005);
        graph.applyLayout(layoutIterations, layoutScale, layoutGravity);
        graph.update();
        graph.initMeshes(scene);
    });

    document.getElementById('powerlaw-button').addEventListener('click', function() {
        restart();
        graph.removeMeshes(scene);
        graph.initPowerLawGraph(numberOfVertices);
        graph.applyLayout(layoutIterations, layoutScale, layoutGravity);
        graph.update();
        graph.initMeshes(scene);
    });

    document.getElementById('random-kamada-kawai').addEventListener('click', function() {
        restart();
        graph.removeMeshes(scene);
        graph.initRandomGraph(numberOfVertices, numberOfEdges);
        graph.applyKKLayout(0.1, 0.1);
        graph.update();
        graph.initMeshes(scene);
    });

    document.getElementById('json-fr').addEventListener('click', function() {
        restart();
        graph.removeMeshes(scene);
        graph.fromjson();
        graph.applyLayout(layoutIterations, layoutScale, layoutGravity);
        graph.update();
        graph.initMeshes(scene);
    });

    document.getElementById('json-kk').addEventListener('click', function() {
        restart();
        graph.removeMeshes(scene);
        graph.fromjson();
        graph.applyKKLayout(0.1, 0.1);
        graph.update();
        graph.initMeshes(scene);
    });
        
    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
}

function restart(){
    INTERSECTED = null;
    SELECTED = null;
    $('.dock-window').fadeOut(300);
}

function onWindowResize() {

    var width = window.innerWidth-20;
    var height = window.innerHeight-50;
    var aspectRatio = width / height;
    camera.left = -aspectRatio * viewSize / 2;
    camera.right = aspectRatio * viewSize / 2;
    camera.top = viewSize / 2;
    camera.bottom = -viewSize / 2;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );

}

function openWindow(intersected) {
    var degree;
    graph.vertices.forEach(function(v){
        if (v.mesh == intersected){
            degree = v.degree;
        }
    });
    var name = intersected.name;
    var coords = intersected.coords;
    var interm = String(name);
    var names = interm.split("|");
    console.log(coords)
    $('.dock-window').fadeIn(300);
    if (names.length == 1){ //Simple node, ADD anomaly degree
        $('.dock-window').html('<div class="close"><img src="./close-icon.png"></div><div class="header"> ID:'+names+'</div> </div><div class="error"><b>Connections:</b>' + degree + '</div> <a target="_blank" rel="noopener noreferrer" href="http://35.225.0.218:3000/?orgId=1">Dashboard</a>')
    }
    if (names.length == 2){ //Vertex of random model
        $('.dock-window').html('<div class="close"><img src="./close-icon.png"></div><div class="header"> Connection </div><div class="error"><b>Source:</b>' + names[0] + '</div> <div class="error"><b>Destination:</b>' + names[1] + '</div><a target="_blank" rel="noopener noreferrer" href="http://35.225.0.218:3000/?orgId=1">Dashboard</a>')
    }
    if (names.length > 2){ //Vertex of model containing all data, ADD anomaly level, nbr of packets, length of communication
        $('.dock-window').html('<div class="close"><img src="./close-icon.png"></div><div class="header"> Connection </div><div class="error"><b>Source:</b>' + names[0] + '</div> <div class="error"><b>Destination:</b>' + names[1] + '</div><div class="error"><b>Protocol:</b>' + names[2] + '</div><div class="error"><b>Bytes Sent:</b>' + names[3] + '</div><a target="_blank" rel="noopener noreferrer" href="http://35.225.0.218:3000/?orgId=1">Dashboard</a>')
    }
    //lock.position.x = coords.x;
    //lock.position.z = coords.z;
    //$('.dock-window').css('left',event.clientX);
    //$('.dock-window').css('top',event.clientY - 50);
}

function onDocumentMouseDown(e) {
    var intt = 0;
    if ( INTERSECTED ) {
        if (SELECTED){
            SELECTED.material.color.setHex( SELECTED.currentHex );
            if (INTERSECTED == SELECTED){
                e.stopPropagation();
                $('.dock-window').fadeOut(300);
                SELECTED = null;
                INTERSECTED = null;
                intt = 1;
            }
        }
        if (intt == 0){
            SELECTED = INTERSECTED;
            console.log('mouse pressed', INTERSECTED.name, );
            openWindow(INTERSECTED);
            //window.open(INTERSECTED.object.userData.URL);
        }
    }
}

function onDocumentMouseMove(event) {
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    event.preventDefault();

    //Get coordinates of div
    var element = document.getElementById('main');
    var position = element.getBoundingClientRect();
    var left = position.left;
    var top = position.top;
    
    mouse.x = ((event.clientX-left) / width) * 2 - 1;
    mouse.y = -((event.clientY-top) / height) * 2 + 1;
}

function render() {
    raycaster.setFromCamera( mouse, camera );
    camera.updateMatrixWorld();

    const intersects = raycaster.intersectObjects(scene.children);

    if ( intersects.length > 0 ) {
        //console.log('intersects', intersects[0].object.name, );

        //if (graph.interactions.includes(intersects[0])){
            //window.open(intersects[0].object.userData.URL);
            //console.log(intersects[0].object.userData.URL);
            if ( INTERSECTED != intersects[ 0 ].object && SELECTED != intersects[0].object) {

                if (INTERSECTED && INTERSECTED != SELECTED) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

                INTERSECTED = intersects[ 0 ].object;
                INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
                INTERSECTED.material.color.setHex( 0xffffff );
                $('html,body').css('cursor', 'pointer');
                
            }
            if (INTERSECTED != intersects[0].object && SELECTED == intersects[0].object){
                INTERSECTED = SELECTED;
                $('html,body').css('cursor', 'pointer');
            }
        //}   

    } else {
        if ( INTERSECTED != SELECTED && INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
        INTERSECTED = null;
        $('html,body').css('cursor', 'default');
    }

    renderer.render( scene, camera );
}

$('body').on('click', '.close', function(event) {
    event.stopPropagation();

    $('.dock-window').fadeOut(300);
    SELECTED.material.color.setHex( SELECTED.currentHex );
    SELECTED = null;
    INTERSECTED = null;
});
