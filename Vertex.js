'use strict';
/* globals THREE */

//var innerMaterial = new THREE.MeshPhongMaterial({ color: 0xB7B700, side: THREE.DoubleSide, transparent: true, opacity:1});
//var innerGeometry = new THREE.SphereGeometry(2, 16, 16);

function Vertex(id, pos) {
    var vertexGeometry = new THREE.SphereGeometry(2, 16, 16);
    //var vertexMaterial = new THREE.MeshLambertMaterial({color: 0xB7B7B7, transparent: true, opacity: 1});
    var vertexMaterial = new THREE.MeshLambertMaterial({color: 0x00ff00, transparent: true, opacity: 1});
    this.id = id;
    this.pos = pos;
    this.disp = new THREE.Vector3();
    this.community = 0;
    this.degree = 0;
    this.mesh = new THREE.Mesh(vertexGeometry, vertexMaterial);
    this.mesh.name = id;
    this.mesh.position.copy(this.pos);
    //var node = new THREE.Mesh(innerGeometry, innerMaterial);
    //this.mesh.add(node);
}

/**
 * Call this method to update the Vertex's mesh to its current
 * position co-ordinates.
 *
 */
Vertex.prototype.update = function() {
    this.mesh.position.copy(this.pos);
};

