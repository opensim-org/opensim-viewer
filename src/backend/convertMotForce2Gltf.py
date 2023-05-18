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
import os.path as pathmethods
# format is
#
# "scenes": [...], will populate 0 only
# "nodes" : [...],
# "meshes" : [...],
# "animations" : [...],


def convertMotForce2Gltf(motFilePath, shape) :
    path = Path(motFilePath)
    if not path.exists():
        raise NotADirectoryError("Unable to find file ", path.absolute())

    table = osim.TimeSeriesTable(motFilePath)
    timeSeriesTableVec3 = table.packVec3()
    # osim.STOFileAdapterVec3.write(timeSeriesTableVec3, 'packedForcesOnly.sto')
    labels = timeSeriesTableVec3.getColumnLabels()
    # Based on column labels and assuming grouping was done properly by .pack call
    # Will add entry for force_point pair of columns with common prefix
    forcesDictionary = dict()
    for l in range(len(labels)-1):   # len(labels)-1 first force only for now
      force_point_label_candidate = [labels[l], labels[l+1]]
      forceNameCandidate = pathmethods.commonprefix(force_point_label_candidate)
      if (len(forceNameCandidate)==len(labels[l])-1):
         forcesDictionary[forceNameCandidate[:-1]] = l # Avoid trailing _ in most cases
         l=l+1
      # print (forcesDictionary)

    numDataFrames = timeSeriesTableVec3.getNumRows()
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
        print("File has no Units specifications, NMS assumed.")
    firstDataFrame = timeSeriesTableVec3.getRowAtIndex(0)
    gltf = GLTF2().load('basicShapes.gltf')

    # create node for the force mesh, refer to it from all force nodes
    topNode = Node()
    topNode.name = 'ForceData'
    gltf.nodes.clear()
    gltf.nodes.append(topNode)
    default_scene = gltf.scenes[0]
    # make children exclusively be node 0
    sceneNodes = default_scene.nodes
    sceneNodes.clear()
    sceneNodes.append(0) # ForceData topNode
    sceneNodeIndex = len(sceneNodes)
    # Create nodes for the experimental markers, 1 node per marker
    for force in forcesDictionary:
      # Create node for the force
      nextForceNode = Node()
      nextForceNode.name = force
      # 0 cube, 1 sphere, 2 brick
      desiredShape = os2Gltf.mapShapeStringToMeshNumber(shape)
      # Use cube if no shape is specified
      if (desiredShape==None):
        nextForceNode.mesh =  0
      else:
        nextForceNode.mesh = desiredShape

      # extras are place holder for application specific properties
      # for now we'll pass opensimType, may add layers, as needs arise....
      opensim_extras = {"opensimType": "ExternalForce", 
                        "layer": "data", 
                        "name": force}
      
      nextForceNode.extras = opensim_extras
      columnIndex = forcesDictionary[force]
      forceVec3 = firstDataFrame.getElt(0, columnIndex).to_numpy()
      posVec3 = firstDataFrame.getElt(0, columnIndex+1).to_numpy()

      if (scaleData):
        nextForceNode.translation = (posVec3 * unitConversionToMeters).tolist()
      else:
        nextForceNode.translation = posVec3.tolist()

      nextForceNode.scale = [.1, .1, .1]
      nextForceNodeIndex = len(gltf.nodes)
      gltf.nodes.append(nextForceNode)
      topNode.children.append(nextForceNodeIndex)
      

    convertTableDataToGltfAnimation(gltf, timeSeriesTableVec3, unitConversionToMeters, forcesDictionary)
    return gltf

def convertTableDataToGltfAnimation(gltfTop, timeSeriesTableVec3, conversionToMeters, dict) :
  "Take force data and convert into animations in gltf format" 
  "last argument is a dictionary that maps a force to a column index"
  "The code assumes the convention of a force_vec3 followed by force_pos3 next column"
  # Create an animations node under top level
  animation = Animation()
  gltfTop.animations.append(animation)
  # create two nodes one for samplers, the other for channel per Force
  numForces = len(dict.items())
  # create buffer, bufferview and  accessor for timeframes
  timeColumn = timeSeriesTableVec3.getIndependentColumn()
  timeSamplerIndex = len(gltfTop.accessors)
  os2Gltf.addTimeStampsAccessor(gltfTop, timeColumn)
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
    target.node = 1+forceIndex   # account for top level ForceData
    target.path = "translation"
    translationChannel.target = target
    animation.channels.append(translationChannel)
    # create accessor for data
    os2Gltf.addTranslationAccessor(gltfTop, timeSeriesTableVec3, dict[force]+1, conversionToMeters)
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
    target.node = 1+forceIndex
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
    target.node = 1+forceIndex
    target.path = "scale"
    scaleChannel.target = target
    animation.channels.append(scaleChannel)
    # create accessor for rotation data
    os2Gltf.addRSAccessors(gltfTop, timeSeriesTableVec3, dict[force], dict[force]+1, conversionToMeters)
    #
    forceIndex = forceIndex+1




def main():
    import argparse

    ## Input parsing.
    ## =============
    parser = argparse.ArgumentParser(
        description="Generate a gltf file corresponding to the passed in trc file.")
    # Required arguments.
    parser.add_argument('mot_file_path',
                        metavar='motfilepath', type=str,
                        help="filename for trc file (including path).")
    parser.add_argument('--shape', type=str,
                        help="Pick shape to use for displaying forces.")
    parser.add_argument('--output', type=str,
                        help="Write the result to this filepath. "
                             "Default: the report is named "
                             "<mot_file_path>.gltf")
    args = parser.parse_args()
    # print(args)
    infile = args.mot_file_path
    if (args.output == None) :
        outfile = infile.replace('.mot', '.gltf')
    else:
        outfile = args.output
    
    resultGltf = convertMotForce2Gltf(infile, args.shape)
    resultGltf.save(outfile)

main()