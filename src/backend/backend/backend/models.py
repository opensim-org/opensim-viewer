from django.db import models
from django.contrib.auth.models import AbstractUser
import os


# Create your models here.
class User(AbstractUser):
    class Meta:
        ordering = ['username']

    def __str__(self):
        return self.username

def custom_upload_function(instance, filename): 
    return os.path.join('model_files', str(instance.id), filename)

class Model(models.Model):
    name = models.CharField(max_length=64, blank=False, null=False)
    description = models.CharField(max_length=256, blank=False, null=False)
    owner = models.ForeignKey(User, blank=False, null=False, on_delete=models.CASCADE)
    authors = models.CharField(max_length=256, blank=False, null=False)
    model_gltf_file = models.FileField(upload_to=custom_upload_function, default='pendulum.gltf')
    link = models.CharField(max_length=256, blank=True, null=False)
    license = models.CharField(max_length=256, blank=True, null=False)
    license_link = models.CharField(max_length=256, blank=True, null=False)
    class Meta:
        unique_together = ['name', 'owner']  # There cannot be an owner with two elements with the same name.
        ordering = ['id']

    def __str__(self):
        return self.name+':'+str(self.id)


