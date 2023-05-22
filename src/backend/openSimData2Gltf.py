
import opensim as osim
from pygltflib import *
import numpy as np
import base64
import math

shape2Mesh = {
    'brick' : 0,
    'sphere' : 1,
    'cube' : 2,
    'arrow' : 3
}

# Return the raw scale factor to be applied to the mesh
# maintained in basicShapes.gltf to represent a Marker
def getMarkerMeshScale():
  return .01

def getForceMeshScale():
  return 0.1

def getForceNormalizationScale():
  return .001

def mapShapeStringToMeshNumber(shape):
  return shape2Mesh[shape]

def initGltf():
    "Initialize Gltf json structure, seed it with basicShapes"
    gltf = GLTF2().load('basicShapes.gltf')
    gltf.nodes.clear()
    default_scene = gltf.scenes[0]
    # clear children of scene
    sceneNodes = default_scene.nodes
    sceneNodes.clear()
    return gltf

def addTimeStampsAccessor(gltf, timesColumn):
  "Add buffer, bufferview and accessor for timestamps"
  # precompute offsets as cross references use index from file
  startBufferNumberOffset = len(gltf.buffers)
  startBufferViewNumberOffset = len(gltf.bufferViews)
  startAccessorsOffset = len(gltf.accessors)

  timeBuffer = Buffer()
  timeBufferView = BufferView()
  timeAccessor = Accessor()
  timeAccessor.bufferView = startBufferViewNumberOffset
  timeAccessor.byteOffset = 0
  timeAccessor.componentType = FLOAT
  timeAccessor.count = len(timesColumn)
  timeAccessor.type = SCALAR
  gltf.accessors.append(timeAccessor)

  gltf.buffers.append(timeBuffer)

  # Above this line is boiler plate bookkeeping regardless of actual data
  # the code below depends on actual data
  timeBuffer.byteLength = 4 * len(timesColumn)
  times = np.array(list(timesColumn), dtype="float32")
  encoded = base64.b64encode(times).decode("ascii")
  timeBuffer.uri = f"data:application/octet-stream;base64,{encoded}"
  timeAccessor.max = [max(timesColumn)]
  timeAccessor.min = [min(timesColumn)]

  timeBufferView.buffer = startBufferNumberOffset
  timeBufferView.byteOffset = 0
  timeBufferView.byteLength = timeBuffer.byteLength
  timeBufferView.target
  gltf.bufferViews.append(timeBufferView)


def addTranslationAccessor(gltf, dataTable, colIndex, conversionToMeters):
  "Add buffer, bufferview and accessor for marker data column"
  # precompute offsets as cross references use index from file
  startBufferNumberOffset = len(gltf.buffers)
  startBufferViewNumberOffset = len(gltf.bufferViews)

  posDataBuffer = Buffer()
  posDataBufferView = BufferView()
  posDataAccessor = Accessor()
  posDataAccessor.bufferView = startBufferViewNumberOffset
  posDataAccessor.byteOffset = 0
  posDataAccessor.componentType = FLOAT
  posDataAccessor.count = dataTable.getNumRows()
  posDataAccessor.type = VEC3
  gltf.accessors.append(posDataAccessor)

  gltf.buffers.append(posDataBuffer)
  gltf.bufferViews.append(posDataBufferView)
  # Above this line is boiler plate bookkeeping regardless of actual data
  # the code below depends on actual data
  posDataBuffer.byteOffset = 0
  posDataBuffer.byteLength = 4 * 3 * dataTable.getNumRows()
  markerData = np.zeros(3 * dataTable.getNumRows(), dtype="float32")
  colData = dataTable.getDependentColumnAtIndex(colIndex)

  maxValue = [-100000.0, -100000.0, -100000.0]
  minValue = [100000.0, 100000.0, 100000.0]
  for row in range(dataTable.getNumRows()):
    # this all can be optimized once done
     rowI = colData[row]
     if (math.isnan(rowI[0])):
       print ("Nan found at row ")
    
     rawRow = 3*row
     markerData[ rawRow] = rowI[0]*conversionToMeters
     markerData[ rawRow+1] = rowI[1]*conversionToMeters
     markerData[ rawRow+2] = rowI[2]*conversionToMeters
     # update bounds
     maxValue[0] = max(maxValue[0], markerData[ rawRow])
     maxValue[1] = max(maxValue[1], markerData[ rawRow+1])
     maxValue[2] = max(maxValue[2], markerData[ rawRow+2])
     minValue[0] = min(minValue[0], markerData[ rawRow])
     minValue[1] = min(minValue[1], markerData[ rawRow+1])
     minValue[2] = min(minValue[2], markerData[ rawRow+2])

  for index in range(3):
    maxValue[index] = maxValue[index].__float__()
    minValue[index] = minValue[index].__float__()

  encoded = base64.b64encode(markerData).decode("ascii")
  posDataBuffer.uri = f"data:application/octet-stream;base64,{encoded}"

  posDataAccessor.max = maxValue
  posDataAccessor.min = minValue

  posDataBufferView.buffer = startBufferNumberOffset
  posDataBufferView.byteOffset = 0
  posDataBufferView.byteLength = posDataBuffer.byteLength

