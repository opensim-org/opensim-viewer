import { Object3D, Scene } from "three"; 


export class TargetListModel {
    targets: Object3D[];
    constructor(scene: Scene)
    {
        // traverse the scene and add objects add objects of opensimType:body or model
        this.targets = [];
        this.collectTargets(scene);
        
    }

    public removeModel(model_uuid: string){
        // const modelsNode = this.rootNode!.children.find(node => node.name === "Models");
        // const modelToRemoveIndex = modelsNode!.children.findIndex(node=>node.threeObject!==null && node.threeObject.uuid===model_uuid);
        // modelsNode?.children.splice(modelToRemoveIndex, 1);
    }

    addModel(modelObj: Object3D) {
        // const modelsNode = this.rootNode!.children.find(node => node.name === "Models");
        // const modelSubtree = new TreeNode(modelsNode!, modelObj, true)
    }
    collectTargets(object: Object3D) {
        object.traverse((o) => {
            const children = o.children
            for (let i=0; i<children.length; i++){
                if (this.validateTarget(children[i]))
                    this.targets.push(o.children[i])
            }
        }
        );
    }
    validateTarget(object: Object3D): boolean {
        return (object.name==='WCS') ||
            (object.userData!== null && 
                (object.userData.opensimType === "Ground"|| 
                 object.userData.opensimType==="Frame" ||
                 object.userData.opensimType==="Model"))

    }
    getTargets() {
        return this.targets;
    }
}

export default TargetListModel;

