from __future__ import print_function
import boto3
import json
import opensim as osim
import pygltflib
from osimConverters import *
import time, urllib
import json
from pathlib import Path
"""Code snippet for copying the objects from AWS source S3 bucket to target S3 bucket as soon as objects uploaded on source S3 bucket
"""
s3 = boto3.client('s3')

def handler(event, context):
    print(event)
    print(context)
    source_bucket = event['Records'][0]['s3']['bucket']['name']
    object_key = event['Records'][0]['s3']['object']['key']
    target_bucket = 'opensim-viewer-public-download'
    file_name = '/tmp/' + object_key.split('/')[-1]
    print("file_name", file_name)
    osim.Logger.setLevelString('Off')
    # Construct urls for input, output files and call convertUserFileToGLTF
    try:
        workFolder = "/tmp/"
        print("Attempting to download")
        s3.download_file(source_bucket, object_key, file_name)
        print ("/tmp dirs:", os.listdir("/tmp"))
        print ("calling convertNativeFileToGLTF with:", file_name)
        gltfJson = convertNativeFileToGLTF(file_name)
        destinationFile = Path(file_name).with_suffix('.gltf')
        print ("output file", destinationFile)
        gltfJson.save(destinationFile)
        print("Gltf file saved")
        destinationFileName = Path(file_name).with_suffix('.gltf')
        strDestinationFileName = str(destinationFileName).split('/')[-1]
        # print("DestinationFile string", strDestinationFileName)
        s3.upload_file(destinationFile, target_bucket, strDestinationFileName)
        # print("File upload launched")
        response = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': target_bucket,
                    'Key': strDestinationFileName },
            ExpiresIn=3600,
            HttpMethod='GET')
        # print("Gltf file uploaded to ", result_url)
        print("File upload finished, url returned", response)       # s3.copy_object(Bucket=target_bucket, Key=object_key, CopySource=copy_source)
        return {
        'statusCode': 200,
        'body': json.dumps(response, default=str)
        }
    except Exception as err:
        print ("Error -"+str(err))
        return err

def convertUserFileToGLTF(inFilePathOrURL, outFilePathOrURL):
    gltfJson = convertNativeFileToGLTF(inFilePathOrURL)
    gltfJson.save(outFilePathOrURL)


def main():
    print('main was called')

main()
