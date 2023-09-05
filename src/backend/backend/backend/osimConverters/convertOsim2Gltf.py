
import opensim as osim
import numpy as np
import base64
import math
import os.path as pathmethods

from openSimData2Gltf import *
from DecorativeGeometryImplementationGltf import DecorativeGeometryImplementationGltf

def convertOsim2Gltf(osimModelFilePath, geometrySearchPath) :

  path = Path(osimModelFilePath)

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

  # Now cycle through all frames and add attached geometry/artifacts by calling generateDecorations
  mdh = model.getDisplayHints();
  mdh.set_show_frames(True);
  mcList = model.getComponentsList();
  adg = osim.ArrayDecorativeGeometry()
  for comp in mcList:
    sizeBefore = adg.size()
    comp.generateDecorations(True, mdh, state, adg);
    sizeAfter = adg.size()
    if (sizeAfter > sizeBefore):
      decorativeGeometryImp.setCurrentComponent(comp)
    for dg_index  in range(sizeBefore, sizeAfter):
      adg.at(dg_index).implementGeometry(decorativeGeometryImp)

  modelGltf = decorativeGeometryImp.get_GLTF()
  
  outfile = osimModelFilePath.replace('.osim', '.gltf')
  modelGltf.save(outfile)




def main():
    import argparse

    ## Input parsing.
    ## =============
    parser = argparse.ArgumentParser(
        description="Generate a gltf file corresponding to the passed in osim file.")
    # Required arguments.
    parser.add_argument('osim_file_path',
                        metavar='osimfilepath', type=str,
                        help="filename for model file (including path).")
    parser.add_argument('--output', type=str,
                        help="Write the result to this filepath. "
                             "Default: the report is named "
                             "<osim_file_path>.gltf")
    args = parser.parse_args()
    # print(args)
    infile = args.osim_file_path
    if (args.output == None) :
        outfile = infile.replace('.osim', '.gltf')
    else:
        outfile = args.output
    
    resultGltf = convertOsim2Gltf(infile, "")
    # resultGltf.save(outfile)

main()




