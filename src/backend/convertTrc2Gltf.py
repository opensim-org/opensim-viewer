"""
Created on Mon Apr 24 14:37:54 2023

@author: ayman
"""

import opensim as osim
from pygltflib import *
import numpy as np
import json
from pathlib import Path

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

    convertTableDataToGltfAnimation(gltf, table)
    return gltf

def convertTableDataToGltfAnimation(gltfTop, timeSeriesTableVec3) :
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
    # sampler.input = ??
    sampler.interpolation = ANIM_LINEAR
    sampler.output = markerIndex+1  #node number for markerIndex
    animation.samplers.append(sampler)

    channel = AnimationChannel()
    channel.sampler = markerIndex
    target = AnimationChannelTarget()
    target.node = markerIndex
    target.path = "translation"
    channel.target = target
    animation.channels.append(channel)
    # create accessor for data
    addDataAccessor(gltfTop, timeSeriesTableVec3.getDependentColumnAtIndex(markerIndex))
    # bind accessor to target

def addTimeStampsAccessor(gltf, timesColumn):
  "Add buffer, bufferview and accessor for timestamps"
  # precompute offsets as cross references use index from file
  startBufferNumberOffset = gltf.buffers.count()
  startBufferViewNumberOffset = gltf.bufferViews.count()
  startAccessorsOffset = gltf.accessors.count()

  timeBuffer = Buffer()
  timeBufferView = BufferView()
  timeAccessor = Accessor()
  timeAccessor.bufferView = startBufferViewNumberOffset
  timeAccessor.byteOffset = 0
  timeAccessor.componentType = FLOAT
  timeAccessor.count = 1
  timeAccessor.type = SCALAR
  gltf.accessors.append(timeAccessor)

  gltf.buffers.append(timeBuffer)
  gltf.bufferViews.append(timeBufferView)
  # Above this line is boiler plate bookkeeping regardless of actual data
  # the code below depends on actual data
  timeBuffer.byteLength = 4 * len(timesColumn)
  timeBuffer.uri =""
  timeAccessor.max = [max(timesColumn)]
  timeAccessor.min = [min(timesColumn)]


def addDataAccessor(gltf, dataColumn):
  "Add buffer, bufferview and accessor for marker data column"
  # precompute offsets as cross references use index from file
  startBufferNumberOffset = gltf.buffers.count()
  startBufferViewNumberOffset = gltf.bufferViews.count()
  startAccessorsOffset = gltf.accessors.count()

  markerDataBuffer = Buffer()
  markerDataBufferView = BufferView()
  markerDataAccessor = Accessor()
  markerDataAccessor.bufferView = startBufferViewNumberOffset
  markerDataAccessor.byteOffset = 0
  markerDataAccessor.componentType = FLOAT
  markerDataAccessor.count = 3
  markerDataAccessor.type = VEC3
  gltf.accessors.append(markerDataAccessor)

  gltf.buffers.append(markerDataBuffer)
  gltf.bufferViews.append(markerDataBufferView)
  # Above this line is boiler plate bookkeeping regardless of actual data
  # the code below depends on actual data
  markerDataBuffer.byteLength = 4 * len(dataColumn)
  markerDataBuffer.uri =""
  markerDataAccessor.max = [max(dataColumn)]
  markerDataAccessor.min = [min(dataColumn)]



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