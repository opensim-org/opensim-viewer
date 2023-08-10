import { Object3D, Group } from "three"; 

export class TreeNode 
{
  public parent: TreeNode|null; 
  public children: TreeNode[] = [];
  public name: string;
  public threeObject: Object3D|null;

  constructor(parent: TreeNode|null, threeObj: Object3D|null) 
  {
    this.parent = parent; 
    this.name='';
    this.threeObject = threeObj;
    if(this.parent) this.parent.children.push(this); 
  }
  setName(newName: string){
    this.name = newName;
  }
}

class SceneTreeModel
{
    public rootNode: TreeNode|null;
    constructor(sceneTreeGroup: Group)
    {
        this.rootNode = new TreeNode(null, sceneTreeGroup);
        this.rootNode.setName(sceneTreeGroup.name)
        // Create Meshes node
        let meshesNode = new TreeNode(this.rootNode, null);
        meshesNode.setName('Meshes')
        sceneTreeGroup.traverse((obj) =>{
            if (obj.type==='Mesh'){
                let childNode = new TreeNode(meshesNode, obj);
                let pathComponentsArray = obj.name.split('/');
                childNode.name = pathComponentsArray[pathComponentsArray.length-1];
            }
        })

    }
}

export default SceneTreeModel;