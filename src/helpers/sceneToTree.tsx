import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

function determineNodeType(obj: THREE.Object3D): string {
  if (obj.name === "Scene") return "scene";
  if (obj.type === "Object3D" && obj.userData!==undefined && obj.userData.name!==undefined &&
          obj.userData.name.startsWith("Model")
   ) return "model";
  if (obj.type === "Object3D" && obj.userData!==undefined && obj.userData.name!==undefined &&
          (obj.userData.name === "Ground" || obj.userData.name.startsWith("Body:"))
   ) return "body";
  if (obj.type === "Group") return "group";
  if (obj.type.includes("Light")) return "light";
  if (obj.name.includes("SkySphere")) return "skySphere";
  if (obj.name.includes("Floor")) return "floor";
  if (obj.type.includes("Axes")) return "axes";
  if (obj.type.includes("Camera")) return "camera";
  if (obj.type === "Object3D" && obj.userData!==undefined && obj.userData.name!==undefined && obj.userData.name === "Model")
    return "model";
  if (isModelComponent(obj)) return "modelComponent";
  return "unknown";
}

// This function traverses an objects parents until it reaches an object called "Model", or null. If it reaches "Model"
// it returns true. False otherwise.
function isModelComponent(obj: THREE.Object3D) {
  let current = obj.parent;

  while (current !== null) {
    if (current.name === "Scene" ||
        (current.userData?.name && current.userData.name.startsWith("Scene"))) {
      return true;
    }
    current = current.parent;
  }

  return false;
}

function getValidChildren(obj: THREE.Object3D, traverse: any) {
  return obj.children
    .filter(child => (obj as TransformControls).isTransformControls || child.type.includes("Camera") ||
    child.type.includes("Light") || child.type.includes("Object3D") || child.name === "Floor" || child.name==="WCS" ||
    child.name.includes("SkySphere") || (child.type==="Group" && child.name !== "mt") ||
    child.userData.opensimType==="Ground" || child.userData.opensimType==="Frame")
    .map(traverse)
    .filter((child: any) => child !== null);
}

function getShortName(input: string) {
  if (input.includes("set")){
    const lastSlashIndex = input.lastIndexOf("set");
    return input.substring(lastSlashIndex + 3);
  }
  return input;
}
export function convertSceneToTree(scene: THREE.Scene | null) {
  const traverse = (obj: any): any | null => {
    const nodeType = determineNodeType(obj);
    const { id, uuid } = obj;
    let title =  getShortName(obj.name);
    let children = null;

    const shouldProcess =
      (!(obj as TransformControls).isTransformControls &&
      !obj.type.includes("Helper") &&
      !(obj.name ==="Com") &&
      !obj.type.includes("Skinned")) &&
      !(obj.type === "Group" && obj.name === "" && obj.children.length === 0);

    if (!shouldProcess) return null;

    const isGroup = obj.type === "Group";
    const isModel = title === "Model" || (obj.userData.opensimType!== undefined && obj.userData.opensimType=== "Model");

    if (obj.children?.length > 0) {
      if (isGroup) {
        if (!isModel) {
          if (obj.userData.opensimType=== "Frame") // don't recur on Frames
            children = []
          else
            children = obj.children.map(traverse).filter((child: any) => child !== null);
        } else {
          const validChildren = getValidChildren(obj, traverse);
          if (validChildren.length > 0) children = validChildren;
        }
      } else {
        const validChildren = getValidChildren(obj, traverse);
        if (validChildren.length > 0) children = validChildren;
      }
    }

    return {
      title,
      subtitle: obj.type,
      object3D: obj,
      nodeType,
      id,
      uuid,
      type: obj.type,
      children,
    };
  };

  if (!scene) return [];

  const tree = scene.children.map(traverse).filter((child: any) => child !== null);

  return tree;
}

// Given an existing tree and a scene with updated elements, update the tree.
function mergeTreeWithScene(oldTree: any[], scene: THREE.Scene | null) {
  const oldMap = new Map<string, any>();
  const collect = (nodes: any[]) => {
    nodes.forEach((n) => {
      oldMap.set(n.uuid, n);
      if (n.children) collect(n.children);
    });
  };
  collect(oldTree);

  const traverse = (obj: THREE.Object3D): any | null => {
    const nodeType = determineNodeType(obj);
    const { id, uuid } = obj;
    let title = obj.name === "Scene" ? "Model" : obj.name;

    const shouldProcess =
      (!(obj as TransformControls).isTransformControls &&
      !obj.type.includes("Helper") &&
      !(obj.name ==="Com") &&
      !obj.type.includes("Skinned")) &&
      !(obj.type === "Group" && obj.name === "" && obj.children.length === 0);

    if (!shouldProcess) return null;

    const validChildren = getValidChildren(obj, traverse);
    const oldNode = oldMap.get(uuid);

    if (oldNode) {
      // If a node from the scene already exists in the tree, just update it props.
      oldNode.title = title;
      oldNode.subtitle = obj.type;
      oldNode.nodeType = nodeType;
      oldNode.id = id;
      oldNode.type = obj.type;
      oldNode.object3D = obj;
      oldNode.children = validChildren.length > 0 ? validChildren : null;
      return oldNode;
    } else {
      // If a node in the scene does not exist in the tree, create it.
      return {
        title,
        subtitle: obj.type,
        object3D: obj,
        nodeType,
        id,
        uuid,
        type: obj.type,
        children: validChildren.length > 0 ? validChildren : null,
      };
    }
  };

  if (scene)
    return scene.children.map(traverse).filter(Boolean);
  else
    return []
}

export { mergeTreeWithScene };