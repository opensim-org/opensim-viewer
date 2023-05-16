"""
Created on Mon Apr 24 14:37:54 2023

@author: ayman
"""

import opensim as osim
from pygltflib import *
import numpy as np
import json
from pathlib import Path
import openSimData2Gltf as os2Gltf

# format is
#
# "scenes": [...], will populate 0 only
# "nodes" : [...],
# "meshes" : [...],
# "animations" : [...],


def convertC3D2Gltf(c3dFilePath, shape) :
    shape2Mesh = {
        'brick' : 0,
        'sphere' : 1,
        'cube' : 2,
        'arrow_in' : 3,
        'arrow_out' : 4,
    }
    path = Path(c3dFilePath)
    if not path.exists():
        raise NotADirectoryError("Unable to find file ", path.absolute())

    adapter = osim.C3DFileAdapter()
    tables = adapter.read(c3dFilePath)
    markerDataTable = adapter.getMarkersTable(tables)
    markersFlat = markerDataTable.flatten()
    osim.STOFileAdapter_write(markersFlat, 'markersOnly.sto')
    forcesDataTable = adapter.getForcesTable(tables)
    forcesFlat = forcesDataTable.flatten()
    osim.STOFileAdapter_write(forcesFlat, 'forcesOnly.sto')
    
    numMarkers = markerDataTable.getNumColumns()
    numDataFrames = markerDataTable.getNumRows()
    if numDataFrames==0:
        raise IndexError("Input file has no data", markerDataTable)
    # Units
    unitConversionToMeters = 1.0
    scaleData = False
    if (markerDataTable.hasTableMetaDataKey("Units")) :
        unitString = markerDataTable.getTableMetaDataString("Units")
        if (unitString=="mm"):
            unitConversionToMeters = .001
            scaleData = True
    else:
        print("File has no Units specifications, meters assumed.")
    firstDataFrame = markerDataTable.getRowAtIndex(0)
    # instead of creating the GLTF2 structure from scratch and programmatically adding basic
    # shapes (Sphere, Cube, brick, axes, arrows etc.) instead we load a file with these meshes
    # baked in and use these meshes as needed. 
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
      nextMarkerNode.name = markerDataTable.getColumnLabel(markerIndex)
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
                        "name": markerDataTable.getColumnLabel(markerIndex)}
      nextMarkerNode.extras = opensim_extras
      translation = firstDataFrame.getElt(0, markerIndex).to_numpy()

      if (scaleData):
        nextMarkerNode.translation = (translation * unitConversionToMeters).tolist()
      else:
        nextMarkerNode.translation = translation.tolist()

      nextMarkerNode.scale = [.01, .01, .01]
      gltf.nodes.append(nextMarkerNode)
      topNode.children.append(markerIndex+1)

    convertTableDataToGltfAnimation(gltf, markerDataTable, unitConversionToMeters)
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
  os2Gltf.addTimeStampsAccessor(gltfTop, timeColumn)
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
    os2Gltf.addTranslationAccessor(gltfTop, timeSeriesTableVec3, markerIndex, conversionToMeters)
    # bind accessor to target


def main():
    import argparse

    ## Input parsing.
    ## =============
    parser = argparse.ArgumentParser(
        description="Generate a gltf file corresponding to the passed in c3d file.")
    # Required arguments.
    parser.add_argument('c3d_file_path',
                        metavar='c3dfilepath', type=str,
                        help="filename for c3d file (including path).")
    parser.add_argument('--shape', type=str,
                        help="Pick shape to use for displaying markers.")
    parser.add_argument('--output', type=str,
                        help="Write the result to this filepath. "
                             "Default: the report is named "
                             "<c3d_file_path>.gltf")
    args = parser.parse_args()
    # print(args)
    infile = args.c3d_file_path
    if (args.output == None) :
        outfile = infile.replace('.c3d', '.gltf')
    else:
        outfile = args.output
    
    resultGltf = convertC3D2Gltf(infile, args.shape)
    resultGltf.save(outfile)

main()