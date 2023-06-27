import { Group } from "three"; 

export class TreeNode 
{
  public parent: TreeNode|null; 
  public children: TreeNode[] = [];
  public name: string;
  constructor(parent: TreeNode|null) 
  {
    this.parent = parent; 
    this.name='';
    if(this.parent) this.parent.children.push(this); 
  }
  setName(newName: string){
    this.name = newName;
  }
}

export class SceneTreeModel
{ 
    public rootNode: TreeNode|null;
    constructor(sceneTreeGroup: Group)
    {
        this.rootNode = new TreeNode(null);
        this.rootNode.setName(sceneTreeGroup.name)
        for (var i = 0; i< sceneTreeGroup.children.length ; i++){
            let childNode = new TreeNode(this.rootNode);
            childNode.name = sceneTreeGroup.children[i].name;
        }
    }
}