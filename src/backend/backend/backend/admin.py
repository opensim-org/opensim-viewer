from django.contrib import admin
from .models import Model, User


# Register your models here.
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_filter = ('username',)
    list_display = ('username', 'email', 'last_login')
    fields = ('username',
              'email',
              'password',
              'first_name',
              'last_name',)


@admin.register(Model)
class ModelAdmin(admin.ModelAdmin):
    list_filter = ('name', 'owner',)
    list_display = ('name', 'description', 'owner', 'license')
    fields = ('name',
              'description',
              'owner',
              'authors',
              'model_gltf_file',
              'link',
              'license',
              'license_link')
