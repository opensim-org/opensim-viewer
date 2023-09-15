import opensim as osim
from pygltflib import *
import numpy as np
import vtk 

# Class to convert osim model file to a GLTF structure.
# The typical workflow would be to instantiate this object, then traverse the model
# adding artifacts to gltf structure cached in this class
# for all geometry objects, wil create a node for the mesh as a child of the frame it lives on
# the node for the frame will correspond to a bodyId, and relative transform
class DecorativeGeometryImplementationGltf(osim.simbody.DecorativeGeometryImplementation) :
    unitConversion = 1.0    #1.0 if model is in meters, else set to conversionToMeters factor
    gltf = None             # resulting  GLTF object used to accumulate nodes, meshes, cameras etc.
    currentComponent = None # Keep track of which OpenSim::Component being processed so correct annotation is associated
    mapMobilizedBodyIndexToNodes = {}
    modelNodeIndex = None   # index for root node of the model
    modelNode = None        # reference to the root node representing the model
    groundNode = None       # Node corresponding to Model::Ground
    modelState = None       # reference to state object obtained by initSystem
    mapTypesToMaterialIndex = {}
    MaterialGrouping = {}
    accessors = None        # references to arrays within the gltf structure for convenience
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
        self.materials = self.gltf.materials

    def setCurrentComponent(self, component):
        self.currentComponent = component;

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
        lengths = arg0.getHalfLengths();
        brickData.SetXLength(lengths.get(0)*2*self.unitConversion)
        brickData.SetYLength(lengths.get(1)*2*self.unitConversion)
        brickData.SetZLength(lengths.get(2)*2*self.unitConversion)
        brickData.Update()
        polyDataOutput = brickData.GetOutput();
        self.createGLTFMeshFromPolyData(arg0, "Brick:", polyDataOutput, self.getMaterialIndexByType())
        # print("produce brick")
        return 
    
    def implementCylinderGeometry(self, arg0):
        cylData = vtk.vtkCylinderSource()
        cylData.SetRadius(arg0.getRadius()*self.unitConversion)
        cylData.SetHeight(arg0.getHalfHeight()*self.unitConversion)
        cylData.Update()
        polyDataOutput = cylData.GetOutput();
        self.createGLTFMeshFromPolyData(arg0, "Cylinder:", polyDataOutput, self.getMaterialIndexByType())
        # print("produce cylinder", arg0.getHalfHeight(), arg0.getRadius())
        return

    def implementCircleGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementCircleGeometry(self, arg0)

    def implementSphereGeometry(self, arg0):
        sphereSource = vtk.vtkSphereSource()
        sphereSource.SetRadius(arg0.getRadius()*self.unitConversion)
        sphereSource.SetPhiResolution(16)
        sphereSource.SetThetaResolution(16)
        sphereSource.Update()
        polyDataOutput = sphereSource.GetOutput()
        self.createGLTFMeshFromPolyData(arg0, "Sphere:", polyDataOutput, self.getMaterialIndexByType())
        # print("produce sphere", arg0.getRadius())
        return

    def implementEllipsoidGeometry(self, arg0):
        sphereSource = vtk.vtkSphereSource()
        sphereSource.SetRadius(1.0*self.unitConversion)
        sphereSource.SetPhiResolution(16)
        sphereSource.SetThetaResolution(16)
        # Make a stretching transform to take the sphere into an ellipsoid
        stretch = vtk.vtkTransformPolyDataFilter();
        stretchSphereToEllipsoid = vtk.vtkTransform();
        radiiVec3 = arg0.getRadii()
        stretchSphereToEllipsoid.Scale(radiiVec3[0], radiiVec3[1], radiiVec3[2]);
        stretch.SetTransform(stretchSphereToEllipsoid);
        stretch.SetInputConnection(sphereSource.GetOutputPort());
        stretch.Update()
        polyDataOutput = stretch.GetOutput()
        self.createGLTFMeshFromPolyData(arg0, "Ellipsoid:", polyDataOutput, self.getMaterialIndexByType())
        return

    def implementFrameGeometry(self, arg0):
        # print("produce frame", arg0.getAxisLength())
        return

    def implementTextGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementTextGeometry(self, arg0)

    def implementMeshGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementMeshGeometry(self, arg0)

    def implementMeshFileGeometry(self, arg0):
        if (arg0.getMeshFile().casefold().endswith(".vtp")):
            reader = vtk.vtkXMLPolyDataReader()
            reader.SetFileName(arg0.getMeshFile())
            reader.Update()
            polyDataOutput = reader.GetOutput()
        elif (arg0.getMeshFile().casefold().endswith(".stl")):
            reader = vtk.vtkSTLReader()
            reader.SetFileName(arg0.getMeshFile())
            reader.Update()
            polyDataOutput = reader.GetOutput()
        elif (arg0.getMeshFile().casefold().endswith(".obj")):
            reader = vtk.vtkOBJReader()
            reader.SetFileName(arg0.getMeshFile())
            reader.Update()
            polyDataOutput = reader.GetOutput()
        else:
            raise ValueError("Unsupported file extension")
        self.createGLTFMeshFromPolyData(arg0, "Mesh"+arg0.getMeshFile(), polyDataOutput, self.getMaterialIndexByType())
            #     InlineData, SaveNormal, SaveBatchId);
            # rendererNode["children"].emplace_back(nodes.size() - 1);
            # size_t oldTextureCount = textures.size();
            # WriteTexture(buffers, bufferViews, textures, samplers, images, pd, aPart,
            # this->FileName, this->InlineData, textureMap);
            # meshes[meshes.size() - 1]["primitives"][0]["material"] = materials.size();
            # WriteMaterial(materials, oldTextureCount, oldTextureCount != textures.size(), aPart);
        
        # print("produce mesh", arg0.getMeshFile())
        return

    def createGLTFMeshFromPolyData(self, arg0, gltfName, polyDataOutput, materialIndex):
        if (polyDataOutput.GetNumberOfCells() > 0):
            mesh = self.addMeshForPolyData(polyDataOutput, materialIndex) # populate from polyDataOutput
            self.meshes.append(mesh)
            meshId = len(self.meshes)-1
            meshNode = Node(name=gltfName)
            meshNode.matrix = self.createMatrixFromTransform(arg0.getTransform(), arg0.getScaleFactors())
            t, r, s = self.createTRSFromTransform(arg0.getTransform(), arg0.getScaleFactors())
            meshNode.mesh = meshId;
            nodeIndex = len(self.nodes)
            self.createExtraAnnotations(meshNode)
            self.nodes.append(meshNode)
            self.mapMobilizedBodyIndexToNodes[arg0.getBodyId()].children.append(nodeIndex)

    def implementTorusGeometry(self, arg0):
        torus=vtk.vtkParametricTorus();
        torusSource = vtk.vtkParametricFunctionSource();
        torusSource.SetParametricFunction(torus);
        torusMapper=vtk.vtkPolyDataMapper();
        torusMapper.SetInputConnection(torusSource.GetOutputPort());
        torus.SetRingRadius(arg0.getTorusRadius()+arg0.getTubeRadius());
        torus.SetCrossSectionRadius(arg0.getTubeRadius());
        polyDataOutput = torusSource.GetOutput();
        self.createGLTFMeshFromPolyData(arg0, "Torus:", polyDataOutput, self.getMaterialIndexByType())
        return
        
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

    def addDefaultMaterials(self):
        # create the following materials:
        # 0. default bone material for meshes
        # 1 shiny cyan material for wrap objects and contact surfaces
        # 2 shiny pink material for model markers
        # 3 shiny green material for forces
        # 4 shiny blue material for experimental markers
        # 5 shiny orange material for IMUs
        self.MaterialGrouping["ContactHalfSpace"] = "Wrapping"
        self.MaterialGrouping["ContactSphere"] = "Wrapping"
        self.MaterialGrouping["ContactMesh"] = "Wrapping"
        self.MaterialGrouping["WrapSphere"] = "Wrapping"
        self.MaterialGrouping["WrapCylinder"] = "Wrapping"
        self.MaterialGrouping["WrapEllipsoid"] = "Wrapping"
        self.MaterialGrouping["WrapTorus"] = "Wrapping"
        self.mapTypesToMaterialIndex["Mesh"] = self.addMaterialToGltf("default", [.87, .78, .6, 1.0])
        self.mapTypesToMaterialIndex["Wrapping"] = self.addMaterialToGltf("obstacle", [0, .9, .9, 0.7])
        self.mapTypesToMaterialIndex["Marker"] = self.addMaterialToGltf("markerMat", [1.0, .6, .8, 1.0])
        self.mapTypesToMaterialIndex["Force"] = self.addMaterialToGltf("forceMat", [0, .9, 0, 0.7])
        self.mapTypesToMaterialIndex["ExpMarker"] = self.addMaterialToGltf("expMarkerMat", [0, 0, 0.9, 1.0])
        self.mapTypesToMaterialIndex["IMU"] = self.addMaterialToGltf("imuMat", [.8, .8, .8, 1.0])
        

    def addMaterialToGltf(self, matName, color4):
        newMaterial = Material()
        newMaterial.name = matName
        pbr = PbrMetallicRoughness()  # Use PbrMetallicRoughness
        pbr.baseColorFactor =  color4 # solid red
        pbr.metallicFactor = 0.7
        newMaterial.pbrMetallicRoughness = pbr
        self.materials.append(newMaterial)
        return len(self.materials)-1

    def getMaterialIndexByType(self):
        componentType = self.currentComponent.getConcreteClassName()
        materialGrouping = self.MaterialGrouping.get(componentType)
        if (materialGrouping is not None):
            mat = self.mapTypesToMaterialIndex.get(materialGrouping)
        else:
            mat = self.mapTypesToMaterialIndex.get(componentType)
        if (mat is not None):
            return mat
        else:
            return 1
 
    def setNodeTransformFromDecoration(self, node: Node, mesh: Mesh, decorativeGeometry: osim.DecorativeGeometry):
        bd = decorativeGeometry.getBodyId()
        bdNode = self.mapMobilizedBodyIndexToNodes[bd]
        nodeIndex = len(self.nodes)
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

    def addMeshForPolyData(self, polyData: vtk.vtkPolyData, mat: int):
        tris = vtk.vtkTriangleFilter()
        tris.SetInputData(polyData);
        tris.Update()
        triPolys = tris.GetOutput()

        # This follows vtkGLTFExporter flow
        pointData = triPolys.GetPoints().GetData();
        self.writeBufferAndView(pointData, ARRAY_BUFFER)
        bounds = triPolys.GetPoints().GetBounds()
        # create accessor
        pointAccessor = Accessor()
        pointAccessor.bufferView= len(self.bufferViews)-1
        pointAccessor.byteOffset = 0
        pointAccessor.type = VEC3
        pointAccessor.componentType = FLOAT
        pointAccessor.count = pointData.GetNumberOfTuples()
        maxValue = [bounds[1], bounds[3], bounds[5]]
        minValue = [bounds[0], bounds[2], bounds[4]]
        pointAccessor.min = minValue
        pointAccessor.max = maxValue
        self.accessors.append(pointAccessor)
        pointAccessorIndex = len(self.accessors)-1

        # Now the normals
        normalsFilter = vtk.vtkPolyDataNormals();
        normalsFilter.SetInputData(triPolys)
        normalsFilter.ComputePointNormalsOn()
        normalsFilter.Update()
        normalsData = normalsFilter.GetOutput().GetPointData().GetNormals();
        self.writeBufferAndView(normalsData, ARRAY_BUFFER)
        normalsAccessor = Accessor()
        normalsAccessor.bufferView= len(self.bufferViews)-1
        normalsAccessor.byteOffset = 0
        normalsAccessor.type = VEC3
        normalsAccessor.componentType = FLOAT
        normalsAccessor.count = pointData.GetNumberOfTuples()
        self.accessors.append(normalsAccessor)
        normalsAccessorIndex = len(self.accessors)-1

        # now vertices
        primitive = Primitive()
        primitive.mode = 4
        primitive.material = mat
        meshPolys = triPolys.GetPolys()
        ia = vtk.vtkUnsignedIntArray()
        idList = vtk.vtkIdList()
        while meshPolys.GetNextCell(idList):
            # do something with the cell
            for i in range(idList.GetNumberOfIds()):
                pointId = idList.GetId(i)
                ia.InsertNextValue(pointId)
        self.writeBufferAndView(ia, ELEMENT_ARRAY_BUFFER)

        indexAccessor = Accessor()
        indexAccessor.bufferView = len(self.bufferViews) - 1;
        indexAccessor.byteOffset = 0
        indexAccessor.type = SCALAR
        indexAccessor.componentType = UNSIGNED_INT
        indexAccessor.count =  meshPolys.GetNumberOfCells() * 3;
        primitive.indices = len(self.accessors)
        self.accessors.append(indexAccessor);
        primitive.attributes.POSITION= pointAccessorIndex
        primitive.attributes.NORMAL = normalsAccessorIndex
        newMesh = Mesh()
        newMesh.primitives.append(primitive)
        return newMesh;

    def writeBufferAndView(self, inData: vtk.vtkDataArray, bufferViewTarget: int):
        nt = inData.GetNumberOfTuples()
        nc = inData.GetNumberOfComponents()
        ne = inData.GetElementComponentSize()
        npArray_points = np.array(inData)
        count = nt * nc;
        byteLength = ne * count;
        encoded_result = base64.b64encode(npArray_points).decode("ascii")
        buffer = Buffer()
        buffer.byteLength = byteLength;
        buffer.uri = f"data:application/octet-stream;base64,{encoded_result}";
        self.buffers.append(buffer);
    
        bufferView = BufferView()
        bufferView.buffer = len(self.buffers)-1
        bufferView.byteOffset = 0
        bufferView.byteLength = byteLength
        bufferView.target = bufferViewTarget
        self.bufferViews.append(bufferView);

    def createExtraAnnotations(self, gltfNode: Node):
        gltfNode.extras["path"] = self.currentComponent.getAbsolutePathString()
        gltfNode.extras["opensimType"] = self.currentComponent.getConcreteClassName()
        

        