from .models import *
from rest_framework import serializers
from django.db import transaction
import base64
# from PIL import Image


from django.db import transaction
from rest_framework import serializers
from .models import Users

class UsersSerializer(serializers.ModelSerializer):
    # Explicitly map or ensure user_code is clearly exposed and treated as the identifier
    class Meta:
        model = Users
        fields = '__all__'
        
class CountriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Countries
        fields = '__all__'
        
class StatesSerializer(serializers.ModelSerializer):
    class Meta:
        model = States
        fields = '__all__'
        
class DistrictsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Districts
        fields = '__all__'
        
class LocationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locations
        fields = '__all__'
        

# Farmer Profile
class FarmerProfilesSerializer(serializers.ModelSerializer):
    display_profile_photo = serializers.SerializerMethodField()
    
    user_code = serializers.SlugRelatedField(
        slug_field='user_code',
        queryset=Users.objects.all(),
        allow_null=True, required=False
    )
    country_code = serializers.SlugRelatedField(
        slug_field='country_code',
        queryset=Countries.objects.all(),
        allow_null=True, required=False
    )
    state_code = serializers.SlugRelatedField(
        slug_field='state_code',
        queryset=States.objects.all(),
        allow_null=True, required=False
    )
    district_code = serializers.SlugRelatedField(
        slug_field='district_code',
        queryset=Districts.objects.all(),
        allow_null=True, required=False
    )
    location_code = serializers.SlugRelatedField(
        slug_field='location_code',
        queryset=Locations.objects.all(),
        allow_null=True, required=False
    )

    class Meta:
        model = FarmerProfiles
        fields = [
            'farmer_code', 'user_code', 'profile_photo', 'display_profile_photo',
            'farm_name', 'address1', 'address2', 'landmark', 'country_code',
            'state_code', 'district_code', 'location_code', 'pincode',  
            'latitude', 'longitude', 'farm_size', 'farm_size_unit', 'status',
            'createdon', 'createdby', 'updatedon', 'updatedby'
        ]
        read_only_fields = ['farmer_code', 'createdby', 'createdon', 'updatedby', 'updatedon']

    def to_internal_value(self, data):
        # Convert empty strings coming from FormData into None so DRF doesn't throw validation errors
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        nullable_fields = [
            'user_code', 'country_code', 'state_code', 'district_code', 'location_code',
            'latitude', 'longitude', 'farm_size', 'farm_name', 'address1', 'address2', 
            'landmark', 'pincode', 'farm_size_unit'
        ]
        
        for field in nullable_fields:
            if field in mutable_data and (mutable_data[field] == '' or mutable_data[field] == 'null' or mutable_data[field] is None):
                mutable_data[field] = None
                
        return super().to_internal_value(mutable_data)

    def create(self, validated_data):
        # Handle binary photo file conversion if uploaded
        request = self.context.get('request')
        if request and 'profile_photo' in request.FILES:
            uploaded_file = request.FILES['profile_photo']
            validated_data['profile_photo'] = uploaded_file.read()

        with transaction.atomic():
            last_profile = FarmerProfiles.objects.select_for_update().order_by('farmer_code').last()
            
            if not last_profile or not last_profile.farmer_code:
                new_num = 1
            else:
                try:
                    last_id_numeric = last_profile.farmer_code.replace("FARMER", "").replace("FAR", "")
                    new_num = int(last_id_numeric) + 1
                except (ValueError, TypeError):
                    new_num = 1
            
            validated_data['farmer_code'] = f"FARMER{new_num:06d}"
            return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and 'profile_photo' in request.FILES:
            uploaded_file = request.FILES['profile_photo']
            validated_data['profile_photo'] = uploaded_file.read()
        return super().update(instance, validated_data)
    
    def get_display_profile_photo(self, obj):
        if obj.profile_photo:
            try:
                # If it's already a string or data uri
                if isinstance(obj.profile_photo, str):
                    if obj.profile_photo.startswith("data:image"):
                        return obj.profile_photo
                    return f"data:image/jpeg;base64,{obj.profile_photo}"
                
                # If it's binary bytes stored in MySQL BinaryField
                import base64
                binary_data = bytes(obj.profile_photo)
                encoded_str = base64.b64encode(binary_data).decode('utf-8')
                return f"data:image/jpeg;base64,{encoded_str}"
            except Exception:
                return None
        return None
    
    
# Equiment Category

     
class EquipmentCategoriesSerializer(serializers.ModelSerializer):  
    class Meta:
        model = EquipmentCategories
        fields = "__all__"
        read_only_fields = [
            'category_code', 
            'createdon', 
            'createdby', 
            'updatedon', 
            'updatedby'
        ]

    def create(self, validated_data):
        with transaction.atomic():
            # Use order_by('id') for a reliable chronological last record
            last_record = EquipmentCategories.objects.select_for_update().order_by('id').last()
            
            if not last_record or not last_record.category_code:
                new_num = 1
            else:
                try:
                    # Extracts number from 'EQPTCAT001' -> 1, then increments
                    last_id_numeric = last_record.category_code.replace("EQPTCAT", "")
                    new_num = int(last_id_numeric) + 1
                except (ValueError, TypeError):
                    new_num = 1
            
            # Formats to EQPTCAT + 3 digits (e.g., EQPTCAT001)
            validated_data['category_code'] = f"EQPTCAT{new_num:03d}"
            
            return super().create(validated_data)