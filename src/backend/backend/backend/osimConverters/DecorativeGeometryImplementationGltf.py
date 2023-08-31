import opensim as osim
from pygltflib import *
import vtk 

# Class to convert osim model file to a GLTF structure.
# The typical workflow would be to instantiate this object, then traverse the model
# adding artifacts to gltf structure cached in this class
# for all geometry objects, wil create a node for the mesh as a child of the frame it lives on
# the node for the frame will correspond to a bodyId, and relative transform
class DecorativeGeometryImplementationGltf(osim.simbody.DecorativeGeometryImplementation) :
    unitConversion = 1.0
    gltf = None
    mapMobilizedBodyIndexToNodes = {}
    modelNodeIndex = None
    modelNode = None
    groundNode = None
    modelState = None
    accessors = None
    buffers = None
    bufferViews = None
    nodes = None
    meshes = None


    def setUnitConversion(self, unitConversion):
        self.unitConversion = unitConversion

    def setGltf(self, gltf):
        self.gltf = gltf
        self.accessors = self.gltf.accessors
        self.buffers = self.gltf.buffers
        self.bufferViews = self.gltf.bufferViews
        self.meshes = self.gltf.meshes
        self.nodes = self.gltf.nodes
        self.samplers = self.gltf.samplers



    def setState(self, modelState):
        self.modelState = modelState

    def get_GLTF(self):
        return self.gltf;

    def implementPointGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementPointGeometry(self, arg0)

    def implementLineGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementLineGeometry(self, arg0)

    def implementBrickGeometry(self, arg0):
        brickData = vtk.vtkCubeSource()
        print("produce brick")
        return 
    
    def implementCylinderGeometry(self, arg0):
        cylData = vtk.vtkCylinderSource()
        cylData.SetRadius(arg0.getRadius())
        cylData.SetHeight(arg0.getHalfHeight())
        print("produce cylinder", arg0.getHalfHeight(), arg0.getRadius())
        return

    def implementCircleGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementCircleGeometry(self, arg0)

    def implementSphereGeometry(self, arg0):
        sphereData = vtk.vtkSphereSource()
        sphereData.SetRadius(arg0.getRadius())
        print("produce sphere", arg0.getRadius())
        return

    def implementEllipsoidGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementEllipsoidGeometry(self, arg0)

    def implementFrameGeometry(self, arg0):
        print("produce frame", arg0.getAxisLength())
        return

    def implementTextGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementTextGeometry(self, arg0)

    def implementMeshGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementMeshGeometry(self, arg0)

    def implementMeshFileGeometry(self, arg0):
        reader = vtk.vtkXMLPolyDataReader()
        reader.SetFileName(arg0.getMeshFile())
        reader.Update()
        polyDataOutput = reader.GetOutput()
        if (polyDataOutput.GetNumberOfCells() > 0):
            # mesh = Mesh() # populate from polyDataOutput
            # self.meshes.append(mesh)
            meshId = 1 #len(self.meshes)
            meshNode = Node(name="Mesh:"+arg0.getMeshFile())
            meshNode.matrix = self.createMatrixFromTransform(arg0.getTransform(), arg0.getScaleFactors())
            t, r, s = self.createTRSFromTransform(arg0.getTransform(), arg0.getScaleFactors())
            meshNode.mesh = meshId;
            nodeIndex = len(self.nodes)
            self.nodes.append(meshNode)
            self.mapMobilizedBodyIndexToNodes[arg0.getBodyId()].children.append(nodeIndex)
            #     InlineData, SaveNormal, SaveBatchId);
            # rendererNode["children"].emplace_back(nodes.size() - 1);
            # size_t oldTextureCount = textures.size();
            # WriteTexture(buffers, bufferViews, textures, samplers, images, pd, aPart,
            # this->FileName, this->InlineData, textureMap);
            # meshes[meshes.size() - 1]["primitives"][0]["material"] = materials.size();
            # WriteMaterial(materials, oldTextureCount, oldTextureCount != textures.size(), aPart);
        
        print("produce mesh", arg0.getMeshFile())
        return

    def implementTorusGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementTorusGeometry(self, arg0)

    def implementArrowGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementArrowGeometry(self, arg0)

    def implementConeGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementConeGeometry(self, arg0)
    
    def addModelNode(self, model):
        self.modelNode = Node(name="Model:"+model.getName())
        nodeIndex = len(self.nodes)
        self.gltf.scenes[0].nodes = [nodeIndex]
        self.nodes.append(self.modelNode)
        self.modelNodeIndex = nodeIndex;

    def addGroundFrame(self, model):
        self.groundNode = Node(name="Ground")
        nodeIndex = len(self.nodes)
        self.nodes.append(self.groundNode)
        self.modelNode.children.append(nodeIndex)
        self.mapMobilizedBodyIndexToNodes[0] = self.groundNode;

    def addBodyFrames(self, model):
        for body in model.getBodyList():
            nodeIndex = len(self.nodes)
            bodyNode = Node(name="Body:"+body.getAbsolutePathString())
            xform = body.getTransformInGround(self.modelState)
            t, r, s = self.createTRSFromTransform(xform, osim.Vec3(self.unitConversion))
            bodyNode.scale = s
            bodyNode.rotation = r
            bodyNode.translation = t
            self.nodes.append(bodyNode)
            self.groundNode.children.append(nodeIndex)
            self.mapMobilizedBodyIndexToNodes[body.getMobilizedBodyIndex()]=bodyNode

    def setNodeTransformFromDecoration(self, node: Node, mesh: Mesh, decorativeGeometry: osim.DecorativeGeometry):
        bd = decorativeGeometry.getBodyId()
        bdNode = self.mapMobilizedBodyIndexToNodes[bd]
        nodeIndex = len(self.nodes)
        meshIndex = len(self.meshes)
        self.meshes.append(mesh)
        bdNode.children.append(nodeIndex)
        nodeForDecoration = Node(name=""+bd.getName()+decorativeGeometry.getIndexOnBody())
        self.nodes.append(nodeForDecoration)
        nodeForDecoration.matrix = self.createMatrixFromTransform(decorativeGeometry.getTransform(), decorativeGeometry.getScaleFactors())

    def createTRSFromTransform(self, xform: osim.Transform, scaleFactors: osim.Vec3):
        xr = xform.R();
        xp = xform.p();
        t = [xp.get(0), xp.get(1), xp.get(2)]
        s = [scaleFactors.get(0), scaleFactors.get(1), scaleFactors.get(2)]
        q = xr.convertRotationToQuaternion();
        r = [q.get(1), q.get(2), q.get(3), q.get(0)]
        return t, r, s

    def createMatrixFromTransform(self, xform: osim.Transform, scaleFactors: osim.Vec3):
        retTransform = [1, 0, 0, 0, 0, 1, 0 , 0, 0, 0, 1, 0, 0 , 0, 0, 1];
        r = xform.R();
        p = xform.p();
        for i in range(3):
            for j in range(3):
                retTransform[i+4*j] = r.asMat33().get(i, j);
                retTransform[i+4*j] *= scaleFactors.get(j);
            retTransform[12+i] = p.get(i)*self.unitConversion;
        return retTransform

    def writeMesh(self, polyData: vtk.vtkPolyData):
        tris = vtk.vtkTriangleFilter()
        tris.SetInputData(polyData);
        tris.Update()
        triPolys = tris.GetOutput()
        pointData = triPolys.GetPoints().GetData();
        nt = pointData.GetNumberOfTuples()
        nc = pointData.GetNumberOfComponents()
        ne = pointData.GetElementComponentSize()