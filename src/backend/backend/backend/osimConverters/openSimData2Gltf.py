
import opensim as osim
from pygltflib import *
import numpy as np
import base64
import math
import os.path as pathmethods
import os

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
    cwd = os.getcwd();
    gltf = GLTF2().load('basicShapes.gltf')
    gltf.nodes.clear()
    default_scene = gltf.scenes[0]
    # clear children of scene
    sceneNodes = default_scene.nodes
    sceneNodes.clear()
    return gltf

def createForceDictionary(labels, forcesDictionary):
    for idx in range(len(labels)-1):   # len(labels)-1 first force only for now
      force_point_label_candidate = [labels[idx], labels[idx+1]]
      forceNameCandidate = pathmethods.commonprefix(force_point_label_candidate)
      if (len(forceNameCandidate)==len(labels[idx])-1) and (len(forceNameCandidate)!=0):
         forcesDictionary[forceNameCandidate[:-1]] = idx # Avoid trailing _ in most cases
         idx += 1
      else: # could be fx, px format
        k = labels[idx].rfind("f")
        if (k==-1):
          continue
        poslabelCandidate = labels[idx][:k] + "p" + labels[idx][k+1:]
        if (labels[idx+1]==poslabelCandidate):
          forcesDictionary[labels[idx]] = idx
          idx += 1
        
def createForceNodes(shape, forcesDictionary, unitConversionToMeters, scaleData, forceScale, firstDataFrame, gltf, topNode):
    firstForceNodeIndex = len(gltf.nodes)
    for force in forcesDictionary:
      # Create node for the force
      nextForceNode = Node()
      nextForceNode.name = force
      # 0 cube, 1 sphere, 2 brick
      desiredShape = mapShapeStringToMeshNumber(shape)
      # Use cube if no shape is specified
      if (desiredShape==None):
        nextForceNode.mesh =  0
      else:
        nextForceNode.mesh = desiredShape

      # extras are place holder for application specific properties
      # for now we'll pass opensimType, may add layers, as needs arise....
      opensim_extras = {"opensimType": "ExtForce", 
                        "layer": "data", 
                        "path": force}
      
      nextForceNode.extras = opensim_extras
      columnIndex = forcesDictionary[force]
      forceVec3 = firstDataFrame.getElt(0, columnIndex).to_numpy()
      posVec3 = firstDataFrame.getElt(0, columnIndex+1).to_numpy()

      if (scaleData):
        nextForceNode.translation = (posVec3 * unitConversionToMeters).tolist()
      else:
        nextForceNode.translation = posVec3.tolist()

      nextForceNode.scale = [forceScale, forceScale, forceScale]
      nextForceNodeIndex = len(gltf.nodes)
      gltf.nodes.append(nextForceNode)
      topNode.children.append(nextForceNodeIndex)
    return firstForceNodeIndex

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
  gltf.bufferViews.append(timeBufferView)

def createAccessor(gltf, data_nparray, mode):
  "Add buffer, bufferview and accessor for data_nparray"
  "mode: t for translation/position, r for rotation"
  startBufferNumberOffset = len(gltf.buffers)
  startBufferViewNumberOffset = len(gltf.bufferViews)

  myDataBuffer = Buffer()
  myDataBufferView = BufferView()
  myDataAccessor = Accessor()
  myDataAccessor.bufferView = startBufferViewNumberOffset
  myDataAccessor.byteOffset = 0
  myDataAccessor.componentType = FLOAT
  myDataAccessor.count = len(data_nparray)
  myDataAccessor.type = VEC3 if (mode == 't') else VEC4
  gltf.accessors.append(myDataAccessor)
  accessorIndex =  len(gltf.accessors)-1
  gltf.buffers.append(myDataBuffer)
  gltf.bufferViews.append(myDataBufferView)
  myDataBuffer.byteOffset = 0
  elementSize = 3 if (mode == 't') else 4
  myDataBuffer.byteLength = 4 * elementSize * myDataAccessor.count
  encoded = base64.b64encode(data_nparray).decode("ascii")
  myDataBuffer.uri = f"data:application/octet-stream;base64,{encoded}"

  myDataBufferView.buffer = startBufferNumberOffset
  myDataBufferView.byteOffset = 0
  myDataBufferView.byteLength = myDataBuffer.byteLength
  return  accessorIndex

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
  positionData = np.zeros(3 * dataTable.getNumRows(), dtype="float32")
  colData = dataTable.getDependentColumnAtIndex(colIndex)

  maxValue = [-100000.0, -100000.0, -100000.0]
  minValue = [100000.0, 100000.0, 100000.0]
  goodRows = 0
  for row in range(dataTable.getNumRows()):
    # this all can be optimized once done
    rowI = colData[row]
    if (math.isnan(rowI[0])):
      # print ("Nan found at row ", row)
      continue
    
    rawGoodRow = 3*goodRows
    for col in range(3):
      positionData[ rawGoodRow+col] = rowI[col]*conversionToMeters

    # update bounds
    for col in range(3):
     maxValue[col] = max(maxValue[col], positionData[ rawGoodRow+col])
     minValue[col] = min(minValue[col], positionData[ rawGoodRow+col])

    #update goodRows if we made it here
    goodRows += 1

  for index in range(3):
    maxValue[index] = maxValue[index].__float__()
    minValue[index] = minValue[index].__float__()

  # print("goodRows ", goodRows, "min-max", minValue, maxValue)

  encoded = base64.b64encode(positionData).decode("ascii")
  posDataBuffer.uri = f"data:application/octet-stream;base64,{encoded}"

  posDataAccessor.max = maxValue
  posDataAccessor.min = minValue

  posDataBufferView.buffer = startBufferNumberOffset
  posDataBufferView.byteOffset = 0
  posDataBufferView.byteLength = posDataBuffer.byteLength

