"""
Created on Mon Apr 24 14:37:54 2023

@author: ayman
"""

import opensim as osim
from pygltflib import *
import numpy as np
import json
from pathlib import Path
import base64

# format is
#
# "scenes": [...], will populate 0 only
# "nodes" : [...],
# "meshes" : [...],
# "animations" : [...],


def convertTrc2Gltf(trcFilePath, shape) :
    shape2Mesh = {
        'brick' : 0,
        'sphere' : 1,
        'cube' : 2
    }
    path = Path(trcFilePath)
    if not path.exists():
        raise NotADirectoryError("Unable to find file ", path.absolute())

    table = osim.TimeSeriesTableVec3(trcFilePath)
    numMarkers = table.getNumColumns()
    numDataFrames = table.getNumRows()
    if numDataFrames==0:
        raise IndexError("Input file has no data", table)
    # Units
    unitConversionToMeters = 1.0
    scaleData = False
    if (table.hasTableMetaDataKey("Units")) :
        unitString = table.getTableMetaDataString("Units")
        if (unitString=="mm"):
            unitConversionToMeters = .001
            scaleData = True
    else:
        print("File has no Units specifications, meters assumed.")
    firstDataFrame = table.getRowAtIndex(0)
    gltf = GLTF2().load('basicShapes.gltf')

    # create node for the marker mesh, refer to it from all marker nodes
    topNode = Node()
    topNode.name = 'MarkerData'
    gltf.nodes.clear()
    gltf.nodes.append(topNode)
    default_scene = gltf.scenes[0]
    # make children exclusively be node 0
    sceneNodes = default_scene.nodes
    sceneNodes.clear()
    sceneNodes.append(0) # MarkerData topNode
    # Create nodes for the experimental markers, 1 node per marker
    for markerIndex in range(numMarkers):
      # Create node for the marker
      nextMarkerNode = Node()
      nextMarkerNode.name = table.getColumnLabel(markerIndex)
      # 0 cube, 1 sphere, 2 brick
      desiredShape = shape2Mesh.get(shape)
      # Use cube if no shape is specified
      if (desiredShape==None):
        nextMarkerNode.mesh =  0
      else:
        nextMarkerNode.mesh = desiredShape

      # extras are place holder for application specific properties
      # for now we'll pass opensimType, may add layers, as needs arise....
      opensim_extras = {"opensimType": "ExperimentalMarker", 
                        "layer": "data", 
                        "name": table.getColumnLabel(markerIndex)}
      nextMarkerNode.extras = opensim_extras
      translation = firstDataFrame.getElt(0, markerIndex).to_numpy()

      if (scaleData):
        nextMarkerNode.translation = (translation * unitConversionToMeters).tolist()
      else:
        nextMarkerNode.translation = translation.tolist()

      nextMarkerNode.scale = [.01, .01, .01]
      gltf.nodes.append(nextMarkerNode)
      topNode.children.append(markerIndex+1)

    convertTableDataToGltfAnimation(gltf, table, unitConversionToMeters)
    return gltf

def convertTableDataToGltfAnimation(gltfTop, timeSeriesTableVec3, conversionToMeters) :
  "Take marker data and convert into animations in gltf format" 
  # Create an animations node under top level
  animation = Animation()
  gltfTop.animations.append(animation)
  # create two nodes one for samplers, the other for channel per Marker
  numMarkers = timeSeriesTableVec3.getNumColumns()
  # create buffer, bufferview and  accessor for timeframes
  timeColumn = timeSeriesTableVec3.getIndependentColumn()
  addTimeStampsAccessor(gltfTop, timeColumn)
  for markerIndex in range(numMarkers): #do one marker only to start
    sampler = AnimationSampler()
    sampler.input = 12
    sampler.output = 12+markerIndex+1
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
    addDataAccessor(gltfTop, timeSeriesTableVec3, markerIndex, conversionToMeters)
    # bind accessor to target

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
  startAccessorsOffset = len(gltf.accessors)

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


def main():
    import argparse

    ## Input parsing.
    ## =============
    parser = argparse.ArgumentParser(
        description="Generate a gltf file corresponding to the passed in trc file.")
    # Required arguments.
    parser.add_argument('trc_file_path',
                        metavar='trcfilepath', type=str,
                        help="filename for trc file (including path).")
    parser.add_argument('--shape', type=str,
                        help="Pick shape to use for displaying markers.")
    parser.add_argument('--output', type=str,
                        help="Write the result to this filepath. "
                             "Default: the report is named "
                             "<trc_file_path>.gltf")
    args = parser.parse_args()
    # print(args)
    infile = args.trc_file_path
    if (args.output == None) :
        outfile = infile.replace('.trc', '.gltf')
    else:
        outfile = args.output
    
    resultGltf = convertTrc2Gltf(infile, args.shape)
    resultGltf.save(outfile)

main()