FROM public.ecr.aws/lambda/python:3.9


# Install base utilities
RUN yum update -y \
    && yum install -y wget \
    && yum install -y libX11 \
    && yum -y install mesa-libGL \
    && yum clean all

# Install miniconda
ENV CONDA_DIR /opt/conda
RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh && \
    /bin/bash ~/miniconda.sh -b -p /opt/conda

# Put conda in path so we can use conda activate
ENV PATH=$CONDA_DIR/bin:$PATH

RUN conda update -n base -c defaults conda

# Allows docker to cache installed dependencies between builds
COPY environment_aws.yml ${LAMBDA_TASK_ROOT}
WORKDIR ${LAMBDA_TASK_ROOT}

RUN conda env create -f environment_aws.yml


SHELL ["conda", "run", "-n", "osv_bend", "/bin/bash", "-c"]

# Demonstrate the environment is activated:
RUN echo "Make sure osim, vtk, pygltflib are installed:"
RUN python -c "import opensim"
RUN python -c "import vtk"
RUN python -c "import pygltflib"

# Mounts the application code to the image
COPY osimConverters ${LAMBDA_TASK_ROOT}/osimConverters
COPY lambda_function.py ${LAMBDA_TASK_ROOT}
# RUN python -c "import lambda_function; lambda_function.handler()"


# EXPOSE 8000

# RUN python backend/manage.py makemigrations
# RUN python backend/manage.py migrate
# RUN echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('ayman12345', 'ahabib@stanford.edu', 'ayman12345')" | python backend/manage.py shell

# run in conda env osv_bend
WORKDIR ${LAMBDA_TASK_ROOT}
ENTRYPOINT ["conda", "run", "--no-capture-output", "-n", "osv_bend", "python"]
CMD ["lambda_function.py"]
