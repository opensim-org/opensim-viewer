
import opensim as osim
from pygltflib import *
import numpy as np
import base64
import math
from pathlib import Path

from .openSimData2Gltf import *
from .DecorativeGeometryImplementationGltf import DecorativeGeometryImplementationGltf

def convertOsim2Gltf(osimModelFilePath, geometrySearchPath, motionPaths=[], options=None, startingGltf=None) :

  path = Path(osimModelFilePath)
  osim.ModelVisualizer.addDirToGeometrySearchPaths(geometrySearchPath)
  # fallback to stock meshes
  dir_path = os.path.dirname(os.path.realpath(__file__))
  osim.ModelVisualizer.addDirToGeometrySearchPaths(os.path.join(dir_path,'Geometry'))

  if not path.exists():
      raise NotADirectoryError("Unable to find file ", path.absolute())

  model = osim.Model(osimModelFilePath)
  state = model.initSystem()

  if (startingGltf == None):
    gltfInstance = initGltf()
  else:
     gltfInstance = startingGltf
  # create a DecorativeGeometryImplementationGltf instance then iterate through
  # the model querying each component to "render" to the GLTF 
  decorativeGeometryImp = DecorativeGeometryImplementationGltf();
  decorativeGeometryImp.init()
  decorativeGeometryImp.setGltf(gltfInstance)
  decorativeGeometryImp.setState(state)
  decorativeGeometryImp.setDisplayHints(model.getDisplayHints())

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
    if (comp.getConcreteClassName()=="GeometryPath"):
        if (options is not None and options.getShowMuscles()):
          # Process GeometryPath, create nodes/meshes for path points and mesh/skin as needed
          decorativeGeometryImp.createGLTFObjectsForGeometryPath(comp)
    else:
        comp.generateDecorations(False, mdh, state, adg);
        sizeAfter = adg.size()
        if (sizeAfter > sizeBefore):
          # decorativeGeometryImp is a low level translator that has no access to names
          # or to the fact that it's translating a decorative geometry that could be a part
          # of a component. To workaround that, without changing the interface, we introduce
          # setCurrentComponent and call setDecorativeGeometryIndex so that geometry has unique 
          # name/ID/context and can share common material
          decorativeGeometryImp.setCurrentComponent(comp)
          for dg_index  in range(sizeBefore, sizeAfter):
              decorativeGeometryImp.setDecorativeGeometryIndex(dg_index)
              adg.at(dg_index).implementGeometry(decorativeGeometryImp)


  for motIndex in range(len(motionPaths)):
    fileExists = Path(motionPaths[motIndex]).exists()
    motStorage = osim.Storage(motionPaths[motIndex])
    if (motStorage.isInDegrees()):
      model.getSimbodyEngine().convertDegreesToRadians(motStorage)
    decorativeGeometryImp.createAnimationForStateTimeSeries(motStorage, motIndex)
  # mot files typically have name 'Coordinate' which causes problems to viewer if not unique
  decorativeGeometryImp.makeAnimationNamesUnique(motionPaths);

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




