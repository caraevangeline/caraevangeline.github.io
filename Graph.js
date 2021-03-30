'use strict';
/* globals THREE, shuffleArray */

function Graph(minX, maxX, minY, maxY, minZ, maxZ) {
    this.vertices = [];
    this.edges = [];
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    this.minZ = minZ;
    this.maxZ = maxZ;
}

/**
 * Add an edge to the graph from source to vertex. The function will add vertices to
 * the graph such that from > to. Calls to invalid vertex id's are ignored silently.
 *
 * @param source
 * @param target
 */
Graph.prototype.addEdge = function(source, target, bytes = 1, name = "", vertices = []) {
    var newEdge = new Edge(source, target, bytes, name, vertices);
    this.edges.push(newEdge);
    //console.log(newEdge.source.pos);
    //console.log(newEdge.target.pos);
    newEdge.source.degree++;
    newEdge.target.degree++;
};

/**
 * Apply the Frucherman-Reingold algorith to the graph using the given
 * parameters.
 *
 * @param iter
 * @param scale
 * @param gravity
 */
Graph.prototype.applyLayout = function(iter, scale, gravity) {
    var width = (this.maxX - this.minX);
    var height = (this.maxY - this.minY);
    var depth = (this.maxZ - this.minZ);

    var area = scale * this.vertices.length * this.vertices.length;
    var k = Math.pow(area / this.vertices.length + 1, 1 / 3);

    function fAttr(x) {
        return (x * x) / k;
    }

    function fRepl(x) {
        return (k * k) /x ;
    }

    var t = Math.sqrt(this.vertices.length);
    var dt = t / (iter + 1);
    var eps = 0.05;

    for(var i = 0; i < iter; i++) {
        // calculate repulsive forces
        this.vertices.forEach(function(v) {
            v.disp = new THREE.Vector3();
            this.vertices.forEach(function(u) {
                if(u.id != v.id) {
                    var delta = new THREE.Vector3().subVectors(v.pos, u.pos);
                    var deltaMag = Math.max(eps, delta.length());

                    v.disp.x += (delta.x / deltaMag) * fRepl(deltaMag);
                    v.disp.y += (delta.y / deltaMag) * fRepl(deltaMag);
                    v.disp.z += (delta.z / deltaMag) * fRepl(deltaMag);
                }
            });
        }.bind(this));

        // calculate attractive forces
        this.edges.forEach(function(e, i) {
            var delta = new THREE.Vector3().subVectors(e.source.pos, e.target.pos);
            var deltaMag = Math.max(eps, delta.length());

            e.source.disp.x -= (delta.x / deltaMag) * fAttr(deltaMag);
            e.source.disp.y -= (delta.y / deltaMag) * fAttr(deltaMag);
            e.source.disp.z -= (delta.z / deltaMag) * fAttr(deltaMag);
            e.target.disp.x += (delta.x / deltaMag) * fAttr(deltaMag);
            e.target.disp.y += (delta.y / deltaMag) * fAttr(deltaMag);
            e.target.disp.z += (delta.z / deltaMag) * fAttr(deltaMag);
        }.bind(this));

        // apply gravitational forces
        this.vertices.forEach(function(v, i) {

            // three.js co-ordinate space is the center, so we
            // just need the regular magnitude for each vertices position
            var deltaMag = Math.max(eps, v.pos.length());
            var gravityForce = 0.1 * k * gravity * deltaMag;

            v.disp.x -= (v.pos.x / deltaMag) * gravityForce;
            v.disp.y -= (v.pos.y / deltaMag) * gravityForce;
            v.disp.z -= (v.pos.z / deltaMag) * gravityForce;
        });

        this.vertices.forEach(function(v) {
            // limit displacement to temperature t
            var dispMag = v.disp.length();
            v.pos.x += (v.disp.x / dispMag) * Math.min(Math.abs(v.disp.x), t);
            v.pos.y += (v.disp.y / dispMag) * Math.min(Math.abs(v.disp.y), t);
            v.pos.z += (v.disp.z / dispMag) * Math.min(Math.abs(v.disp.z), t);

            // keep vertices within the world space
            v.pos.x = clamp(v.pos.x, this.minX + width / 10, this.maxX - width / 10);
            v.pos.y = clamp(v.pos.y, this.minY + height / 10, this.maxY - height / 10);
            v.pos.z = clamp(v.pos.z, this.minZ + depth / 10, this.maxZ - depth / 10);

        }.bind(this));

    	t -= dt;
    }
};

/**
 * Apply the Kamada-Kawai algorith to the graph using the given
 * parameters.
 *
 * @param kappa
 * @param descent_rate
 */
