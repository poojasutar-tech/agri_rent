from .models import *
from rest_framework import serializers
from django.db import transaction
import base64
# from PIL import Image


from django.db import transaction
from rest_framework import serializers
from .models import Users
from .booking_helpers import latest_payment, money

class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = '__all__'
        
class EngineModuleSerializer(serializers.ModelSerializer):  
    class Meta:
        model = EngineModule
        fields = "__all__"
        
class SettingsSerializer(serializers.ModelSerializer):  
    class Meta:
        model = Settings
        fields = "__all__"
        
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
    
    farmer_name = serializers.CharField(
        source='user_code.full_name', read_only=True, allow_null=True
    )
    
    user_code = serializers.SlugRelatedField(
        slug_field='user_code',
        queryset=Users.objects.all(),
        
    )
    country_code = serializers.SlugRelatedField(
        slug_field='country_code',
        queryset=Countries.objects.all(),
        
    )
    state_code = serializers.SlugRelatedField(
        slug_field='state_code',
        queryset=States.objects.all(),
        
    )
    district_code = serializers.SlugRelatedField(
        slug_field='district_code',
        queryset=Districts.objects.all(),
        
    )
    location_code = serializers.SlugRelatedField(
        slug_field='location_code',
        queryset=Locations.objects.all(),
        
    )

    class Meta:
        model = FarmerProfiles
        fields = [
            'farmer_code', 'user_code','farmer_name', 'profile_photo', 'display_profile_photo',
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
    # Base64 data-URI used by the frontend to display the image
    display_category_image = serializers.SerializerMethodField()

    class Meta:
        model = EquipmentCategories
        # Explicit list: the raw BinaryField is NOT exposed (it would double the
        # payload); the image is returned only through display_category_image.
        fields = [
            'category_code', 'category_name', 'description',
            'display_category_image', 'sort_order', 'status',
            'createdon', 'createdby', 'updatedon', 'updatedby',
        ]
        read_only_fields = [
            'category_code', 'createdon', 'createdby', 'updatedon', 'updatedby',
        ]

    def to_internal_value(self, data):
        # FormData sends empty values as '' -> convert to None so that
        # IntegerField / nullable fields don't raise validation errors.
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)

        for field in ['description', 'sort_order']:
            if field in mutable_data and mutable_data[field] in ('', 'null', None):
                mutable_data[field] = None

        return super().to_internal_value(mutable_data)

    def _read_uploaded_image(self, validated_data):
        request = self.context.get('request')
        if request and 'category_image' in request.FILES:
            validated_data['category_image'] = request.FILES['category_image'].read()

    def create(self, validated_data):
        self._read_uploaded_image(validated_data)

        with transaction.atomic():
            last_record = (
                EquipmentCategories.objects.select_for_update().order_by('id').last()
            )

            if not last_record or not last_record.category_code:
                new_num = 1
            else:
                try:
                    new_num = int(last_record.category_code.replace("EQPTCAT", "")) + 1
                except (ValueError, TypeError):
                    new_num = 1

            validated_data['category_code'] = f"EQPTCAT{new_num:03d}"
            return super().create(validated_data)

    def update(self, instance, validated_data):
        self._read_uploaded_image(validated_data)
        return super().update(instance, validated_data)

    def get_display_category_image(self, obj):
        if not obj.category_image:
            return None
        try:
            if isinstance(obj.category_image, str):
                if obj.category_image.startswith("data:image"):
                    return obj.category_image
                return f"data:image/jpeg;base64,{obj.category_image}"

            encoded = base64.b64encode(bytes(obj.category_image)).decode('utf-8')
            return f"data:image/jpeg;base64,{encoded}"
        except Exception:
            return None
        
# Equipments
from rest_framework import serializers
from django.db import transaction
from .models import Equipment, FarmerProfiles, EquipmentCategories

