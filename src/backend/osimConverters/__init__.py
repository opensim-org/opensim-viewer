from .openSimData2Gltf import *
from .convertTrc2Gltf import *
from .convertC3D2Gltf import *
from .convertMotForce2Gltf import *
from .convertOsim2Gltf import *
from .convertOsimZip2Gltf import *

def convertNativeFileToGLTF(inFilePathOrURL):
        filename, file_extension = os.path.splitext(inFilePathOrURL)
        if (file_extension==".trc"):
        #invoke converter on trc file, then generate url from path
            gltfJson = convertTrc2Gltf(inFilePathOrURL, 'sphere')
        elif (file_extension==".c3d"):
            gltfJson = convertC3D2Gltf(inFilePathOrURL, 'sphere')
             # gltfJson.save(outfile)
        elif (file_extension==".mot"):
            gltfJson = convertMotForce2Gltf(inFilePathOrURL, 'arrow')
             # gltfJson.save(outfile)
        elif (file_extension==".osim"):
            gltfJson = convertOsim2Gltf(inFilePathOrURL, 'Geometry')
            # gltfJson.save(outfile)
        elif (file_extension==".osimz"):
            gltfJson = convertOsimZip2Gltf(inFilePathOrURL)

        return gltfJson
        
