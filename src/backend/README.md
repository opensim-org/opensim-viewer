*Requisites:** Conda and python installed.

1. Create environment using the `environment.yml` file:

   `conda env create -f environment.yml`

2. Activate environment:

   `conda activate opensim-viewer-bend`

3. Start server:

   `python manage.py runserver`

### Instructions for database migration

   1. Create migration files:

      `python manage.py makemigrations`

   2. Migrate the database (warning: data can be lost)

      `python manage.py migrate`

### Instructions for recreating ERD diagram

Instructions in this [Link](https://www.wplogout.com/export-database-diagrams-erd-from-django/).

### Instructions for localization

Instructions in this [Link](https://docs.djangoproject.com/en/4.2/topics/i18n/translation/).

Inside of backend app folder:

1. Create files for a language:

   `django-admin makemessages -l <language-code>`

2. Compile messages:

   `django-admin compilemessages`

### Instruction for testing

- Execute all tests:

   `python manage.py test --verbosity=0`
   
   
General
-------
- This folder contains scripts to convert OpenSim based data files into gltf format
- We use third party library pygltflib to manipulate the gltf structure thus avoiding low level json file manipulation and encoding/decoding whenever possible.

Description of specific python files:
-------------------------------------
- openSimData2Gltf.py: gneric utilities that take columns of data and time stamps and create the corresponding Accessors in the passed in GLTF2 structure
- convert{xxx}2Gltf.py: Utilities for converting files with extension {xxx} to gltf, the convention is to produce a file with the same name but with different extension, unless an output file is specified
 