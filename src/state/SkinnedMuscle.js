
/**
 * @author Ayman Habib
 */
import { SkinnedMesh, Bone, Skeleton, Vector3, Matrix4 } from "three";
import * as THREE from 'three';

class SkinnedMuscle extends SkinnedMesh {
    constructor( geometry, material, points, actives ) {
        super( geometry, material );
        this.pathpoints = points;
        this.pathpointObjects = [];
        this.actives = actives;
        this.bones = [];
        this.firstPointMaterial = undefined;
        // When off only caps are shown, when on, user defined points are shown (for editing/picking)
        this.showInnerPathPoints = false;

        for (let ij=0; ij< 2*points.length-2; ij++) {
            let bone = new Bone();
            bone.position.set(0, 0, 0);
            bone.quaternion.set(0, 0, 0, 1);
            bone.ppt = this.pathpoints[Math.floor(ij/2)];
            this.bones.push(bone);
        }

        const numVerticesPerLevel = geometry.attributes.position.count / (2*points.length-2);
        const position = geometry.attributes.position;
        this.skinIndices = [];
        this.skinWeights = [];
        for ( let ii = 0; ii < position.count; ii++ ) {
            const skinIndex = Math.floor(ii / numVerticesPerLevel);
            //var pptIndex = Math.floor((skinIndex+1)/2);
            //var activePoint = this.actives[pptIndex];
            this.skinIndices.push(skinIndex, 0, 0, 0);
            // Will always use weight of 1, 0, 0, 0 to interpolate pathpoints
            // Changing weights will make the paths smooth but doesn't interpolate points'
            this.skinWeights.push(1.0, 0.0, 0.0, 0.0 );
        }
        //geom.dynamic = true;
        geometry.setAttribute( 'skinIndex', new THREE.Uint16BufferAttribute( this.skinIndices, 4 ) );
        geometry.setAttribute( 'skinWeight', new THREE.Float32BufferAttribute( this.skinWeights, 4 ) );
        super.normalizeSkinWeights();
        material.skinning = true;
        //SkinnedMesh.call( this, geometry, material );
        this.skeleton = new Skeleton( this.bones );
        for (let j = 0; j < this.bones.length; j++)
            this.add( this.skeleton.bones[ j ]);
        //this.add( skeleton.bones[ 0 ]);
        super.bind( this.skeleton );
        this.frustumCulled = false;
        // this.userData = 'NonEditable';
        

	}

    setColor(newColor) {
        this.material.color.setHex(newColor).convertSRGBToLinear();
        if (this.firstPointMaterial !== undefined)
            this.firstPointMaterial.color.setHex(newColor).convertSRGBToLinear();
    }

    updateMatrixWorld( force ) {
        // if has pathpoints attribute then it's a muscle
        // Cycle through pathpoints, update their matrixworld
        // then set the position of the Bones from that
        if (this.skeleton === undefined)
            return;
        //const bones = this.skeleton.bones;
        //console.warn("Num bones in updateMatrixWorld: " + bones.length);
        if (this.parent === null)
            return;
        //super.updateMatrixWorld(force);
        let scene = this.parent.parent.parent;
        if (this.pathpointObjects.length !== this.pathpoints.length){
            let b = 0;
            for ( let p=0; p < this.pathpoints.length; p++) {
                const pptObject1 = scene.getObjectByProperty('uuid',this.pathpoints[p]);
                if (this.firstPointMaterial === undefined && pptObject1 !== undefined && p === 0)
                    this.firstPointMaterial = pptObject1.material;
                const pptObject2 = scene.getObjectByProperty('uuid', this.pathpoints[p+1]);

                if (pptObject1 !== undefined) {
                // add every pathpoint to the list of PathPoint objects
                    this.pathpointObjects.push(pptObject1);

                    if (pptObject2 !== undefined) {
                    // define the two bones of a segement of the path together
                        this.bones[b].geometry = pptObject1.geometry;
                        this.bones[++b].geometry = pptObject2.geometry;
                    }
                    b++;
                }
            }
        }
        // Compute reverse transform from Ground to Scene (usually this's inverse translation)
        // This is necessary since the blending to compute vertices adds offset twice
        if (this.parent === null) return; // construction
        const mat = new Matrix4().copy(this.parent.matrixWorld).invert();
        const vec = new Vector3().setFromMatrixPosition(mat);

        // Variables for the two points of a given path segment, the axis to
        // be rotated (from) and the vector between them (to)
        const pt1 = new Vector3();
        const pt2 = new Vector3();
        const vFrom = new Vector3(0, -1, 0);

        // cycle through each segement defined by two PathPoints, pt1 and pt2
        // and align the bones (caps of each segment) to be alinged with
        // the vector connecting them.
        let nb = 0; // bone (of SkinnedMuscle) index
        for (let px = 0; px < this.pathpoints.length-1; px++) {
            const thisPathpointObject = this.pathpointObjects[px];
            const nextPathpointObject = this.pathpointObjects[px+1];
            //console.log("pathpoints in world", thisPathpointObject.matrixWorld, nextPathpointObject.matrixWorld);
            if(thisPathpointObject !== undefined) {
                pt1.setFromMatrixPosition(thisPathpointObject.matrixWorld);
                pt2.setFromMatrixPosition(nextPathpointObject.matrixWorld);

                const vTo = pt2.clone();
                vTo.sub(pt1).normalize();

                // bones are positioned on the pathpoints
                this.bones[nb].position.setFromMatrixPosition(thisPathpointObject.matrixWorld);
                this.bones[nb].position.add(vec);
                // console.log("boneb in world", bones[b].position);
                // the orientation of the bone is updated to have its Y-axis pointed
                // back along the vector from pt1 to pt2
                this.bones[nb].quaternion.setFromUnitVectors(vFrom, vTo);
                this.bones[nb].updateMatrixWorld(true);
                nb++;
                this.bones[nb].position.setFromMatrixPosition(nextPathpointObject.matrixWorld);
                // the orientation of the bone is updated to have its Y-axis pointed
                // back along the vector from pt1 to pt2
                this.bones[nb].position.add(vec);
                // console.log("boneb+1 in world", bones[b].position);
                this.bones[nb].quaternion.setFromUnitVectors(vFrom, vTo);
                this.bones[nb].updateMatrixWorld(true);
                nb++;
            }
        }
        //this.skeleton.update();
        super.updateMatrixWorld(true );
    }

    setVisible( newValue) {
        this.visible = newValue;
        // Now repeat for the inner pathpoints under this muscle
        for (let p = 0; p < this.pathpoints.length; p++) {
            if (this.pathpointObjects[p].opensimType!=="ComputedPathPoint")
                this.pathpointObjects[p].visible = newValue;
        }
    }

    togglePathPoints(newValue) {
        for (let p = 0; p < this.pathpoints.length; p++) {
            if (this.actives[p])
                this.pathpointObjects[p].visible = newValue;
        }
        
    }
    
}

export {SkinnedMuscle} 