class EquipmentSerializer(serializers.ModelSerializer):
    display_equipment_image = serializers.SerializerMethodField()
    
    farmer_name = serializers.CharField(
    source='farmer_code.user_code.full_name', read_only=True, allow_null=True
    )

    farmer_code = serializers.SlugRelatedField(
        slug_field='farmer_code',
        queryset=FarmerProfiles.objects.all(),
        
    )
    category_code = serializers.SlugRelatedField(
        slug_field='category_code',
        queryset=EquipmentCategories.objects.all(),
        
    )

    class Meta:
        model = Equipment
        fields = [
            'equipment_code', 'farmer_code', 'farmer_name', 'category_code', 'equipment_name',
            'equipment_image', 'display_equipment_image', 'brand', 'model',
            'manufacturing_year', 'description', 'condition_type',
            'rental_price_per_hour', 'rental_price_per_day', 'security_deposit',
            'availability_status', 'location_address', 'latitude', 'longitude',
            'status', 'createdon', 'createdby', 'updatedon', 'updatedby'
        ]
        read_only_fields = ['equipment_code', 'createdby', 'createdon', 'updatedby', 'updatedon']

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        nullable_fields = [
            'farmer_code', 'category_code', 'equipment_name', 'brand', 'model',
            'manufacturing_year', 'description', 'condition_type',
            'rental_price_per_hour', 'rental_price_per_day', 'security_deposit',
            'availability_status', 'location_address', 'latitude', 'longitude'
        ]
        
        for field in nullable_fields:
            if field in mutable_data and (mutable_data[field] == '' or mutable_data[field] == 'null' or mutable_data[field] is None):
                mutable_data[field] = None
                
        return super().to_internal_value(mutable_data)

    def create(self, validated_data):
        request = self.context.get('request')
        if request and 'equipment_image' in request.FILES:
            uploaded_file = request.FILES['equipment_image']
            validated_data['equipment_image'] = uploaded_file.read()

        with transaction.atomic():
            last_equipment = Equipment.objects.select_for_update().order_by('equipment_code').last()
            
            if not last_equipment or not last_equipment.equipment_code:
                new_num = 1
            else:
                try:
                    last_id_numeric = last_equipment.equipment_code.replace("EQUIP", "").replace("EQ", "")
                    new_num = int(last_id_numeric) + 1
                except (ValueError, TypeError):
                    new_num = 1
            
            validated_data['equipment_code'] = f"EQ{new_num:06d}"
            return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and 'equipment_image' in request.FILES:
            uploaded_file = request.FILES['equipment_image']
            validated_data['equipment_image'] = uploaded_file.read()
        return super().update(instance, validated_data)

    def get_display_equipment_image(self, obj):
        if obj.equipment_image:
            try:
                if isinstance(obj.equipment_image, str):
                    if obj.equipment_image.startswith("data:image"):
                        return obj.equipment_image
                    return f"data:image/jpeg;base64,{obj.equipment_image}"
                
                import base64
                binary_data = bytes(obj.equipment_image)
                encoded_str = base64.b64encode(binary_data).decode('utf-8')
                return f"data:image/jpeg;base64,{encoded_str}"
            except Exception:
                return None
        return None



# Booking and payment

class BookingsSerializer(serializers.ModelSerializer):
    equipment_code = serializers.SlugRelatedField(slug_field='equipment_code', read_only=True)
    farmer_code = serializers.SlugRelatedField(slug_field='farmer_code', read_only=True)
    equipment_name = serializers.CharField(source='equipment_code.equipment_name', read_only=True)
    farmer_name = serializers.CharField(source='farmer_code.user_code.full_name', read_only=True)
    owner_user_code = serializers.CharField(
        source='equipment_code.farmer_code.user_code_id',
        read_only=True,
    )
    renter_user_code = serializers.CharField(
        source='farmer_code.user_code_id',
        read_only=True,
    )

    # derived fields (no extra DB columns needed)
    platform_fee = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    payment_gateway = serializers.SerializerMethodField()

    class Meta:
        model = Bookings
        fields = [
            'booking_code', 'equipment_code', 'equipment_name', 'farmer_code', 'farmer_name',
            'owner_user_code', 'renter_user_code',
            'booking_date', 'start_date', 'end_date',
            'rental_duration', 'rental_duration_unit',
            'rental_amount', 'security_deposit', 'delivery_charge', 'platform_fee', 'total_amount',
            'delivery_address', 'booking_status', 'remarks',
            'payment_status', 'payment_gateway',
            'createdon', 'updatedon',
        ]

    def get_platform_fee(self, obj):
        # total = rental + deposit + delivery + fee   ->   fee = what is left over
        fee = obj.total_amount - obj.rental_amount - (obj.security_deposit or 0) - (obj.delivery_charge or 0)
        return str(money(fee))

    def get_payment_status(self, obj):
        payment = latest_payment(obj)
        return payment.payment_status if payment else None

    def get_payment_gateway(self, obj):
        payment = latest_payment(obj)
        return payment.payment_gateway if payment else None


class PaymentsSerializer(serializers.ModelSerializer):
    booking_code = serializers.SlugRelatedField(slug_field='booking_code', read_only=True)
    farmer_code = serializers.SlugRelatedField(slug_field='farmer_code', read_only=True)

    class Meta:
        model = Payments
        # razorpay_signature is intentionally NOT exposed
        fields = [
            'payment_code', 'booking_code', 'farmer_code', 'payment_gateway',
            'razorpay_order_id', 'razorpay_payment_id', 'payment_amount',
            'payment_method', 'payment_status', 'transaction_date',
            'refund_amount', 'refund_date', 'remarks', 'createdon',
        ]


class ReviewsSerializer(serializers.ModelSerializer):
    booking_code = serializers.SlugRelatedField(slug_field='booking_code', read_only=True)
    equipment_code = serializers.SlugRelatedField(slug_field='equipment_code', read_only=True)
    farmer_code = serializers.SlugRelatedField(slug_field='farmer_code', read_only=True)
    farmer_name = serializers.CharField(source='farmer_code.user_code.full_name', read_only=True)

    class Meta:
        model = Reviews
        fields = [
            'review_code', 'booking_code', 'equipment_code', 'farmer_code', 'farmer_name',
            'rating', 'review_comment', 'status', 'createdon',
        ]