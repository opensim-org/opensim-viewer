from __future__ import print_function
import boto3
import json
import opensim as osim
import pygltflib
from osimConverters import *
import time, urllib
import json
from pathlib import Path

import requests
from urllib.parse import urlparse

"""Code snippet for copying the objects from AWS source S3 bucket to target S3 bucket as soon as objects uploaded on source S3 bucket
"""
s3 = boto3.client('s3')

def handler(event, context):
    print(event)
    print(context)

    if ("url" in event): #using API with passed in url in event
        source_url = event["url"]
        url_path = urlparse(source_url).path
        filename = os.path.basename(url_path)
        print("filename =", filename)
        # download the file from url into local tmp folder
        response = requests.get(source_url)
        print("response.status_code=", response.status_code)
        user_uuid = None
        if response.status_code == 200:
            file_name = os.path.join('/tmp', filename)
            print("file_name =", file_name)
            # Open the file in write mode
            with open(file_name, 'wb') as file:
                # Write the contents of the response to the file
                file.write(response.content)
            print("wrote contents to ", file_name)
    elif ("s3" in event):
        source_bucket = event["s3"]
        object_key = event["key"]
        print("Object Key: " + object_key)
        file_name = '/tmp/' + object_key.split('/')[-1]
        print("File Name: " + file_name)
        user_uuid = object_key.split('/')[-2]
        print("Attempting to download")
        s3.download_file(source_bucket, object_key, file_name)
    else : #invoked using s3 upload directly
        source_bucket = event['Records'][0]['s3']['bucket']['name']
        object_key = event['Records'][0]['s3']['object']['key']
        file_name = '/tmp/' + object_key.split('/')[-1]
        user_uuid = object_key.split('/')[-2]
        print("Attempting to download")
        s3.download_file(source_bucket, object_key, file_name)

    print("setup conversion function")
    target_bucket = 'opensim-viewer-public-download'
    print("file_name", file_name)
    osim.Logger.setLevelString('Off')
    # Construct urls for input, output files and call convertUserFileToGLTF
    try:
        print ("/tmp dirs:", os.listdir("/tmp"))
        print ("calling convertNativeFileToGLTF with:", file_name)
        gltfJson = convertNativeFileToGLTF(file_name)
        destinationFile = Path(file_name).with_suffix('.gltf')
        print ("output file", destinationFile)
        gltfJson.save(destinationFile)
        print("Gltf file saved")
        destinationFileName = Path(file_name).with_suffix('.gltf')
        if user_uuid:
            user_uuid = user_uuid + "/"
        else:
            user_uuid = ""
        strDestinationFileName = user_uuid + str(destinationFileName).split('/')[-1]
        print("Destination File Name: " + strDestinationFileName)
        # Create user folder if it does not exist
        user_folder_exists = s3.list_objects_v2(Bucket=target_bucket, Prefix=user_uuid).get('Contents')
        print("User folder exists: " + user_folder_exists)
        if not user_folder_exists:
            # If the folder doesn't exist, create it
            s3.put_object(Bucket=target_bucket, Key=user_uuid)
            user_folder_exists = s3.list_objects_v2(Bucket=target_bucket, Prefix=user_uuid).get('Contents')
            print("User folder exists after creation: " + user_folder_exists)

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