Graph.prototype.applyKKLayout = function(kappa, descent_rate) {
    var width = (this.maxX - this.minX);
    var height = (this.maxY - this.minY);
    var depth = (this.maxZ - this.minZ);
    var n = this.vertices.length;
    var vertices = this.vertices;
    var epsilon = 1;
    var iter = 3*n;

    //Create an array logging what is connected to what
    var linkedByIndex = new Array(n);
    for (var k = 0; k<n; k++){
      linkedByIndex[k] = new Array(n);
      linkedByIndex[k].fill(0);
    }
    for (var i = 0; i < n; i++) {
      linkedByIndex[i][i] = 1;
    };
    this.edges.forEach(function (d) {
      linkedByIndex[vertices.indexOf(d.source)][vertices.indexOf(d.target)] = 1;
      linkedByIndex[vertices.indexOf(d.target)][vertices.indexOf(d.source)] = 1;
    });

    //The Matrix of Graphtheoretical Connection Lengths
    var ConnectionMatrix = linkedByIndex;
    var ConnectionMatrix_new = {};
    var steps = 2;
    while (ConnectionMatrix_new != ConnectionMatrix){
      ConnectionMatrix_new = ConnectionMatrix;
      for (var i = 0; i < n; i++){
        for (var j = 0; j< n; j++){
          if (ConnectionMatrix[i][j]==0){
            var indirect = 0;
            for (var kek = 0; kek < n; kek++){
              indirect = indirect + (linkedByIndex[kek][j])*(ConnectionMatrix[i][kek]);
            }
            if (indirect != 0){
              ConnectionMatrix[i][j] = steps;
            }
          }
        }
      }
      steps += 1;
    }

    //The Matrix of Euclidian Connection lengths
    var l_matrix = new Array(n);
    for (var k = 0; k<n; k++){
      l_matrix[k] = new Array(n);
      l_matrix[k].fill(0);
    }
    for (var i = 0; i < n; i++){
      for (var j = 0; j < n; j++){
        if (ConnectionMatrix[i][j] == 0){
            l_matrix[i][j] = 150*(steps + 1)/Math.pow(n, 1/3);
        }
        else{
            l_matrix[i][j] = 150*ConnectionMatrix[i][j]/Math.pow(n, 1/3);
        }
      }
    }

    //The Matrix of Spring Coefficients
    var coefficientMatrix = new Array(n);
    for (var k = 0; k<n; k++){
      coefficientMatrix[k] = new Array(n);
      coefficientMatrix[k].fill(kappa/n);
    }
    for (var i = 0; i < n; i++){
        for (var j = 0; j< n; j++){
            if (ConnectionMatrix[i][j] !=0){
                coefficientMatrix[i][j] = kappa/Math.pow(ConnectionMatrix[i][j], 1/3);
                //(Math.log(ConnectionMatrix[i][j])+1);
            }
        }
    }

    //for (var i = 0; i<n; i++){
    //    document.writeln();
    //    for (var j = 0; j<n; j++){
    //        document.write(coefficientMatrix[i][j]);
    //    }
    //}

    //First Derivative of the Energy Function wrt x
    function derx(a){
        var val = 0;
        var i_a = vertices.indexOf(a);
        vertices.forEach(function (b){
            var vect = new THREE.Vector3().subVectors(a.pos, b.pos);
            if (vect.length()!=0){
                var i_b = vertices.indexOf(b);
                val += coefficientMatrix[i_a][i_b]*(vect.x - l_matrix[i_a][i_b]*vect.x/vect.length());
            }
        });
        return val;
    }

    //First Derivative of the Energy Function wrt y
    function dery(a){
        var val = 0;
        var i_a = vertices.indexOf(a);
        vertices.forEach(function (b){
            var vect = new THREE.Vector3().subVectors(a.pos, b.pos);
            if (vect.length()!=0){
                var i_b = vertices.indexOf(b);
                val += coefficientMatrix[i_a][i_b]*(vect.y - l_matrix[i_a][i_b]*vect.y/vect.length());
            }
        });
        return val;
    }

    //First Derivative of the Energy Function wrt z
    function derz(a){
        var val = 0;
        var i_a = vertices.indexOf(a);
        vertices.forEach(function (b){
            var vect = new THREE.Vector3().subVectors(a.pos, b.pos);
            if (vect.length()!=0){
                var i_b = vertices.indexOf(b);
                val += coefficientMatrix[i_a][i_b]*(vect.z - l_matrix[i_a][i_b]*vect.z/vect.length());
            }
        });
        return val;
    }

    //Euclidian Length of the Dirst Derivative
    function delta(a){
        var vectgrad = new THREE.Vector3(derx(a), dery(a), derz(a));
        return vectgrad.length();
    }

    for (var it1 = 0; it1 < iter; it1++){
        //Determining the Vertex with the Largest Derivative
        var max_v = 0;
        var max_der_val = 0;
        for (var k = 0; k < n; k++){
            var a_delta = delta(this.vertices[k]);
            if (a_delta > max_der_val){
                max_v = k;
                max_der_val = a_delta;
            }
        }
        var it2 = 0;
        while (delta(this.vertices[max_v]) > epsilon && it2 < iter){
            var vect1 = new THREE.Vector3(derx(this.vertices[max_v]), dery(this.vertices[max_v]), derz(this.vertices[max_v]));
            var vect2 = vect1.multiplyScalar(-descent_rate);
            this.vertices[max_v].pos.add(vect2);
            vertices = this.vertices;
            it2 += 1;
        }
    }

    // keep vertices within the world space
    this.vertices.forEach(function(v) {
        v.pos.x = clamp(v.pos.x, this.minX + width / n, this.maxX - width / n);
        v.pos.y = clamp(v.pos.y, this.minY + height / n, this.maxY - height / n);
        v.pos.z = clamp(v.pos.z, this.minZ + depth / n, this.maxZ - depth / n);
    }.bind(this));
};

