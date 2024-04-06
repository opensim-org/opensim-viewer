*Requisites:** Conda and python installed.

1. To develop/update backend you have to have aws permissions/access so you can build a docker image and uploaded on aws. Typically the steps to make changes and push them are as follows:
1. Modify/test the python code in osimConverters folder (these are the utilities that take OpenSim native formats and convert to gltf format)
2. Build docker image using the command
   "docker build -t opensim-viewer/converter ."
3. Push the image to aws using the push commands on this page:
   https://us-west-2.console.aws.amazon.com/ecr/repositories/private/660440363484/opensim-viewer/converter?region=us-west-2
4. Wire the lambda function that does the work to use the latest/uploaded image, ECR repository is here
   https://us-west-2.console.aws.amazon.com/ecr/repositories/private/660440363484/opensim-viewer/converter?region=us-west-2
   and you select the image to run (for the lambda function opensim-viewer-func) on this page
   https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/opensim-viewer-func?tab=image
   select image -> Deploy new image -> select repository opensim-viewer/converter then select from drop down

Description of specific python files in osimConverters:
------------------------------------------------------
- openSimData2Gltf.py: gneric utilities that take columns of data and time stamps and create the corresponding Accessors in the passed in GLTF2 structure
- convert{xxx}2Gltf.py: Utilities for converting files with extension {xxx} to gltf, the convention is to produce a file with the same name but with different extension, unless an output file is specified
 