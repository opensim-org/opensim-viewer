import opensim as osim
from pygltflib import *
import numpy as np
from .openSimData2Gltf import *

# Class to convert osim model file to a GLTF structure.
# The typical workflow would be to instantiate this object, then traverse the model
# adding artifacts to gltf structure cached in this class
# for all geometry objects, wil create a node for the mesh as a child of the frame it lives on
# the node for the frame will correspond to a bodyId, and relative transform
class DecorativeGeometryImplementationGltf(osim.simbody.DecorativeGeometryImplementation) :
    def init(self):
        self.unitConversion = 1.0    #1.0 if model is in meters, else set to conversionToMeters factor
        self.gltf = None             # resulting  GLTF object used to accumulate nodes, meshes, cameras etc.
        self.currentComponent = None # Keep track of which OpenSim::Component being processed so correct annotation is associated
        self.mapMobilizedBodyIndexToNodes = {}
        self.mapMobilizedBodyIndexToNodeIndex = {}
        self.processingPath = False
        self.currentPathMaterial = None
        self.currentTexture = 'default'
        self.mapPathToMaterialIndex = {}
        self.mapPathsToNodeIds = {}
        self.mapPathsToNodeTypes = {}
        self.mapPathsToWrapStatus = {}

        self.useTRS = False  # indicate whether transforms should be written as trs or as a matrix
        self.computeTRSOnly = False # indicate whether nodes need to be generated (or we're computing TRS only)
                                # in which case the computed values are stored in saveT, saveR, saveS for later retrieval
        self.modelNodeIndex = None   # index for root node of the model
        self.modelNode = None        # reference to the root node representing the model
        self.groundNode = None       # Node corresponding to Model::Ground
        self.modelState = None       # reference to state object obtained by initSystem
        self.mapTypesToMaterialIndex = {} # Some opensimTypes share material e.g. Markers
        self.MaterialGrouping = {}
        self.model = None

        self.accessors = None        # references to arrays within the gltf structure for convenience
        self.buffers = None
        self.bufferViews = None
        self.nodes = None
        self.meshes = None
        self.animations = None
        self.pathPointMeshId = None

    def setUnitConversion(self, unitConversion):
        self.unitConversion = unitConversion

    def setGltf(self, gltf):
        self.gltf = gltf
        self.accessors = self.gltf.accessors
        self.buffers = self.gltf.buffers
        self.bufferViews = self.gltf.bufferViews
        self.meshes = self.gltf.meshes
        self.nodes = self.gltf.nodes
        self.materials = self.gltf.materials
        self.animations = self.gltf.animations
    
    def setCurrentComponent(self, component):
        """Keep track of current OpenSim Component being processed, generally the code
        is agnostic to what component it's handling except for the case where multiple calls 
        are needed to render one component as is the case with a muscle/path """
        self.currentComponent = component

    def setDecorativeGeometryIndex(self, index):
        self.dg_index = index

    def setState(self, modelState):
        self.modelState = modelState

    def setDisplayHints(self, displayHints):
        self.displayHints = displayHints

    def get_GLTF(self):
        return self.gltf;

    def implementPointGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementPointGeometry(self, arg0)

    def implementLineGeometry(self, arg0):
        """Create a mesh and a node to represent a segment of a geometry path
        The geometry of the mesh is a traight line in y direction of length 1, 
        The actual work is done in the associated traansform rst 
        This is done so that during animation we know the line to transform rather than complicated
        relative transform that would be impossible to maintain.

        Args:
            arg0 (_type_): decorativeLine
        """
        # Compute the transform that takes the standard line [0,0,0]-[0,1,0] to arg0 as TRS
        segTrans, segScale, qs = self.convertLineToTRS(arg0)

        rotation = [qs.get(1), qs.get(2), qs.get(3), qs.get(0)]
        # translation is point1
        t = [segTrans.get(0), segTrans.get(1), segTrans.get(2)]
        # scale is vec2Norm
        s = segScale
        if (self.computeTRSOnly):
            self.saveT = t
            self.saveR = rotation
            self.saveS = s
            return
        mesh = self.createGLTFLineStrip(osim.Vec3(0.), osim.Vec3(0.0, 1., 0.))
        self.meshes.append(mesh)
        meshId = len(self.meshes)-1

        nodeIndex = len(self.nodes)
        pathSegmentNode = Node(name="pathsegment:")
        pathSegmentNode.scale = [1.0, s, 1.0]
        pathSegmentNode.rotation = rotation
        pathSegmentNode.translation = t
        pathSegmentNode.mesh = meshId
        self.nodes.append(pathSegmentNode)
        self.modelNode.children.append(nodeIndex)

        return 

    def convertLineToTRS(self, arg0):
        point1 = arg0.getPoint1()
        point2 = arg0.getPoint2()
        newY = point2.to_numpy() - point1.to_numpy()
        newYNorm= np.linalg.norm(newY)
        if (newYNorm < 1e-3):
            return point1, 0, osim.Quaternion()
        newYNormalized = newY / newYNorm
        origYNormalized = [0.0, 1.0, 0.]
        newZ = np.cross(origYNormalized, newYNormalized)
        newZNormalized = newZ / np.linalg.norm(newZ)
        newXNormalized = np.cross(newYNormalized, newZNormalized)
        rot33 = osim.Mat33()
        for row in range(3):
            rot33.set(row, 0, newXNormalized[row])
            rot33.set(row, 1, newYNormalized[row])
            rot33.set(row, 2, newZNormalized[row])
        
        rot = osim.Rotation()
        rot.setRotationFromApproximateMat33(rot33)
        qs = rot.convertRotationToQuaternion()
        return point1,newYNorm,qs

    def implementBrickGeometry(self, arg0):
        """Create GLTF artifacts for a brick that includes 
        - node that refers to underlying mesh, and transform that goes with it
        """
        brickMesh = osim.PolygonalMesh().createBrickMesh(arg0.getHalfLengths())
        self.createGLTFNodeAndMeshFromPolygonalMesh(arg0, "Brick:", brickMesh, self.getMaterialIndexByType())
        # print("produce brick")
        return 
    
    def implementCylinderGeometry(self, arg0):
        cylMesh = osim.PolygonalMesh().createCylinderMesh(osim.UnitVec3(0., 1., 0.), arg0.getRadius()*self.unitConversion, arg0.getHalfHeight()*self.unitConversion)
        self.createGLTFNodeAndMeshFromPolygonalMesh(arg0, "Cylinder:", cylMesh, self.getMaterialIndexByType())
        # print("produce cylinder", arg0.getHalfHeight(), arg0.getRadius())
        return

    def implementCircleGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementCircleGeometry(self, arg0)

    def implementSphereGeometry(self, arg0):
        if (not self.processingPath or self.pathPointMeshId==None):
            sphereMesh = osim.PolygonalMesh().createSphereMesh(arg0.getRadius()*self.unitConversion, 3)
            self.createGLTFNodeAndMeshFromPolygonalMesh(arg0, "Sphere:", sphereMesh, self.getMaterialIndexByType())
            if (self.processingPath): # First pathpoint ever created, cache the id for reuse
                self.pathPointMeshId = len(self.meshes)-1
        else: # Here processingPath and meshId was already cached
            self.createGLTFNodeAndMeshFromPolygonalMesh(arg0, "Sphere:", None, self.getMaterialIndexByType(), self.pathPointMeshId)

    def implementEllipsoidGeometry(self, arg0):
        sphereMesh = osim.PolygonalMesh().createSphereMesh(1*self.unitConversion, 3)
        composedScale = arg0.getRadii()
        for i in range(3):
            composedScale.set(i, composedScale.get(i)*arg0.getScaleFactors().get(i))
        arg0.setScaleFactors(composedScale)
        # Make a stretching transform to take the sphere into an ellipsoid
        self.createGLTFNodeAndMeshFromPolygonalMesh(arg0, "Ellipsoid:", sphereMesh, self.getMaterialIndexByType())
        return

    def implementFrameGeometry(self, arg0):
        # print("produce frame", arg0.getAxisLength())
        return

    def implementTextGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementTextGeometry(self, arg0)

    def implementMeshGeometry(self, arg0):
        return _simbody.DecorativeGeometryImplementation_implementMeshGeometry(self, arg0)

    def implementMeshFileGeometry(self, arg0):
        """Function to generate the gltf artifacts corresponding to the passed in mesh file
        This could be expanded to support all formats readable by SimTK parsers.

        Args:
            arg0 (DecorativeMeshFile): full path of a file containing mesh

        Raises:
            ValueError: _description_
        """
        if (arg0.getMeshFile().casefold().endswith(".vtp") or
            arg0.getMeshFile().casefold().endswith(".stl") or 
            arg0.getMeshFile().casefold().endswith(".obj")):
                polygonalMesh = osim.PolygonalMesh()
                polygonalMesh.loadFile(arg0.getMeshFile())
                print("Loading file", arg0.getMeshFile())
                self.createGLTFNodeAndMeshFromPolygonalMesh(arg0, "Mesh"+arg0.getMeshFile(), polygonalMesh, self.getMaterialIndexByType())
        else:
            raise ValueError("Unsupported file extension")
        #self.createGLTFNodeAndMeshFromPolyData(arg0, "Mesh"+arg0.getMeshFile(), polyDataOutput, self.getMaterialIndexByType())
            #     InlineData, SaveNormal, SaveBatchId);
            # rendererNode["children"].emplace_back(nodes.size() - 1);
            # size_t oldTextureCount = textures.size();
            # WriteTexture(buffers, bufferViews, textures, samplers, images, pd, aPart,
            # this->FileName, this->InlineData, textureMap);
            # meshes[meshes.size() - 1]["primitives"][0]["material"] = materials.size();
            # WriteMaterial(materials, oldTextureCount, oldTextureCount != textures.size(), aPart);
        
        return
    
    def getNodeIndexForBody(self, body):
        """Retrieve the index of a gltf-node corresponding to a MobilizedBody

        Args:
            body (OpenSim::Body): _description_

        Returns:
            int: index in gltf[nodes]
        """
        return self.mapMobilizedBodyIndexToNodeIndex[body.getMobilizedBodyIndex()]
    
    def createGLTFNodeAndMeshFromPolyData(self, arg0, gltfName, polyDataOutput, materialIndex, reuseMeshId=-1)->int:
        if (reuseMeshId == -1):
            mesh = self.addMeshForPolyData(polyDataOutput, materialIndex) # populate from polyDataOutput
            self.meshes.append(mesh)
            meshId = len(self.meshes)-1
        else:
            meshId = reuseMeshId

        meshNode = Node(name=gltfName)
        if (self.useTRS):
            t, r, s = self.createTRSFromTransform(arg0.getTransform(), arg0.getScaleFactors())
            meshNode.translation = t
            meshNode.scale = s
            meshNode.rotation = r
        else:
            meshNode.matrix = self.createMatrixFromTransform(arg0.getTransform(), arg0.getScaleFactors())

        meshNode.mesh = meshId;
        nodeIndex = len(self.nodes)
        self.createExtraAnnotations(meshNode)
        self.nodes.append(meshNode)
        self.mapMobilizedBodyIndexToNodes[arg0.getBodyId()].children.append(nodeIndex)
        return nodeIndex


    def createGLTFNodeAndMeshFromPolygonalMesh(self, arg0, gltfName, polygonalMesh, materialIndex, reuseMeshId=-1)->int:
        """_summary_

        Args:
            arg0 (_type_): SimTK::DecorativeMesh
            gltfName (_type_): name to be associated with the mesh
            polygonalMesh (_type_): SimTK::PolygonalMesh 
            materialIndex (_type_): index in gltf structure of the material associated with mesh
            reuseMeshId (int, optional): whether to reuse existing mesh (e.g. Pathpoint or Markers to avoid size inflation)

        Returns:
            int: id of the mesh created in the gltf format
        """
        if (reuseMeshId == -1):
            mesh = self.addGltfMeshForPolygonalMesh(polygonalMesh, materialIndex) # populate from polyDataOutput
            self.meshes.append(mesh)
            meshId = len(self.meshes)-1
        else:
            meshId = reuseMeshId

        meshNode = Node(name=gltfName)
        if (self.useTRS):
            t, r, s = self.createTRSFromTransform(arg0.getTransform(), arg0.getScaleFactors())
            meshNode.translation = t
            meshNode.scale = s
            meshNode.rotation = r
        else:
            meshNode.matrix = self.createMatrixFromTransform(arg0.getTransform(), arg0.getScaleFactors())

        meshNode.mesh = meshId;
        nodeIndex = len(self.nodes)
        self.createExtraAnnotations(meshNode)
        self.nodes.append(meshNode)
        self.mapMobilizedBodyIndexToNodes[arg0.getBodyId()].children.append(nodeIndex)
        return nodeIndex


    def implementTorusGeometry(self, arg0):
        torus=vtk.vtkParametricTorus();
        torusSource = vtk.vtkParametricFunctionSource();
        torusSource.SetParametricFunction(torus);
        torusMapper=vtk.vtkPolyDataMapper();
        torusMapper.SetInputConnection(torusSource.GetOutputPort());
        torus.SetRingRadius(arg0.getTorusRadius()+arg0.getTubeRadius());
        torus.SetCrossSectionRadius(arg0.getTubeRadius());
        polyDataOutput = torusSource.GetOutput();
        self.createGLTFNodeAndMeshFromPolyData(arg0, "Torus:", polyDataOutput, self.getMaterialIndexByType())
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
        self.model = model;

    def addGroundFrame(self, model):
        self.groundNode = Node(name="Ground")
        nodeIndex = len(self.nodes)
        self.nodes.append(self.groundNode)
        self.modelNode.children.append(nodeIndex)
        self.mapMobilizedBodyIndexToNodes[0] = self.groundNode;
        self.mapMobilizedBodyIndexToNodeIndex[0] = nodeIndex

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
            self.mapMobilizedBodyIndexToNodeIndex[body.getMobilizedBodyIndex()] = nodeIndex

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
        self.mapTypesToMaterialIndex["Mesh"] = self.addMaterialToGltf("default", [0.8, 0.8, 0.8, 1.0], 0.5)
        self.mapTypesToMaterialIndex["Wrapping"] = self.addMaterialToGltf("obstacle", [0, .9, .9, 0.7], 1.0)
        self.mapTypesToMaterialIndex["Marker"] = self.addMaterialToGltf("markerMat", [1.0, .6, .8, 1.0], 1.0)
        self.mapTypesToMaterialIndex["Force"] = self.addMaterialToGltf("forceMat", [0, .9, 0, 0.7], .9)
        self.mapTypesToMaterialIndex["ExpMarker"] = self.addMaterialToGltf("expMarkerMat", [0, 0, 0.9, 1.0], 0.9)
        self.mapTypesToMaterialIndex["IMU"] = self.addMaterialToGltf("imuMat", [.8, .8, .8, 1.0], 1.0)
        self.mapTypesToMaterialIndex["Mesh.Metal"] = self.addMaterialToGltf("metal", [.9, 0.9, 0.9, 1.0], 1.0, 'Metal')
        self.mapTypesToMaterialIndex["Mesh.Bone"] = self.addMaterialToGltf("bone", [.93, .84, .77, 1.0], 0.5, 'Bone')
        

    def addMaterialToGltf(self, matName, color4, metallicFactor, texture=None):
        newMaterial = Material()
        newMaterial.name = matName
        newMaterial.alphaCutoff = ""
        pbr = PbrMetallicRoughness()  # Use PbrMetallicRoughness
        pbr.baseColorFactor =  color4
        pbr.metallicFactor = metallicFactor
        newMaterial.pbrMetallicRoughness = pbr
        newMaterial.doubleSided = True
        # if (texture!= None):
        #     newMaterial.normalTexture=0
        self.materials.append(newMaterial)
        return len(self.materials)-1

    def getMaterialIndexByType(self):
        componentType = self.currentComponent.getConcreteClassName()
        materialGrouping = self.MaterialGrouping.get(componentType)
        if (materialGrouping is not None):
            mat = self.mapTypesToMaterialIndex.get(materialGrouping)
        else:
            mat = self.getMeshMaterialId(componentType)
        if (mat is not None):
            return mat
        else:
            return 1
 
    def getMeshMaterialId(self, compType):
        if (self.currentTexture != None and self.currentTexture != ''):
                return self.mapTypesToMaterialIndex.get(compType+'.'+self.currentTexture)
        return  self.mapTypesToMaterialIndex.get(compType)


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
        if (s[0] < 0.):
            s = [1., 1., 1.]
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

    # def addMeshForPolyData(self, polyData: vtk.vtkPolyData, mat: int):
    #     tris = vtk.vtkTriangleFilter()
    #     tris.SetInputData(polyData);
    #     tris.Update()
    #     triPolys = tris.GetOutput()

    #     # This follows vtkGLTFExporter flow
    #     pointData = triPolys.GetPoints().GetData();
    #     self.writeBufferAndView(pointData, ARRAY_BUFFER)
    #     bounds = triPolys.GetPoints().GetBounds()
    #     # create accessor
    #     pointAccessor = Accessor()
    #     pointAccessor.bufferView= len(self.bufferViews)-1
    #     pointAccessor.byteOffset = 0
    #     pointAccessor.type = VEC3
    #     pointAccessor.componentType = FLOAT
    #     pointAccessor.count = pointData.GetNumberOfTuples()
    #     maxValue = [bounds[1], bounds[3], bounds[5]]
    #     minValue = [bounds[0], bounds[2], bounds[4]]
    #     pointAccessor.min = minValue
    #     pointAccessor.max = maxValue
    #     self.accessors.append(pointAccessor)
    #     pointAccessorIndex = len(self.accessors)-1

    #     # Now the normals
    #     normalsFilter = vtk.vtkPolyDataNormals();
    #     normalsFilter.SetInputData(triPolys)
    #     normalsFilter.ComputePointNormalsOn()
    #     normalsFilter.Update()
    #     normalsData = normalsFilter.GetOutput().GetPointData().GetNormals();
    #     self.writeBufferAndView(normalsData, ARRAY_BUFFER)
    #     normalsAccessor = Accessor()
    #     normalsAccessor.bufferView= len(self.bufferViews)-1
    #     normalsAccessor.byteOffset = 0
    #     normalsAccessor.type = VEC3
    #     normalsAccessor.componentType = FLOAT
    #     normalsAccessor.count = pointData.GetNumberOfTuples()
    #     self.accessors.append(normalsAccessor)
    #     normalsAccessorIndex = len(self.accessors)-1

    #     # now vertices
    #     primitive = Primitive()
    #     primitive.mode = 4
    #     if (self.processingPath):
    #         primitive.material = self.currentPathMaterial
    #     else:
    #         primitive.material = mat
    #     meshPolys = triPolys.GetPolys()
    #     ia = vtk.vtkUnsignedIntArray()
    #     idList = vtk.vtkIdList()
    #     while meshPolys.GetNextCell(idList):
    #         # do something with the cell
    #         for i in range(idList.GetNumberOfIds()):
    #             pointId = idList.GetId(i)
    #             ia.InsertNextValue(pointId)
    #     self.writeBufferAndView(ia, ELEMENT_ARRAY_BUFFER)

    #     indexAccessor = Accessor()
    #     indexAccessor.bufferView = len(self.bufferViews) - 1;
    #     indexAccessor.byteOffset = 0
    #     indexAccessor.type = SCALAR
    #     indexAccessor.componentType = UNSIGNED_INT
    #     indexAccessor.count =  meshPolys.GetNumberOfCells() * 3;
    #     primitive.indices = len(self.accessors)
    #     self.accessors.append(indexAccessor);
    #     primitive.attributes.POSITION= pointAccessorIndex
    #     primitive.attributes.NORMAL = normalsAccessorIndex
    #     newMesh = Mesh()
    #     newMesh.primitives.append(primitive)
    #     return newMesh;

    def addGltfMeshForPolygonalMesh(self, polyMesh: osim.PolygonalMesh, mat: int):
        """_summary_

        Args:
            polyMesh (osim.PolygonalMesh): SimTK::PolygonalMesh
            mat (int): index of associated material in gltf

        Returns:
            _type_: _description_
        """
        numVerts = polyMesh.getNumVertices()
        npArray_points = np.zeros((numVerts, 3), dtype="float32")
        for v in range(numVerts):
            npArray_points[v] = polyMesh.getVertexPosition(v).to_numpy()

        # convert arbitrary n-sided faces into triangles as supported by gltf format
        numFaces = polyMesh.getNumFaces()
        faceVertList = []
        hasNormalsAtFaceVertex = polyMesh.hasNormalsAtFaces()
        hastextureAtFaceVertex = polyMesh.hasTextureCoordinatesAtFaces()
        normalsAccessorIndex = None
        textureAccessorIndex = None

        indices = []
        for f in range(numFaces):
            nv = polyMesh.getNumVerticesForFace(f)
            saveLength = len(faceVertList)
            faceVerticesViz = []
            for i in range(nv):
                faceVertList.append([f, i])
                faceVerticesViz.append(saveLength+i)

            for tri in range(nv-2):
                indices.append(faceVerticesViz[0])
                indices.append(faceVerticesViz[tri+1])
                indices.append(faceVerticesViz[tri+2])

        npArray_verts = np.zeros((len(faceVertList), 3), dtype="float32")
        for faceVert in range(len(faceVertList)):
            faceVertIndex = faceVertList[faceVert]
            vertexIndex = polyMesh.getFaceVertex(faceVertIndex[0], faceVertIndex[1])
            npArray_verts[faceVert] = polyMesh.getVertexPosition(vertexIndex).to_numpy()

        byteLength = len(faceVertList)*3*4;
        encoded_result = base64.b64encode(npArray_verts).decode("ascii")
        buffer = Buffer()
        buffer.byteLength = byteLength;
        buffer.uri = f"data:application/octet-stream;base64,{encoded_result}";
        self.buffers.append(buffer);
    
        bufferView = BufferView()
        bufferView.buffer = len(self.buffers)-1
        bufferView.byteOffset = 0
        bufferView.byteLength = byteLength
        bufferView.target = ARRAY_BUFFER
        self.bufferViews.append(bufferView);

        # create accessor
        pointAccessor = Accessor()
        pointAccessor.bufferView= len(self.bufferViews)-1
        pointAccessor.byteOffset = 0
        pointAccessor.type = VEC3
        pointAccessor.componentType = FLOAT
        pointAccessor.count = len(faceVertList)

        min_pt = npArray_points.min(axis=0)
        max_pt = npArray_points.max(axis=0)
        pointAccessor.min = [float(min_pt[0]), float(min_pt[1]), float(min_pt[2])]
        pointAccessor.max = [float(max_pt[0]), float(max_pt[1]), float(max_pt[2])]
        self.accessors.append(pointAccessor)
        pointAccessorIndex = len(self.accessors)-1

        # Now the normals
        if (hasNormalsAtFaceVertex):
            byteLength = len(faceVertList)*3*4;
            npArray_normals = np.zeros((len(faceVertList), 3), dtype="float32")
            for faceVert in range(len(faceVertList)):
                faceVertIndex = faceVertList[faceVert]
                npArray_normals[faceVert] = polyMesh.getVertexNormal(faceVertIndex[0], faceVertIndex[1]).to_numpy()

            encoded_result = base64.b64encode(npArray_normals).decode("ascii")
            buffer = Buffer()
            buffer.byteLength = byteLength;
            buffer.uri = f"data:application/octet-stream;base64,{encoded_result}";
            self.buffers.append(buffer);
        
            bufferView = BufferView()
            bufferView.buffer = len(self.buffers)-1
            bufferView.byteOffset = 0
            bufferView.byteLength = byteLength
            bufferView.target = ARRAY_BUFFER
            self.bufferViews.append(bufferView);
            normalsAccessor = Accessor()
            normalsAccessor.bufferView= len(self.bufferViews)-1
            normalsAccessor.byteOffset = 0
            normalsAccessor.type = VEC3
            normalsAccessor.componentType = FLOAT
            normalsAccessor.count = len(faceVertList)
            self.accessors.append(normalsAccessor)
            normalsAccessorIndex = len(self.accessors)-1

        if (hastextureAtFaceVertex):
            byteLength = len(faceVertList)*2*4;
            npArray_textureCoords = np.zeros((len(faceVertList), 2), dtype="float32")
            for faceVert in range(len(faceVertList)):
                faceVertIndex = faceVertList[faceVert]
                uvVec2 = polyMesh.getVertexTextureCoordinate(faceVertIndex[0], faceVertIndex[1])
                npArray_textureCoords[faceVert] = np.array([uvVec2.get(0), uvVec2.get(1)])

            encoded_result = base64.b64encode(npArray_textureCoords).decode("ascii")
            buffer = Buffer()
            buffer.byteLength = byteLength;
            buffer.uri = f"data:application/octet-stream;base64,{encoded_result}";
            self.buffers.append(buffer);
        
            bufferView = BufferView()
            bufferView.buffer = len(self.buffers)-1
            bufferView.byteOffset = 0
            bufferView.byteLength = byteLength
            bufferView.target = ARRAY_BUFFER
            self.bufferViews.append(bufferView);
            textureAccessor = Accessor()
            textureAccessor.bufferView= len(self.bufferViews)-1
            textureAccessor.byteOffset = 0
            textureAccessor.type = VEC2
            textureAccessor.componentType = FLOAT
            textureAccessor.count = len(faceVertList)
            self.accessors.append(textureAccessor)
            textureAccessorIndex = len(self.accessors)-1

        # now vertices
        primitive = Primitive()
        primitive.mode = 4
        if (self.processingPath):
            primitive.material = self.currentPathMaterial
        else:
            primitive.material = mat

        npArray_indices = np.array(indices, dtype=np.uint32)
        byteLength = len(indices)*4;
        encoded_result = base64.b64encode(npArray_indices).decode("ascii")
        buffer = Buffer()
        buffer.byteLength = byteLength;
        buffer.uri = f"data:application/octet-stream;base64,{encoded_result}";
        self.buffers.append(buffer);
    
        bufferView = BufferView()
        bufferView.buffer = len(self.buffers)-1
        bufferView.byteOffset = 0
        bufferView.byteLength = byteLength
        bufferView.target = ELEMENT_ARRAY_BUFFER
        self.bufferViews.append(bufferView);
        indexAccessor = Accessor()
        indexAccessor.bufferView = len(self.bufferViews) - 1;
        indexAccessor.byteOffset = 0
        indexAccessor.type = SCALAR
        indexAccessor.componentType = UNSIGNED_INT
        indexAccessor.count =  len(npArray_indices);
        self.accessors.append(indexAccessor);
        primitive.indices = len(self.accessors) - 1
        primitive.attributes.POSITION= pointAccessorIndex
        if (normalsAccessorIndex!=None):
            primitive.attributes.NORMAL = normalsAccessorIndex
        if (textureAccessorIndex!=None):
            primitive.attributes.TEXCOORD_0 = textureAccessorIndex
            
        newMesh = Mesh()
        newMesh.primitives.append(primitive)
        return newMesh;

    def createGLTFLineStrip(self, point0, point1):
        cylMesh = osim.PolygonalMesh().createCylinderMesh(osim.UnitVec3(0., 1., 0.), .005, 0.5)
        cylMesh.transformMesh(osim.Transform(osim.Vec3(0., 0.5, 0.0)))
        mesh = self.addGltfMeshForPolygonalMesh(cylMesh, self.currentPathMaterial) # populate from polyDataOutput
        return mesh;

    def createGLTFObjectsForGeometryPath(self, geometryPath):
        """This functions creates all the artifacts needed to visualize a GeometryPath. In the case of line muscles
        These will be spheres at the PathPoints and a LineStrip for the belly of the path.
        The function also keep track of the associated nodes such that when creating an animation later, proper
        transforms will be generated as part of the animation.


        Args:
            geometryPath (_type_): _description_
        """
        if geometryPath not in self.mapPathToMaterialIndex:
            color = geometryPath.getColor(self.modelState)
            color_np = []
            for index in range(3):
                color_np.append(color.get(index))
            color_np.append(1.0)
            pathMaterialIndex = self.addMaterialToGltf(geometryPath.getAbsolutePathString()+str("Mat"), color_np, 0.5)
            self.mapPathToMaterialIndex[geometryPath] = pathMaterialIndex
            self.currentPathMaterial = pathMaterialIndex

        self.useTRS = True #intended so that objects created here can be animated later
        self.processingPath = True
        gPath = osim.GeometryPath.safeDownCast(geometryPath)
        # inspect path to figure out how many gltf nodes will be needed to display
        # pathpoints/wrappoints and line-segments
        # The code below will populate the ids for the corresponding nodes, with extra
        # allocated points/lines made invisible either by mapping to the last point or having 
        # a scale of 0.
        pathNodeTypeList = self.createPathVisualizationMap(gPath)
        self.mapPathsToNodeTypes[gPath] = pathNodeTypeList

        self.mapPathsToNodeIds[gPath] = []
        # lastPoint.getAbsolutePathString()
        adg = osim.ArrayDecorativeGeometry()
        self.customPathGenerateDecorations(gPath, self.modelState, adg)
        ###gPath.generateDecorations(False, self.displayHints, self.modelState, adg)
        # create a sphere for adg[0] and associate with lastPoint
        adg.getElt(0).implementGeometry(self)
        nodeId = len(self.nodes)-1
        self.mapPathsToNodeIds[gPath].append([nodeId, 0])
        for i in range(1, adg.size()):
            adg.getElt(i).implementGeometry(self)
            nodeId = len(self.nodes)-1
            self.mapPathsToNodeIds[gPath].append([nodeId, pathNodeTypeList[i]])
        # create Padding nodes and lines
        lastPos = adg.getElt(adg.size()-2).getTransform().p()
        for i in range(adg.size(), len(pathNodeTypeList)):
            # create a node, keep id in list, make coincident with last point
            # print("Creating node/line", pathNodeTypeList[i])
            if (pathNodeTypeList[i]==0):
                posTransform = osim.Transform().setP(lastPos)
                decoSphere = osim.DecorativeSphere(0.005)
                decoSphere.setColor(color).setBodyId(0).setTransform(posTransform)
                decoSphere.implementGeometry(self)
            else:
                decoLine = osim.DecorativeLine(lastPos, lastPos)
                decoLine.setColor(color).setBodyId(0)
                decoLine.implementGeometry(self)
            nodeId = len(self.nodes)-1
            self.mapPathsToNodeIds[gPath].append([nodeId, pathNodeTypeList[i]])

        self.useTRS = False
        self.processingPath = False

    def createExtraAnnotations(self, gltfNode: Node):
        gltfNode.extras["opensimComponentPath"] = self.currentComponent.getAbsolutePathString()
        gltfNode.extras["opensimType"] = self.currentComponent.getConcreteClassName()

    def createAnimationForStateTimeSeries(self, 
                                          timeSeriesStorage: osim.Storage, motIndex: int, animationName=""):
        # create a timeSeriesTableVec3 of translations one column per body and
        # another timeSeriesTableQuaternion of rotation one per body
        if (animationName=="") :
            animationName = timeSeriesStorage.getName()
        if (animationName=="") :
            animationName = "Anim_"+str(motIndex)
        times = osim.ArrayDouble()
        timeSeriesStorage.getTimeColumn(times)
        timeColumn = osim.Vector(times.getAsVector())
        stateStorage = osim.Storage()
        self.model.formStateStorage(timeSeriesStorage, stateStorage, False)
        stateTraj = osim.StatesTrajectory.createFromStatesStorage(self.model, stateStorage)
        rotation_arrays = []
        translation_arrays = []
        # following maps are used to keep track of positions of anchor pathpoints
        # as well as translation/rotation/scale to transform path-segments
        # the latter are sized based on current configuration but should be adapted to account for
        # points/segments that come in/out due to conditionalPathPoints or Wrapping
        pathpoint_translation_map = {}
        pathsegment_translation_map = {}
        pathsegment_rotation_map = {}
        pathsegment_scale_map = {}
        # Create blank arrays to be populated from motion, these are either translations or (TRS)
        bodySet = self.model.getBodySet()
        numTimes = times.getSize()
        for bodyIndex in range(bodySet.getSize()):
            rotation_arrays.append(np.zeros((numTimes, 4), dtype="float32"))
            translation_arrays.append(np.zeros((numTimes, 3), dtype="float32"))

        for nextPath in self.mapPathsToNodeIds.keys():
            pathNodes = self.mapPathsToNodeIds[nextPath]
            # print (nextPath.getAbsolutePathString())
            for pathNodeIndex in range(len(pathNodes)):
                # For a pathpoint node, we only need translation array
                # for mesh type nodes, we need translation, rotation and scale
                node_type_n_index = pathNodes[pathNodeIndex]
                if (node_type_n_index[1]==0):
                    point_translation_array = np.zeros((numTimes, 3), dtype="float32")
                    pathpoint_translation_map[node_type_n_index[0]]= point_translation_array
                else:
                    segment_translation_array = np.zeros((numTimes, 3), dtype="float32")
                    pathsegment_translation_map[node_type_n_index[0]] = segment_translation_array
                    segment_rotation_array = np.zeros((numTimes, 4), dtype="float32")
                    pathsegment_rotation_map[node_type_n_index[0]] = segment_rotation_array
                    segment_scale_array = np.zeros((numTimes, 3), dtype="float32")
                    pathsegment_scale_map[node_type_n_index[0]] = segment_scale_array


        for step in range(stateTraj.getSize()):
            # print("step:", step)
            nextState = stateTraj.get(step)
            self.model.realizePosition(nextState)
            for bodyIndex in range(bodySet.getSize()):
                nextBody = bodySet.get(bodyIndex)
                translation = nextBody.getPositionInGround(nextState).to_numpy()
                rotationAsSimbodyRot = nextBody.getRotationInGround(nextState)
                rotzSimbodyNotation = rotationAsSimbodyRot.convertRotationToQuaternion()
                rotation = [rotzSimbodyNotation.get(1), rotzSimbodyNotation.get(2), rotzSimbodyNotation.get(3), rotzSimbodyNotation.get(0)]
                rowTime = timeColumn[step]
                for idx in range(4):
                    rotation_arrays[bodyIndex][step, idx] = rotation[idx]
                for idx in range(3):
                    translation_arrays[bodyIndex][step, idx] = translation[idx]

            # For every path in the model, call generate decorations and populate
            # arrays for transforms to incorporate into animation
            for nextPath in self.mapPathsToNodeIds.keys():
                # print(nextPath.getAbsolutePathString())
                adg = osim.ArrayDecorativeGeometry()
                self.customPathGenerateDecorations(nextPath, nextState, adg)
                # nextPath.generateDecorations(False, self.displayHints, nextState, adg)
                pathNodes = self.mapPathsToNodeIds[nextPath]
                for pathNodeIndex in range(adg.size()):
                    node_type_n_index = pathNodes[pathNodeIndex]
                    next_deco_geometry = adg.getElt(pathNodeIndex)
                    newTransform = next_deco_geometry.getTransform()
                    # get new geometry from adg, add entry for translation to go from old to new
                    if (node_type_n_index[1]==0): #translation
                        for idx in range(3):
                            pathpoint_translation_map[node_type_n_index[0]][step, idx] = newTransform.p().get(idx)
                    else:
                        self.computeTRSOnly = True
                        adg.getElt(pathNodeIndex).implementGeometry(self)
                        t, r, s = self.getTRS()
                        self.computeTRSOnly = False
                        for idx in range(3):
                            pathsegment_translation_map[node_type_n_index[0]][step, idx] = t[idx]
                        for idx in range(4):
                            pathsegment_rotation_map[node_type_n_index[0]][step, idx] = r[idx]
                        for idx in range(3):
                            if (idx ==1):
                                pathsegment_scale_map[node_type_n_index[0]][step, idx] = s
                            else:
                                pathsegment_scale_map[node_type_n_index[0]][step, idx] = 1.0

        # print(pathsegment_rotation_map)
        # create an Animation Node
        animation = Animation()
        if (animationName==""):
            animName = "Animation_"+str(len(self.animations)+1)
        else:
            animName = animationName
        animation.name = animName
        self.animations.append(animation)
        animationIndex = len(self.animations)-1
        # create 2 channels per body one for rotation, other for translation
        # keep track of first samplers index then create 2 per body for rotation, translation
        addTimeStampsAccessor(self.gltf, timeColumn.to_numpy())
        # this is the input to every  sampler's input
        timeAccessorIndex = len(self.gltf.accessors)-1
        # create time sampler
        for bodyIndex in range(bodySet.getSize()):
            # Create samplers
            rotSamplerIndex = len(animation.samplers)    #2*bodyIndex
            transSamplerIndex = rotSamplerIndex+1   #2*bodyIndex+1
            rotSampler = AnimationSampler()
            transSampler = AnimationSampler()
            rotSampler.input = timeAccessorIndex
            transSampler.input = timeAccessorIndex
            rotSampler.output = createAccessor(self.gltf, rotation_arrays[bodyIndex], 'r')
            transSampler.output = createAccessor(self.gltf, translation_arrays[bodyIndex], 't')
            animation.samplers.append(rotSampler)
            animation.samplers.append(transSampler)
            # Create channels
            rotChannelIndex = len(animation.channels)
            transChannelIndex = rotChannelIndex+1
            # nextChannelNumber for rotations, nextChannelNumber+1 for translations
            rotChannel = AnimationChannel()
            transChannel = AnimationChannel()
            animation.channels.append(rotChannel)
            animation.channels.append(transChannel) 

            # find target node           
            nextBody = bodySet.get(bodyIndex)
            mobodyIndex = nextBody.getMobilizedBodyIndex()
            bodyNodeIndex = self.mapMobilizedBodyIndexToNodeIndex[mobodyIndex]

            #Point channels back to samplers
            rtarget = AnimationChannelTarget()
            rtarget.node = bodyNodeIndex
            rtarget.path =  "rotation"
            rotChannel.target = rtarget
            rotChannel.sampler = rotSamplerIndex

            ttarget = AnimationChannelTarget()
            ttarget.node = bodyNodeIndex
            ttarget.path = "translation"
            transChannel.target = ttarget
            transChannel.sampler = transSamplerIndex

        for nextPath in self.mapPathsToNodeIds.keys():
            pathNodes = self.mapPathsToNodeIds[nextPath]
            for pathNodeIndex in range(len(pathNodes)):
                node_type_n_index = pathNodes[pathNodeIndex]
                if (node_type_n_index[1]==0): #translation only
                    # create Sampler, accessor and channel for each of the corresponding nodes
                    # Create samplers
                    self.createPathSampler(pathpoint_translation_map, node_type_n_index, animation, timeAccessorIndex, 't')
                else: # full trs
                    self.createPathSampler(pathsegment_translation_map, node_type_n_index, animation, timeAccessorIndex, 't')
                    self.createPathSampler(pathsegment_rotation_map, node_type_n_index, animation, timeAccessorIndex, 'r')
                    self.createPathSampler(pathsegment_scale_map, node_type_n_index, animation, timeAccessorIndex, 's')

        # Add builtin cameras (disabled for CMBBE)
        # # first create nodes for the cameras, then accessors that will be used to position/orient them
        # cameraNodes = self.createCameraNodes(animationName)
        # # create time sampler for the camera
        # cameraTimes = np.array([timeColumn[0], timeColumn[timeColumn.size()-1]])
        # addTimeStampsAccessor(self.gltf, cameraTimes)
        # cameraTimeAccessorIndex = len(self.gltf.accessors)-1  
        # # Camera X, Y, Z
        # # now add samplers and channels for the cameras
        # self.createCameraSamplersAndTargets(cameraNodes, animation, cameraTimeAccessorIndex)

    def createPathSampler(self, pathpoint_translation_map, node_type_n_index, animation, timeAccessorIndex, trs):
        transSamplerIndex = len(animation.samplers)
        transSampler = AnimationSampler()
        transSampler.input = timeAccessorIndex
        transSampler.output = createAccessor(self.gltf, pathpoint_translation_map[node_type_n_index[0]], trs)
        # if (trs == 'r'):
        #     transSampler.interpolation = ANIM_STEP
        animation.samplers.append(transSampler)
                    # Create channels
        transChannelIndex = len(animation.channels)
                    # nextChannelNumber for rotations, nextChannelNumber+1 for translations
        transChannel = AnimationChannel()
        animation.channels.append(transChannel) 
        ttarget = AnimationChannelTarget()
        ttarget.node = node_type_n_index[0]
        if (trs == 't'):
            ttarget.path = "translation"
        else:
            if (trs == 'r'):
                ttarget.path = "rotation"
            else:
                ttarget.path = "scale"
    
        transChannel.target = ttarget
        transChannel.sampler = transSamplerIndex

    def createCameraSamplersAndTargets(self, cameraNodes, animation, cameraTimeAccessorIndex):
        cameraRotation_bbox_arrays = [[0., 0., 0., 1.0], [0., 0., 0.,1.0], 
                                 [0., 0.707, 0., 0.707], [0., 0.707, 0., 0.707],
                                 [-0.707, 0., 0., 0.707], [-0.707, 0., 0., 0.707]]
        cameraTranslation_bbox_arrays = [[-0.5, 1.0, 2.0], [0.5, 1.0, 2.0],
                                    [3., 0.5, -0.5], [3., 0.5, 0.5],
                                    [0., 3., 0.], [1., 3.0, 0.]]
        cameraRotation_arrays = []
        cameraTranslation_arrays = []
        for camIndex in range(len(cameraNodes)):
            cameraRotation_arrays.append(np.zeros((2, 4), dtype="float32"))
            cameraTranslation_arrays.append(np.zeros((2, 3), dtype="float32"))
            # for camera "cam" 
            # append cameraRotation_arrays[2*cam], cameraRotation_arrays[2*cam+1] to rotations
            # append cameraTranslation_arrays[2*cam], cameraRotation_arrays[2*cam+1] to rotations
            for step in range(2):
                for idx in range(4):
                    cameraRotation_arrays[camIndex][step, idx] = cameraRotation_bbox_arrays[2*camIndex+step][idx]
                for idx in range(3):
                    cameraTranslation_arrays[camIndex][step, idx] = cameraTranslation_bbox_arrays[2*camIndex+step][idx]
            #for every camera, will have 2 samplers one for rotations, the other for translations 
            # will ruse cameraTimeAccessorIndex
            rotSamplerIndex = len(animation.samplers)
            transSamplerIndex = rotSamplerIndex+1
            camRotSampler = AnimationSampler()
            camTransSampler = AnimationSampler()
            camRotSampler.input = cameraTimeAccessorIndex
            camTransSampler.input = cameraTimeAccessorIndex
            camRotSampler.output = createAccessor(self.gltf, cameraRotation_arrays[camIndex], 'r')
            camTransSampler.output = createAccessor(self.gltf, cameraTranslation_arrays[camIndex], 't')
            animation.samplers.append(camRotSampler)
            animation.samplers.append(camTransSampler)
            # Create channels
            camRotChannelIndex = len(animation.channels)
            camTransChannelIndex = camRotChannelIndex+1
            # nextChannelNumber for rotations, nextChannelNumber+1 for translations
            camRotChannel = AnimationChannel()
            camTransChannel = AnimationChannel()
            animation.channels.append(camRotChannel)
            animation.channels.append(camTransChannel) 
            # get camera node index
            camNodeIndex = cameraNodes[camIndex]

            rtarget = AnimationChannelTarget()
            rtarget.node = camNodeIndex
            rtarget.path =  "rotation"
            camRotChannel.target = rtarget
            camRotChannel.sampler = rotSamplerIndex
            ttarget = AnimationChannelTarget()
            ttarget.node = camNodeIndex
            ttarget.path = "translation"
            camTransChannel.target = ttarget
            camTransChannel.sampler = transSamplerIndex

    def createCameraNodes(self, animationName):
        camaraPathSuffixes = ["X", "Z", "Y"]
        cameraNodes = [];
        #create 3 scene cameras for tracking along X, Y, Z directions
        for suffix in camaraPathSuffixes:
            cameraNodes.append(addCamera(self.gltf, str("Cam"+animationName+suffix), None))
        return cameraNodes

    def getTRS(self):
        return self.saveT, self.saveR, self.saveS
    
    def createPathVisualizationMap(self, geometryPath):
        """This function create book-keeping structures so that we preallocate 
        nodes for potential pathpoints and linesegments so that the number of these
        is fixed throughout the animation. We'll allocate 4 internal points initially 
        for every segment that may contain wrapping if it is wrapping around multiple objects

        Args:
            geometryPath (_type_): _description_
        """
        numSegments = geometryPath.getPathPointSet().getSize()-1 #segments not accounting for wrapping
        numWrapObjects = geometryPath.getWrapSet().getSize()
        expectedTypes = []
        expectedTypes.append(0) # Start with path point
        for seg in range(numSegments):
            expectedTypes.append(0) # Pathpoint followed by a line segment
            expectedTypes.append(1)
            # for every wrap object will add 4 points and segment
            for wrap in range(numWrapObjects):
                for intermediate in range(4) :
                    expectedTypes.append(0)
                    expectedTypes.append(1)
        segmentMap = []
        if (numWrapObjects==0):
            self.mapPathsToWrapStatus[geometryPath] = segmentMap
            return expectedTypes
        for seg in range(numSegments):
            wrapList = []
            for wrapObjIndex in range(numWrapObjects):
                wrapList.append(geometryPath.getWrapSet().get(wrapObjIndex).getWrapObject())
            segmentMap.append(wrapList)
        self.mapPathsToWrapStatus[geometryPath] = segmentMap
        return expectedTypes

    def customPathGenerateDecorations(self, geometryPath, state, arrayDecorativeGeometry):
        """This function is a substitute to generateDecorations that produces fixed number of intermediate points
           per wrapping

        Args:
            geometryPath (_type_): _description_
        """
        pathPoints = geometryPath.getCurrentPath(state)
        color = geometryPath.getColor(state)
        lastPoint = pathPoints.get(0)
        lastPos = lastPoint.getLocationInGround(state)
        decoSphere = osim.DecorativeSphere(0.005)
        decoSphere.setColor(color).setBodyId(0)
        decoSphere.setTransform(osim.Transform().setP(lastPos))
        arrayDecorativeGeometry.push_back(decoSphere)
        hasWrapping = geometryPath.getWrapSet().getSize() > 0
        if (not hasWrapping):
            for i in range(1, pathPoints.getSize()) :
                point = pathPoints.get(i)
                # regular point
                pos = point.getLocationInGround(state)
                posTransform = osim.Transform().setP(pos)
                decoSphere = osim.DecorativeSphere(0.005)
                decoSphere.setColor(color).setBodyId(0).setTransform(posTransform)
                arrayDecorativeGeometry.push_back(decoSphere)
                decoLine = osim.DecorativeLine(lastPos, pos)
                decoLine.setColor(color).setBodyId(0)
                arrayDecorativeGeometry.push_back(decoLine)
                lastPos = pos
        else :
            expectedSegments = self.mapPathsToWrapStatus[geometryPath]
            segmentStartIndex = 0
            for segmentNumber in range(len(expectedSegments)):
                # find index of first non wrap point 
                segmentEndIndex = segmentStartIndex+1
                found = False
                while (not found):
                    nextCandidatePoint  = pathPoints.get(segmentEndIndex)
                    pwp = osim.PathWrapPoint.safeDownCast(nextCandidatePoint)
                    if (pwp == None):
                        found = True
                    else:
                        segmentEndIndex = segmentEndIndex+1
                # At this point we have a segment between pathPoints[segmentStartIndex] - pathPoints[segmentEndIndex]
                # it may have 0 up to #wrapObjects pwp points for each wrap generate 4 points/segments
                # here we found the real segment
                numActualWraps = 0
                for potentialWrapIndex in range(segmentStartIndex+1, segmentEndIndex):
                    nextWrapPoint = pathPoints.get(potentialWrapIndex)
                    pwp = osim.PathWrapPoint.safeDownCast(nextWrapPoint)
                    surfacePoints = pwp.getWrapPath(state)
                    numPts = surfacePoints.getSize()
                    if (numPts == 0) : # Fake point, skip over
                        continue
                    elif (numPts ==1) :
                        indices = [0, 0, 0, 0]
                    elif (numPts == 2) :
                        indices = [0, 0, 1, 1]
                    elif (numPts == 3) :
                        indices = [0, 1, 1, 2]
                    else:
                        increment = int((numPts-1)/3)
                        indices = [0, increment, numPts-1-increment, numPts-1]
                    numActualWraps += 1
                    for ind in indices :
                        posLocal = surfacePoints.get(ind)
                        pos = pwp.getParentFrame().findStationLocationInGround(state, posLocal)
                        posTransform = osim.Transform().setP(pos)
                        decoSphere = osim.DecorativeSphere(0.005)
                        decoSphere.setColor(color).setBodyId(0).setTransform(posTransform)
                        arrayDecorativeGeometry.push_back(decoSphere)
                        decoLine = osim.DecorativeLine(lastPos, pos)
                        decoLine.setColor(color).setBodyId(0)
                        arrayDecorativeGeometry.push_back(decoLine)
                        lastPos = pos
                # if numActualWraps < expectedSegments[segmentNumber] pad
                toPad = len(expectedSegments[segmentNumber]) - numActualWraps
                # print ("num actual wraps=", numActualWraps)
                nextPointPos = pathPoints.get(segmentEndIndex).getLocationInGround(state)
                # for line segments that are collapsed and are side-effects of disengaged wrapping
                # we make sure these have transforms aligned with the segment so that when interpolating
                # between frames, no stray line segments appear. For each such segment we produce
                # an intermediate along the line to compute the transform
                delta = 0.01
                for pad in range(toPad * 4):
                    intermediate = (1-delta*(pad+1)) * lastPos.to_numpy() + delta*(pad+1) * nextPointPos.to_numpy()
                    posTransform = osim.Transform().setP(lastPos)
                    decoSphere = osim.DecorativeSphere(0.005)
                    decoSphere.setColor(color).setBodyId(0).setTransform(posTransform)
                    arrayDecorativeGeometry.push_back(decoSphere)
                    decoLine = osim.DecorativeLine(lastPos, osim.Vec3(intermediate))
                    decoLine.setColor(color).setBodyId(0)
                    arrayDecorativeGeometry.push_back(decoLine)
                
                point = pathPoints.get(segmentEndIndex)
                # regular point
                pos = point.getLocationInGround(state)
                posTransform = osim.Transform().setP(pos)
                decoSphere = osim.DecorativeSphere(0.005)
                decoSphere.setColor(color).setBodyId(0).setTransform(posTransform)
                arrayDecorativeGeometry.push_back(decoSphere)
                decoLine = osim.DecorativeLine(lastPos, pos)
                decoLine.setColor(color).setBodyId(0)
                arrayDecorativeGeometry.push_back(decoLine)
                lastPos = pos

                segmentStartIndex = segmentEndIndex

    def makeAnimationNamesUnique(self, motionPaths):
        animationNames = []
        motIndex = 0
        for anim in self.animations:
            if anim.name in animationNames:
                suffix = Path(motionPaths[motIndex]).stem
                anim.name = anim.name + '_'+ suffix
                animationNames.append(anim.name)
            else:
                animationNames.append(anim.name)
            motIndex = motIndex+1