/**
 * Clear the current graph and generate a Erdos-Renyi graph
 * with n vertices and m edges.
 *
 * @param n
 * @param m
 */
Graph.prototype.initRandomGraph = function(n, m) {
    var i;

    this.vertices = [];
    this.edges = [];
    var x = [{
   "IP": "150.190.173.182"
 },
 {
   "IP": "150.190.173.183"
 },
 {
   "IP": "150.190.173.184"
 }
];
    // add nodes to graph
    for(i = 0; i < 3; i++) {
        var newPos = new THREE.Vector3(
            this._getCenterValue(this.minX, this.maxX),
            this._getCenterValue(this.minY, this.maxY),
            this._getCenterValue(this.minZ, this.maxZ));
        var newVertex = new Vertex(x[i].IP, newPos);
        this.vertices.push(newVertex);
    }

    // create a list of every possible edge, randomise this
    // and choose the first m... inefficient but simple way
    // to generate a random fixed number of edges
    var allEdges = [];
    for(i = 0; i < 3; i++) {
        for(var j = i + 1; j < 3; j++) {
            allEdges.push([i, j]);
        }
    }

    // select the first m edges as our edges, add them.
    allEdges = shuffleArray(allEdges);
    allEdges = allEdges.splice(0, 4);
    allEdges.forEach(function(e) {
        this.addEdge(this.vertices[e[0]], this.vertices[e[1]]);
    }.bind(this));
};

/**
 * Clear the current graph and generate a random graph with community structure.
 *
 * @param n
 * @param numberGroups
 * @param withinP
 * @param betweenP
 */
Graph.prototype.initCommunityGraph = function(n, numberGroups, withinP, betweenP) {
    this.vertices = [];
    this.edges = [];
    var i, j;

    // create set of vertices and assign them to random communities
    for(i = 0; i < n; i++) {
        var newPos = new THREE.Vector3(
            this._getCenterValue(this.minX, this.maxX),
            this._getCenterValue(this.minY, this.maxY),
            this._getCenterValue(this.minZ, this.maxZ));
        var newVertex = new Vertex(i, newPos);
        newVertex.community = randInt(0, numberGroups);
        this.vertices.push(newVertex);
    }

    // create edges between vertices using given probabilities
    var source, target, rand;
    for(i = 0; i < n; i++) {
        for(j = i + 1; j < n; j++) {
            source = this.vertices[i];
            target = this.vertices[j];
            rand = Math.random();

            if(source.community == target.community) {
                if(rand < withinP) this.addEdge(source, target);
            }
            else {
                if(rand < betweenP) this.addEdge(source, target);
            }
        }
    }
};

/**
 * Generate a graph with a power-law degree distribution
 * using the Barabási–Albert model.
 *
 * See: https://en.wikipedia.org/wiki/Barab%C3%A1si%E2%80%93Albert_model
 *
 * @param n
 */