def addRSAccessors(gltf, dataTable, colIndexT, conversionToMeters):
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

  # print("colIndexT", colIndexT, "rotationData", rotationData)

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
 mag = np.linalg.norm(forceVector.to_numpy())* getForceNormalizationScale()
 scales = np.array([getForceMeshScale(), getForceMeshScale()*mag, getForceMeshScale()])

 if (mag < 1e-10): #avoid nans, scale of 0, rot is arbitrary
    rotz = [1., 0., 0., 0.]
    return [rotz, scales]

 normalized = osim.UnitVec3(forceVector)
 # create rotation from angle+z-axis
 rotzSimbodyNotation  = osim.Rotation(normalized, osim.CoordinateAxis.getCoordinateAxis(1)).convertRotationToQuaternion()
 rotz = [rotzSimbodyNotation.get(3), rotzSimbodyNotation.get(0), rotzSimbodyNotation.get(1), rotzSimbodyNotation.get(2)]
 # will only change the y component to represent vector length

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

    firstMarkerNodeIndex = len(gltfJson.nodes)
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
      opensim_extras = {"opensimType": "ExpMarker", 
                        "layer": "data", 
                        "path": nextMarkerNode.name}
      nextMarkerNode.extras = opensim_extras
      translation = firstDataFrame.getElt(0, markerIndex).to_numpy()
      if (math.isnan(translation[0])):
        translation = np.zeros(3)
      # print (nextMarkerNode.name, translation)

      if (scaleData):
        nextMarkerNode.translation = (translation * unitConversionToMeters).tolist()
      else:
        nextMarkerNode.translation = translation.tolist()

      nextMarkerNode.scale = [markerMeshScaleFactor, markerMeshScaleFactor, markerMeshScaleFactor]
      gltfJson.nodes.append(nextMarkerNode)
      topNode.children.append(markerIndex+1)
    # now convert the trajectory to an animation
    convertPositionDataToGltfAnimation(gltfJson, timeSeriesTableMarkers, unitConversionToMeters, firstMarkerNodeIndex)

def convertPositionDataToGltfAnimation(gltfTop, timeSeriesTableVec3, conversionToMeters, firstNodeIndex) :
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
    target.node = firstNodeIndex+markerIndex
    target.path = "translation"
    channel.target = target
    animation.channels.append(channel)
    # create accessor for data
    # print("addTranslationAccessor at index ", markerIndex, "name=", timeSeriesTableVec3.getColumnLabel(markerIndex))
    addTranslationAccessor(gltfTop, timeSeriesTableVec3, markerIndex, conversionToMeters)

def convertForcesTableToGltfAnimation(gltfTop, timeSeriesTableVec3, conversionToMeters, dict, firstForceNodeIndex) :
  "Take force data and convert into animations in gltf format" 
  "last argument is a dictionary that maps a force to a column index"
  "The code assumes the convention of a force_vec3 followed by force_pos3 next column"
  # Create an animations node under top level
  numAnimations = len(gltfTop.animations)
  if (numAnimations==0) :
    animation = Animation()
    gltfTop.animations.append(animation)
  else :
    animation = gltfTop.animations[numAnimations-1]

  # create two nodes one for samplers, the other for channel per Force
  numForces = len(dict.items())
  # create buffer, bufferview and  accessor for timeframes
  timeColumn = timeSeriesTableVec3.getIndependentColumn()
  timeSamplerIndex = len(gltfTop.accessors)
  addTimeStampsAccessor(gltfTop, timeColumn)
  forceIndex = 0
  for force in dict: #do one marker only to start
    translationSampler = AnimationSampler()
    translationSampler.input = timeSamplerIndex
    translationSampler.output = timeSamplerIndex+ 3*forceIndex+1
    translationSampler.interpolation = ANIM_LINEAR
    animation.samplers.append(translationSampler)

    translationChannel = AnimationChannel()
    translationChannel.sampler = len(animation.samplers)-1
    target = AnimationChannelTarget()
    target.node = firstForceNodeIndex+forceIndex   # account for top level ForceData
    target.path = "translation"
    translationChannel.target = target
    animation.channels.append(translationChannel)
    # create accessor for data
    addTranslationAccessor(gltfTop, timeSeriesTableVec3, dict[force]+1, conversionToMeters)
    # Now rotations
    # create sampler
    rotationSampler = AnimationSampler()
    rotationSampler.input = timeSamplerIndex
    rotationSampler.output = timeSamplerIndex+3*forceIndex+2
    rotationSampler.interpolation = ANIM_LINEAR
    animation.samplers.append(rotationSampler)
    # create channel to use the sampler
    rotationChannel = AnimationChannel()
    rotationChannel.sampler = len(animation.samplers)-1
    target = AnimationChannelTarget()
    target.node = firstForceNodeIndex+forceIndex
    target.path = "rotation"
    rotationChannel.target = target
    animation.channels.append(rotationChannel)

    # Repeat for scale
    scaleSampler = AnimationSampler()
    scaleSampler.input = timeSamplerIndex
    scaleSampler.output = timeSamplerIndex+3*forceIndex+3
    scaleSampler.interpolation = ANIM_LINEAR
    animation.samplers.append(scaleSampler)
    scaleChannel = AnimationChannel()
    scaleChannel.sampler = len(animation.samplers)-1
    target = AnimationChannelTarget()
    target.node = firstForceNodeIndex+forceIndex
    target.path = "scale"
    scaleChannel.target = target
    animation.channels.append(scaleChannel)
    # create accessor for rotation data
    addRSAccessors(gltfTop, timeSeriesTableVec3, dict[force], conversionToMeters)
    #
    forceIndex = forceIndex+1