def addRSAccessors(gltf, dataTable, colIndexT, colIndexV, conversionToMeters):
  "Add buffer, bufferview and accessor for rotation, scale data columns"
  "Following grf.mot format, we have one column that is a vector with"
  "direction (R) that will be converted into quaternion for use in gltf and magnitude (S). The scaling"
  "will be applied in one direction so that thickness stay fixed."
  # precompute offsets as cross references use index from file
  startBufferNumberOffset = len(gltf.buffers)
  startBufferViewNumberOffset = len(gltf.bufferViews)

  rotationDataBuffer = Buffer()
  rotationDataBufferView = BufferView()
  rotationDataAccessor = Accessor()
  rotationDataAccessor.bufferView = startBufferViewNumberOffset
  rotationDataAccessor.byteOffset = 0
  rotationDataAccessor.componentType = FLOAT
  rotationDataAccessor.count = dataTable.getNumRows()
  rotationDataAccessor.type = VEC4
  gltf.accessors.append(rotationDataAccessor)

  gltf.buffers.append(rotationDataBuffer)
  gltf.bufferViews.append(rotationDataBufferView)
  # 
  rotationDataBuffer.byteOffset = 0
  rotationDataBuffer.byteLength = 4 * 4 * dataTable.getNumRows()
  rotationData = np.zeros(4 * dataTable.getNumRows(), dtype="float32")

  # Repeat for scale data
  scaleDataBuffer = Buffer()
  scaleDataBufferView = BufferView()
  scaleDataAccessor = Accessor()
  scaleDataAccessor.bufferView = startBufferViewNumberOffset+1
  scaleDataAccessor.byteOffset = 0
  scaleDataAccessor.componentType = FLOAT
  scaleDataAccessor.count = dataTable.getNumRows()
  scaleDataAccessor.type = VEC3
  gltf.accessors.append(scaleDataAccessor)

  gltf.buffers.append(scaleDataBuffer)
  gltf.bufferViews.append(scaleDataBufferView)
  # 
  scaleDataBuffer.byteOffset = 0
  scaleDataBuffer.byteLength = 4 * 3 * dataTable.getNumRows()
  scaleData = np.zeros(4 * dataTable.getNumRows(), dtype="float32")

  colData = dataTable.getDependentColumnAtIndex(colIndexT)

  maxValue = [-100000.0, -100000.0, -100000.0, -100000]
  minValue = [100000.0, 100000.0, 100000.0, 100000]
  for row in range(dataTable.getNumRows()):
    # this all can be optimized once done
     quat, scale = convertForceVectorToRS(colData[row])
     rawRow = 4*row
     rawRow3 = 3*row
     rotationData[ rawRow] = quat[0]
     rotationData[ rawRow+1] = quat[1]
     rotationData[ rawRow+2] = quat[2]
     rotationData[ rawRow+3] = quat[3]
     # update bounds for quaternion data
     for coord in range(4):
      maxValue[coord] = max(maxValue[coord], rotationData[ rawRow+coord])
      minValue[coord] = min(minValue[coord], rotationData[ rawRow+coord])

     scaleData[ rawRow3] = scale[0].__float__()
     scaleData[ rawRow3+1] = scale[1].__float__()
     scaleData[ rawRow3+2] = scale[2].__float__()

  for index in range(4):
    maxValue[index] = maxValue[index].__float__()
    minValue[index] = minValue[index].__float__()

  encoded = base64.b64encode(rotationData).decode("ascii")
  rotationDataBuffer.uri = f"data:application/octet-stream;base64,{encoded}"

  rotationDataAccessor.max = maxValue
  rotationDataAccessor.min = minValue

  rotationDataBufferView.buffer = startBufferNumberOffset
  rotationDataBufferView.byteOffset = 0
  rotationDataBufferView.byteLength = rotationDataBuffer.byteLength

  defaultForceScale = getForceMeshScale()
  scaleDataAccessor.max = [defaultForceScale, defaultForceScale, defaultForceScale]
  scaleDataAccessor.min = [defaultForceScale, defaultForceScale, defaultForceScale]

  scaleDataBufferView.buffer = startBufferNumberOffset+1
  scaleDataBufferView.byteOffset = 0
  scaleDataBufferView.byteLength = scaleDataBuffer.byteLength

  encodedScales = base64.b64encode(scaleData).decode("ascii")
  scaleDataBuffer.uri = f"data:application/octet-stream;base64,{encodedScales}"