Graph.prototype.initPowerLawGraph = function(n) {
    this.vertices = [];
    this.edges = [];
    var i, newVertex, newPos;

    // create set of vertices and assign them to random communities
    for(i = 0; i < 4; i++) {
        newPos = new THREE.Vector3(
            this._getCenterValue(this.minX, this.maxX),
            this._getCenterValue(this.minY, this.maxY),
            this._getCenterValue(this.minZ, this.maxZ));
        newVertex = new Vertex(i, newPos);
        this.vertices.push(newVertex);
    }

    this.addEdge(this.vertices[0], this.vertices[1]);
    this.addEdge(this.vertices[0], this.vertices[2]);
    this.addEdge(this.vertices[0], this.vertices[3]);

    // add the remaining edges using the preferential attachment model
    for(i = 4; i < n; i++) {
        var targetID = this._getPAVertex();
        newPos = new THREE.Vector3(
            this._getCenterValue(this.minX, this.maxX),
            this._getCenterValue(this.minY, this.maxY),
            this._getCenterValue(this.minZ, this.maxZ));
        newVertex = new Vertex(i, newPos);
        this.vertices.push(newVertex);
        this.addEdge(newVertex, this.vertices[targetID]);
    }
};

/**
 * Add all the meshes belonging to this graph from the given THREE.js scene.
 *
 * @param scene
 */
Graph.prototype.initMeshes = function(scene) {
    this.edges.forEach(function(e) {
        scene.add(e.mesh);
    }.bind(this));

    this.vertices.forEach(function(v) {
        scene.add(v.mesh);
    }.bind(this));
};

/**
 * Remove all the meshes belonging to this graph from the given THREE.js scene.
 *
 * @param scene
 */
Graph.prototype.removeMeshes = function(scene) {
    this.edges.forEach(function(e) {
        scene.remove(e.mesh);
    });
    
    this.vertices.forEach(function(v) {
        scene.remove(v.mesh);
    });
};

/**
 * Update position of all graph meshes.
 *
 */
Graph.prototype.update = function() {
    //var arr = [];
    this.vertices.forEach(function(v) {
        v.update();
        //arr.push(v.mesh);
    });

    this.edges.forEach(function(e) {
        e.update();
    });
    //this.interactions = arr;
};

/**
 * Generates a random starting position. This is the midpoint of the supplied min and max
 * value, perturbed by 10% of the range of the values.
 *
 * @private
 */
Graph.prototype._getCenterValue = function(min, max) {
    var sign = Math.random() > 0.5 ? -1 : 1;
    var range = max - min;
    var mid = (max + min) / 2;
    return mid + Math.random() * sign * range / 10;
};

/**
 * This method is used for selecting which vertex should received an edge from
 * a newly added edge generating a graph with a preferential attachment model.
 *
 * A vertex is randomly selected based on it's degree value.
 *
 * @private
 */
Graph.prototype._getPAVertex = function() {
    // get the total number of degrees for the full set of vertices
    var totalDegree = this.vertices.reduce(function(pre, cur) {
        return pre + cur.degree;
    }, 0);

    // update the attachment probability for every vertex
    this.vertices.forEach(function(v) {
        v.prob = v.degree / totalDegree;
    });

    // sort the vertices ascending by their attachment probabilities
    // copy the array so the original array isn't mutated
    var sorted = this.vertices.slice(0);
    sorted.sort(function(a, b) {
        return a.prob - b.prob;
    });

    // randomly choose a vertex based on the cumulative distribution
    // we've just created!
    var rand = Math.random();
    var cumulativeProb = 0;
    for(var i = 0; i < sorted.length; i++) {
        cumulativeProb += sorted[i].prob;
        if (rand < cumulativeProb) {
            return i;
        }
    }
};

/**
 * This methid is used to create vertices and nodes from a json file
 */
Graph.prototype.fromjson = function(){
    var theUrl = "http://34.70.53.33/visualization/nodes.json";
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    var resp = xmlHttp.responseText;
    var vertices = JSON.parse(resp);

    var theUrl = "http://34.70.53.33/visualization/ip_address.json";
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    var resp = xmlHttp.responseText;
    var edges = JSON.parse(resp);

    var n = vertices.length;
    var m = edges.length;
    this.vertices = [];
    this.edges = [];

    // add nodes to graph
    for(var i = 0; i < n; i++) {
        var newPos = new THREE.Vector3(
            this._getCenterValue(this.minX, this.maxX),
            this._getCenterValue(this.minY, this.maxY),
            this._getCenterValue(this.minZ, this.maxZ));
        var newVertex = new Vertex(vertices[i].IP, newPos);
        this.vertices.push(newVertex);
    }

    // add links to graph
    for (var j = 0; j<m; j++){
        if (edges[j]. Source != ""){
            var name = edges[j].Source + "|" + edges[j].Destination + "|" + edges[j].Protocol + "|" + edges[j].Bytes;
            this.addEdge(edges[j].Source, edges[j].Destination, edges[j].Bytes, name, this.vertices);
        }
    }
};