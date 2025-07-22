import { Object3D, Group, Scene } from "three"; 

export class TreeNode 
{
  public parent: TreeNode|null; 
  public children: TreeNode[] = [];
  public name: string;
  public id: string;
  public threeObject: Object3D|null;
  static maxId=0
  constructor(parent: TreeNode|null, threeObj: Object3D|null, recur: boolean) 
  {
    this.parent = parent; 
    this.name=(threeObj===null)?"":(threeObj.name!==""?threeObj.name:threeObj.type);
    this.threeObject = threeObj;
    this.id = `${TreeNode.maxId}`;
    TreeNode.maxId = TreeNode.maxId+1;

    if (recur && threeObj !== null && !(threeObj.name==="WCS")){
      // construct 
      this.addChildrenNodes(threeObj, recur);
    }
  }
  private addChildrenNodes(threeObj: Object3D, recur: boolean) {
    for (let i = 0; i < threeObj.children.length; i++) {
      // Skip over helpers
      if (!this.excludeFromSceneTree(threeObj, i)) {
        const nextChildNode = new TreeNode(this, threeObj.children[i], recur);
        this.children.push(nextChildNode);
        //console.log("adding node for ", threeObj.children[i].name, " to parent node");
      }
    }
  }

  private excludeFromSceneTree(threeObj: Object3D, i: number) {
    return (threeObj.children[i].type.includes('Helper') ||
            (threeObj.userData!== undefined && threeObj.userData.opensimType==="Model"));
  }

  setName(newName: string){
    this.name = newName;
  }
}

class SceneTreeModel
{
    public rootNode: TreeNode|null;
    constructor(sceneTreeGroup: Group | Scene)
    {
        this.rootNode = new TreeNode(null, sceneTreeGroup, false);
        this.rootNode.setName(sceneTreeGroup.name)
        // Create Meshes node
        let meshesNode = new TreeNode(this.rootNode, null, false);
        meshesNode.setName('Meshes')
        sceneTreeGroup.traverse((obj) =>{
            if (obj.type==='Mesh'){
                let childNode = new TreeNode(meshesNode, obj, false);
                if (obj.userData !== null && obj.userData.path !== undefined){
                  let pathArr = obj.userData.path.split('/')
                  // Mesh is implicit in name, save screen real-state
                  childNode.name = (obj.userData.opensimType==="Mesh")?pathArr[pathArr.length-1]:
                      obj.userData.opensimType+":"+pathArr[pathArr.length-1];
                }
                else {
                  if (obj.name !== null){
                    let pathComponentsArray = obj.name.split('\\');
                    childNode.name = pathComponentsArray[pathComponentsArray.length-1];
                  }
                  else
                    childNode.name = obj.name
                }
            }
        })

    }
}

export default SceneTreeModel;