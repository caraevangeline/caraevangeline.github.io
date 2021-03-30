'use strict';
/* globals THREE */

function Edge(source, target, bytes, name, vertices) {
    //var edgeMaterial = new THREE.LineBasicMaterial({color: 0x686765});
    var edgeGeometry = new THREE.Geometry();
    const points = [];
    if (name == ""){
        var edgeMaterial = new THREE.LineBasicMaterial({color: 0x00ff00});
        //const edgeMaterial = new MeshLineMaterial({color: 0x00ff00, linewidth: (1 + bytes/10000)});
        this.source = source;
        this.target = target;
        //points.push(this.source.x, this.source.y, this.source.z);
        //points.push(this.target.x, this.target.y, this.target.z);
        edgeGeometry.vertices.push(new THREE.Vector3().copy(this.source.pos));
        edgeGeometry.vertices.push(new THREE.Vector3().copy(this.target.pos));
        //const line = new MeshLine();
        //line.setPoints(edgeGeometry.vertices);
        //this.mesh = new THREE.Mesh(line, edgeMaterial);
        this.mesh = new THREE.Line(edgeGeometry, edgeMaterial);
        this.mesh.name = this.source.mesh.name + "|" + this.target.mesh.name;
    }
    else{
        var edgeMaterial = new THREE.LineBasicMaterial({color: 0x00ff00, transparent: true, opacity: (bytes+20000)/120000, linewidth: (1 + bytes/100000)});
        //const edgeMaterial = new MeshLineMaterial({color: 0x00ff00, lineWidth: (1 + bytes/10000)});
        var ind1 = 0;
        var ind2 = 0;
        var src;
        var tgt;
        vertices.forEach(function(v){
            if (ind1 == 0 && v.id == source){
                src = v;
                ind1 += 1;
            }
            if (ind2 == 0 && v.id == target){
                tgt = v;
                ind2 += 1;
            }
        });
        this.source = src;
        this.target = tgt;
        //points.push(this.source.x, this.source.y, this.source.z);
        //points.push(this.target.x, this.target.y, this.target.z);
        edgeGeometry.vertices.push(new THREE.Vector3().copy(this.source.pos));
        edgeGeometry.vertices.push(new THREE.Vector3().copy(this.target.pos));
        //const line = new MeshLine();
        //line.setPoints(edgeGeometry.vertices);
        //this.mesh = new THREE.Mesh(line, edgeMaterial);
        this.mesh = new THREE.Line(edgeGeometry, edgeMaterial);
        this.mesh.name = name;
        //this.mesh.raycast = MeshLineRaycast;
    }
}

/**
 * Update edge mesh with its vertices current positions.
 */
Edge.prototype.update = function() {
    this.mesh.geometry.vertices[0].copy(this.source.pos);
    this.mesh.geometry.vertices[1].copy(this.target.pos);
};
