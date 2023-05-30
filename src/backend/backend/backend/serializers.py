from .models import User, Model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator


class UserCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(validators=[UniqueValidator(queryset=User.objects.all())], allow_null=False,
                                     allow_blank=False)
    email = serializers.EmailField(validators=[UniqueValidator(queryset=User.objects.all())], allow_null=False,
                                   allow_blank=False)
    password = serializers.CharField(min_length=8, allow_null=False, allow_blank=False)
    first_name = serializers.CharField(allow_null=False, allow_blank=False)
    last_name = serializers.CharField(allow_null=False, allow_blank=False)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )
        return user

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')


class ModelCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(validators=[UniqueValidator(queryset=Model.objects.all())], allow_null=False,
                                 allow_blank=False)
    description = serializers.CharField(allow_null=False, allow_blank=False)
    owner = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=False)
    authors = serializers.CharField(allow_null=False, allow_blank=False)
    model_gltf_file = serializers.FileField(allow_null=False)
    link = serializers.CharField(allow_null=False, allow_blank=False)
    license = serializers.CharField(allow_null=False, allow_blank=False)
    license_link = serializers.CharField(allow_null=False, allow_blank=False)

    def create(self, validated_data):
        model = Model.objects.create(
            name=validated_data['name'],
            description=validated_data['description'],
            owner=validated_data['owner'],
            authors=validated_data['authors'],
            model_gltf_file=validated_data['model_gltf_file'],
            link=validated_data['link'],
            license=validated_data['license'],
            license_link=validated_data['license_link'],
        )
        return model

    class Meta:
        model = Model
        fields = ('id', 'name', 'description', 'owner', 'authors', 'model_gltf_file', 'link', 'license', 'license_link')


class ModelRetrieveSerializer(serializers.ModelSerializer):
    name = serializers.PrimaryKeyRelatedField(queryset=Model.objects.all(), allow_null=False)

    class Meta:
        model = Model
        fields = ('name',)
