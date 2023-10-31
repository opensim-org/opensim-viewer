FROM stanfordnmbl/opensim-python:4.4

ARG FUNCTION_DIR="/viewerFunction"

# Install base utilities
RUN apt-get update \
    && apt-get install -y \
    build-essential \
    python3-dev \
    unzip \
    libcurl4-openssl-dev \
    libxrender1

RUN python3.8 -m pip install pygltflib
RUN python3.8 -m pip install vtk
RUN python3.8 -m pip install boto3
RUN python3.8 -m pip install requests

RUN mkdir -p ${FUNCTION_DIR}

# Allows docker to cache installed dependencies between builds
COPY osimConverters  ${FUNCTION_DIR}/osimConverters
COPY ./backend/Geometry ${FUNCTION_DIR}/osimConverters/Geometry
COPY ./backend/basicShapes.gltf  ${FUNCTION_DIR}/osimConverters
COPY ./backend/basicShapes.gltf  ${FUNCTION_DIR}
COPY ./lambda_function.py  ${FUNCTION_DIR}/lambda_function.py
COPY ./entrypoint  ${FUNCTION_DIR}/entrypoint
#COPY ./files /tmp

RUN python3.8 -m pip install awslambdaric

ADD https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie /usr/bin/aws-lambda-rie
RUN chmod +x /usr/bin/aws-lambda-rie

RUN chmod +x ${FUNCTION_DIR}/entrypoint

WORKDIR ${FUNCTION_DIR}

#ENTRYPOINT ["/usr/bin/aws-lambda-rie", "/usr/bin/python3.8", "-m", "awslambdaric"]
ENTRYPOINT ["/usr/bin/python3.8", "-m", "awslambdaric"]
CMD ["lambda_function.handler"]

