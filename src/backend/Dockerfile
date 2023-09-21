FROM python:3.9

# Allows docker to cache installed dependencies between builds
COPY environment_linux.yml environment_linux.yml

# Install base utilities
RUN apt-get update \
    && apt-get install -y build-essential \
    && apt-get install -y wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install miniconda
ENV CONDA_DIR /opt/conda
RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh && \
    /bin/bash ~/miniconda.sh -b -p /opt/conda

# Put conda in path so we can use conda activate
ENV PATH=$CONDA_DIR/bin:$PATH

RUN conda update -n base -c defaults conda

RUN conda env create -f environment_linux.yml

SHELL ["conda", "run", "-n", "osv_bend", "/bin/bash", "-c"]

# Demonstrate the environment is activated:
RUN echo "Make sure osim is installed:"
RUN python -c "import opensim"

# Mounts the application code to the image
COPY . code
WORKDIR /code

EXPOSE 8000

# runs the production server
ENTRYPOINT ["conda", "run", "-n", "osv_bend", "python", "backend/manage.py"]
CMD ["runserver", "0.0.0.0:8000"]