def convertForceVectorToRS(forceVector):
 "Convert non unit vector in ground frame into a quaternion and a scale vec3" 
 normalized = osim.UnitVec3(forceVector)
 # create rotation from angle+z-axis
 rotzSimbodyNotation  = osim.Rotation(normalized, osim.CoordinateAxis.getCoordinateAxis(1)).convertRotationToQuaternion()
 rotz = [rotzSimbodyNotation.get(3), rotzSimbodyNotation.get(0), rotzSimbodyNotation.get(1), rotzSimbodyNotation.get(2)]
 # will only change the y component to represent vector length
 mag = np.linalg.norm(forceVector.to_numpy())* getForceNormalizationScale()
 scales = np.array([getForceMeshScale(), getForceMeshScale()*mag, getForceMeshScale()])
 return [rotz, scales] 


def convertMarkersTimeSeries2Gltf(gltfJson, shape, timeSeriesTableMarkers):
    "Convert timeSeriesTable of Marker data into gltf layout/structures"
    "This function creates a top node named MarkerData under the scene node"
    "This also creates a new animation entry."
    numMarkers = timeSeriesTableMarkers.getNumColumns()
    numDataFrames = timeSeriesTableMarkers.getNumRows()
    if numDataFrames==0:
        raise IndexError("Input file has no data", timeSeriesTableMarkers)
    # Units
    unitConversionToMeters = 1.0
    scaleData = False
    if (timeSeriesTableMarkers.hasTableMetaDataKey("Units")) :
        unitString = timeSeriesTableMarkers.getTableMetaDataString("Units")
        if (unitString=="mm"):
            unitConversionToMeters = .001
            scaleData = True
    else:
        print("File has no Units specifications, meters assumed.")
    firstDataFrame = timeSeriesTableMarkers.getRowAtIndex(0)
    
    # create node for the marker mesh, refer to it from all marker nodes
    topNode = Node( name='MarkerData')
    gltfJson.nodes.append(topNode)
    gltfJson.scenes[0].nodes.append(len(gltfJson.nodes)-1) # MarkerData topNode
    markerMeshScaleFactor = getMarkerMeshScale()

    if (shape == None): # if unspecified use cube for minimal overhead
      shape = 'cube'

    # Create nodes for the experimental markers, 1 node per marker
    for markerIndex in range(numMarkers):
      # Create node for the marker
      nextMarkerNode = Node()
      nextMarkerNode.name = timeSeriesTableMarkers.getColumnLabel(markerIndex)
      # 0 cube, 1 sphere, 2 brick
      desiredShape = mapShapeStringToMeshNumber(shape)
      # Use cube if no shape is specified
      if (desiredShape==None):
        nextMarkerNode.mesh =  0
      else:
        nextMarkerNode.mesh = desiredShape

      # extras are place holder for application specific properties
      # for now we'll pass opensimType, may add layers, as needs arise....
      opensim_extras = {"opensimType": "ExperimentalMarker", 
                        "layer": "data", 
                        "name": nextMarkerNode.name}
      nextMarkerNode.extras = opensim_extras
      translation = firstDataFrame.getElt(0, markerIndex).to_numpy()

      print (nextMarkerNode.name, translation)

      if (scaleData):
        nextMarkerNode.translation = (translation * unitConversionToMeters).tolist()
      else:
        nextMarkerNode.translation = translation.tolist()

      nextMarkerNode.scale = [markerMeshScaleFactor, markerMeshScaleFactor, markerMeshScaleFactor]
      gltfJson.nodes.append(nextMarkerNode)
      topNode.children.append(markerIndex+1)
    # now convert the trajectory to an animation
    convertPositionDataToGltfAnimation(gltfJson, timeSeriesTableMarkers, unitConversionToMeters)

def convertPositionDataToGltfAnimation(gltfTop, timeSeriesTableVec3, conversionToMeters) :
  "Take marker data trajectory and convert into animations in gltf format" 
  # Create an animations node under top level
  numAnimations = len(gltfTop.animations)
  if (numAnimations==0) :
    animation = Animation()
    gltfTop.animations.append(animation)
  else :
    animation = gltfTop.animations[numAnimations-1]
  # create two nodes one for samplers, the other for channel per Marker
  numMarkers = timeSeriesTableVec3.getNumColumns()
  # create buffer, bufferview and  accessor for timeframes
  timeColumn = timeSeriesTableVec3.getIndependentColumn()
  addTimeStampsAccessor(gltfTop, timeColumn)
  timeSamplerIndex = len(gltfTop.accessors)
  for markerIndex in range(numMarkers): #do one marker only to start
    sampler = AnimationSampler()
    sampler.input = timeSamplerIndex-1 # time sampler is last accessor
    sampler.output = timeSamplerIndex+markerIndex
    sampler.interpolation = ANIM_LINEAR
    animation.samplers.append(sampler)

    channel = AnimationChannel()
    channel.sampler = markerIndex
    target = AnimationChannelTarget()
    target.node = markerIndex
    target.path = "translation"
    channel.target = target
    animation.channels.append(channel)
    # create accessor for data
    addTranslationAccessor(gltfTop, timeSeriesTableVec3, markerIndex, conversionToMeters)