import { Object3D, Group, Scene } from "three"; 

import { TreeNode } from "./SceneTreeModel";


class SceneTreeModelGUI
{
    public rootNode: TreeNode|null;
    constructor(scene: Scene)
    {
        this.rootNode = new TreeNode(null, scene, true);
    }

    public removeModel(model_uuid: string){
        const modelsNode = this.rootNode!.children.find(node => node.name === "Models");
        const modelToRemoveIndex = modelsNode!.children.findIndex(node=>node.threeObject!==null && node.threeObject.uuid===model_uuid);
        modelsNode?.children.splice(modelToRemoveIndex, 1);
    }

    addModel(modelObj: Object3D) {
        const modelsNode = this.rootNode!.children.find(node => node.name === "Models");
        const modelSubtree = new TreeNode(modelsNode!, modelObj, true)
    }
}

export default SceneTreeModelGUI;