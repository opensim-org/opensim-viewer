from .openSimData2Gltf import *
from .convertTrc2Gltf import *
from .convertC3D2Gltf import *
from .convertMotForce2Gltf import *
from .convertOsim2Gltf import *
from .convertOsimZip2Gltf import *

def convertNativeFileToGLTF(inFilePathOrURL):
        filename, file_extension = os.path.splitext(inFilePathOrURL)

        if (file_extension==".trc" or ".trc." in inFilePathOrURL):
        #invoke converter on trc file, then generate url from path
            gltfJson = convertTrc2Gltf(inFilePathOrURL, 'sphere')
        elif (file_extension==".c3d" or ".c3d." in inFilePathOrURL):
            gltfJson = convertC3D2Gltf(inFilePathOrURL, 'sphere')
             # gltfJson.save(outfile)
        elif (file_extension==".mot" or ".mot." in inFilePathOrURL):
            gltfJson = convertMotForce2Gltf(inFilePathOrURL, 'arrow')
             # gltfJson.save(outfile)
        elif (file_extension==".osim" or ".osim." in inFilePathOrURL):
            gltfJson = convertOsim2Gltf(inFilePathOrURL, 'Geometry')
            # gltfJson.save(outfile)
        elif (file_extension==".osimz" or ".osimz." in inFilePathOrURL):
            gltfJson = convertOsimZip2Gltf(inFilePathOrURL)

        return gltfJson
        
