
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
     rotationData[ rawRow] = quat.get(0)
     rotationData[ rawRow+1] = quat.get(1)
     rotationData[ rawRow+2] = quat.get(2)
     rotationData[ rawRow+3] = quat.get(3)
     # update bounds
     maxValue[0] = max(maxValue[0], rotationData[ rawRow])
     maxValue[1] = max(maxValue[1], rotationData[ rawRow+1])
     maxValue[2] = max(maxValue[2], rotationData[ rawRow+2])
     maxValue[3] = max(maxValue[3], rotationData[ rawRow+3])
     minValue[0] = min(minValue[0], rotationData[ rawRow])
     minValue[1] = min(minValue[1], rotationData[ rawRow+1])
     minValue[2] = min(minValue[2], rotationData[ rawRow+2])
     minValue[3] = min(minValue[3], rotationData[ rawRow+3])

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
 angleZ = math.acos(normalized[1]) 
 # create rotation from angle+z-axis
 rotz  = osim.Quaternion(0, 0, 0, 1)#osim.Rotation().setRotationFromAngleAboutAxis(angleZ, osim.CoordinateAxis.getCoordinateAxis(2)).convertRotationToQuaternion()
 # will only change the y component to represent vector length
 mag = np.linalg.norm(forceVector.to_numpy())* getForceNormalizationScale()
 scales = np.array([getForceMeshScale(), getForceMeshScale()*mag, getForceMeshScale()])
 return [rotz, scales] 

