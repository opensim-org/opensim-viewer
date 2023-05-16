
import opensim as osim
from pygltflib import *
import numpy as np
import base64

shape2Mesh = {
    'brick' : 0,
    'sphere' : 1,
    'cube' : 2,
    'arrow' : 4
}

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


def addDataAccessor(gltf, dataTable, colIndex, conversionToMeters):
  "Add buffer, bufferview and accessor for marker data column"
  # precompute offsets as cross references use index from file
  startBufferNumberOffset = len(gltf.buffers)
  startBufferViewNumberOffset = len(gltf.bufferViews)

  markerDataBuffer = Buffer()
  markerDataBufferView = BufferView()
  markerDataAccessor = Accessor()
  markerDataAccessor.bufferView = startBufferViewNumberOffset
  markerDataAccessor.byteOffset = 0
  markerDataAccessor.componentType = FLOAT
  markerDataAccessor.count = dataTable.getNumRows()
  markerDataAccessor.type = VEC3
  gltf.accessors.append(markerDataAccessor)

  gltf.buffers.append(markerDataBuffer)
  gltf.bufferViews.append(markerDataBufferView)
  # Above this line is boiler plate bookkeeping regardless of actual data
  # the code below depends on actual data
  markerDataBuffer.byteOffset = 0
  markerDataBuffer.byteLength = 4 * 3 * dataTable.getNumRows()
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
  markerDataBuffer.uri = f"data:application/octet-stream;base64,{encoded}"

  markerDataAccessor.max = maxValue
  markerDataAccessor.min = minValue

  markerDataBufferView.buffer = startBufferNumberOffset
  markerDataBufferView.byteOffset = 0
  markerDataBufferView.byteLength = markerDataBuffer.byteLength

