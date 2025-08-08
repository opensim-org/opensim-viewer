import * as THREE from 'three';

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
  return "unknown";
}

function getValidChildren(obj: THREE.Object3D, traverse: any) {
  return obj.children
    .filter(child => child.type.includes("Camera") || child.type.includes("Light") || child.type.includes("Object3D"))
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
      (!obj.type.includes("TransformControls") &&
      !obj.type.includes("Helper")) &&
      !(obj.type === "Group" && obj.name === "" && obj.children.length === 0);

    if (!shouldProcess) return null;

    const isGroup = obj.type === "Group";
    const isModel = title === "Model";

    if (obj.children?.length > 0) {
      if (isGroup) {
        if (!isModel) {
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
