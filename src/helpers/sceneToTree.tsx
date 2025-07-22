import * as THREE from 'three';

function determineNodeType(obj: THREE.Object3D): string {
  if (obj.name === "Scene") return "model";
  if (obj.type === "Group" && obj.name === "Cameras") return "group";
  if (obj.type === "Group" && obj.name === "Illumination") return "group";
  if (obj.type === "Group") return "group";
  if (obj.type.includes("Light")) return "light";
  if (obj.name.includes("SkySphere")) return "skySphere";
  if (obj.name.includes("Floor")) return "floor";
  if (obj.type.includes("Axes")) return "axes";
  if (obj.type.includes("Camera")) return "camera";
  return "unknown";
}

function createAddNodeButton(type: "Camera" | "Light") {
  return {
    title: "",
    subtitle: "",
    object3D: null,
    nodeType: `add${type}Button` as const,
    id: `add$-{type}-node` as const,
    type: "AddButton",
    children: [],
  };
}

export function convertSceneToTree(scene: THREE.Scene | null, camera: THREE.Camera | null) {
  const traverse = (obj: any): any | null => {
    const nodeType = determineNodeType(obj);

    let id = obj.id;
    let title = obj.name
    let uuid = obj.uuid

    if (obj.name === "Scene") {
      title = "Model";
    }

    let children = null;
    if (!obj.type.includes("TransformControls") && !obj.type.includes("Helper") && obj.type !== "Object3D") {

      if ((obj.type === "Group" && obj.children.length > 0) || (obj.type === "Group" && obj.name === "Cameras")|| (obj.type === "Group" && obj.name === "Illumination")) {
        if (obj.userData.opensimType!== undefined && obj.userData.opensimType==='Model') {
          // Do not recur for models
          children = []
        }
        else if (title !== "Model" && obj.children) {
          children = (obj.children || [])
            .map(traverse)
            .filter((child: any) => child !== null);
        }

        if (obj.type === "Group" && obj.name === "Illumination") {
          children.push(createAddNodeButton("Light"))
        }

        // Add camera as child if this is the "Cameras" group
        if (obj.type === "Group" && obj.name === "Cameras" && camera) {
          if (obj.children) {
            children.push(createAddNodeButton("Camera"))
          }
        }
      }

      return {
        title: title,
        subtitle: obj.type,
        object3D: null,
        nodeType: nodeType,
        id: id,
        uuid: uuid,
        type: obj.type,
        children: children
      };
    }
    return null
  };

  if (scene != null)
    return scene.children
      .map(traverse)
      .filter((child:any) => child !== null);
  else
    return [];
}