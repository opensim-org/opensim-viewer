
import opensim as osim
from pygltflib import *
import numpy as np
import base64
import math
from pathlib import Path

from .openSimData2Gltf import *
from .DecorativeGeometryImplementationGltf import DecorativeGeometryImplementationGltf

def convertOsim2Gltf(osimModelFilePath, geometrySearchPath, motionPaths=[]) :

  path = Path(osimModelFilePath)
  osim.ModelVisualizer.addDirToGeometrySearchPaths(geometrySearchPath)
  # fallback to stock meshes
  osim.ModelVisualizer.addDirToGeometrySearchPaths('Geometry')
  osim.ModelVisualizer.addDirToGeometrySearchPaths('osimConverters/Geometry')

  if not path.exists():
      raise NotADirectoryError("Unable to find file ", path.absolute())

  model = osim.Model(osimModelFilePath)
  state = model.initSystem()

  gltfInstance = initGltf()
  # create a DecorativeGeometryImplementationGltf instance then iterate through
  # the model querying each component to "render" to the GLTF 
  decorativeGeometryImp = DecorativeGeometryImplementationGltf();
  decorativeGeometryImp.setGltf(gltfInstance)
  decorativeGeometryImp.setState(state)

  # create Group nodes for toplevel, ground, bodies and all frames
  decorativeGeometryImp.addModelNode(model); 
  decorativeGeometryImp.addGroundFrame(model.getGround()); 
  decorativeGeometryImp.addBodyFrames(model);
  decorativeGeometryImp.addDefaultMaterials();
  # Now cycle through all frames and add attached geometry/artifacts by calling generateDecorations
  mdh = model.getDisplayHints();
  mdh.set_show_frames(True);
  mcList = model.getComponentsList();
  adg = osim.ArrayDecorativeGeometry()
  for comp in mcList:
    sizeBefore = adg.size()
    # print(comp.getAbsolutePathString())
    comp.generateDecorations(True, mdh, state, adg);
    # we don't know how to handle muscles for now so will leave off, verify everything else displays ok
    if (comp.getConcreteClassName()!= "GeometryPath"):
      comp.generateDecorations(False, mdh, state, adg);
    sizeAfter = adg.size()
    if (sizeAfter > sizeBefore):
      decorativeGeometryImp.setCurrentComponent(comp)
    for dg_index  in range(sizeBefore, sizeAfter):
      adg.at(dg_index).implementGeometry(decorativeGeometryImp)

  for motIndex in range(len(motionPaths)):
    fileExists = Path(motionPaths[motIndex]).exists()
    motStorage = osim.Storage(motionPaths[motIndex])
    if (motStorage.isInDegrees()):
      model.getSimbodyEngine().convertDegreesToRadians(motStorage)
    decorativeGeometryImp.createAnimationForStateTimeSeries(motStorage)

  #find first rotational coordinate, create  a motion file varying it along 
  # its range and pass to decorativeGeometryImp to genrate corresponding animation
  # coords = model.getCoordinateSet()
  # coordinateSliderStorage = osim.Storage()
  # coordinateSliderStorage.setInDegrees(False)
  # for  cIndex in range(coords.getSize()): 
      # coordObj = coords.get(cIndex)
      # moType = coordObj.getMotionType() # want Rotational = 1
      # coordMin = coordObj.getRangeMin()
      # coordMax = coordObj.getRangeMax()
      # if (moType == 1):
      #   table_time = 2 # 2 sec animation
      #   labels = osim.ArrayStr()
      #   labels.append("time")
      #   labels.append(coordObj.getStateVariableNames().get(0))
      #   coordinateSliderStorage.setColumnLabels(labels)
      #   for sliderTime in np.arange(0, 2.1, 0.1):
      #     coordValue = coordMin + sliderTime/table_time *(coordMax - coordMin)
      #     row = osim.Vector(1, coordValue)
      #     coordinateSliderStorage.append(sliderTime, row)

      #  break
  # decorativeGeometryImp.createAnimationForStateTimeSeries(coordinateSliderStorage)

  # decorativeGeometryImp.createAnimationForStateTimeSeries(coordinateSliderStorage)

  modelGltf = decorativeGeometryImp.get_GLTF()
  
  return modelGltf




# def main():
#     import argparse

#     ## Input parsing.
#     ## =============
#     parser = argparse.ArgumentParser(
#         description="Generate a gltf file corresponding to the passed in osim file.")
#     # Required arguments.
#     parser.add_argument('osim_file_path',
#                         metavar='osimfilepath', type=str,
#                         help="filename for model file (including path).")
#     parser.add_argument('--output', type=str,
#                         help="Write the result to this filepath. "
#                              "Default: the report is named "
#                              "<osim_file_path>.gltf")
#     args = parser.parse_args()
#     # print(args)
#     infile = args.osim_file_path
#     if (args.output == None) :
#         outfile = infile.replace('.osim', '.gltf')
#     else:
#         outfile = args.output
    
#     resultGltf = convertOsim2Gltf(infile, "")
#     # resultGltf.save(outfile)

# main()




