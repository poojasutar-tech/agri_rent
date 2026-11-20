from django.db import models

# Create your models here.


class Users(models.Model):
    user_code = models.CharField(unique=True, max_length=45)
    full_name = models.CharField(max_length=150)
    email = models.CharField(unique=True, max_length=150)
    mobile = models.CharField(unique=True, max_length=20)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=6)
    status = models.IntegerField(db_comment='1=>Active, 2=>Inactive, 3=>Blocked')
    email_verified = models.IntegerField()
    mobile_verified = models.IntegerField()
    last_login = models.DateTimeField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'

class EngineModule(models.Model):
    module_code = models.CharField(unique=True, max_length=20)
    module_name = models.CharField(max_length=60, blank=True, null=True)
    url = models.CharField(max_length=60, blank=True, null=True)
    icon = models.CharField(max_length=1000, blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'engine_module'


class Permissions(models.Model):
    role = models.CharField(max_length=6)
    module_code = models.ForeignKey(EngineModule, models.DO_NOTHING, db_column='module_code', to_field='module_code')
    e_read = models.IntegerField()
    e_write = models.IntegerField()
    e_update = models.IntegerField()
    e_delete = models.IntegerField()
    status = models.IntegerField(blank=True, null=True, db_comment='1=Active, 0=Inactive')
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'permissions'


class Settings(models.Model):
    setting_id = models.IntegerField(blank=True, null=True)
    setting_name = models.CharField(max_length=100, blank=True, null=True)
    module_code = models.ForeignKey(EngineModule, models.DO_NOTHING, db_column='module_code', to_field='module_code', blank=True, null=True)
    setting_value = models.CharField(max_length=45, blank=True, null=True)
    setting_value2 = models.CharField(max_length=255, blank=True, null=True)
    used_for = models.CharField(max_length=100, blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'settings'


class Countries(models.Model):
    country_code = models.CharField(unique=True, max_length=45)
    country_name = models.CharField(unique=True, max_length=255)
    sort_order = models.IntegerField(blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'countries'


class States(models.Model):
    state_code = models.CharField(unique=True, max_length=45)
    country_code = models.ForeignKey(Countries, models.DO_NOTHING, db_column='country_code', to_field='country_code')
    state_name = models.CharField(max_length=255)
    sort_order = models.IntegerField(blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'states'

class Districts(models.Model):
    district_code = models.CharField(unique=True, max_length=45)
    state_code = models.ForeignKey('States', models.DO_NOTHING, db_column='state_code', to_field='state_code')
    district_name = models.CharField(max_length=255)
    sort_order = models.IntegerField(blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'districts'


class Locations(models.Model):
    location_code = models.CharField(unique=True, max_length=45)
    district_code = models.ForeignKey('Districts', models.DO_NOTHING, db_column='district_code', to_field='district_code')
    location_name = models.CharField(max_length=150)
    location_type = models.CharField(max_length=7)
    sort_order = models.IntegerField(blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'locations'
        
 
class FarmerProfiles(models.Model):
    farmer_code = models.CharField(unique=True, max_length=45)
    user_code = models.OneToOneField('Users', models.DO_NOTHING, db_column='user_code', to_field='user_code')
    profile_photo = models.BinaryField(blank=True, null=True)
    farm_name = models.CharField(max_length=150, blank=True, null=True)
    address1 = models.CharField(max_length=255, blank=True, null=True)
    address2 = models.CharField(max_length=255, blank=True, null=True)
    landmark = models.CharField(max_length=150, blank=True, null=True)
    country_code = models.ForeignKey('Countries', models.DO_NOTHING, db_column='country_code', to_field='country_code')
    state_code = models.ForeignKey('States', models.DO_NOTHING, db_column='state_code', to_field='state_code', blank=True, null=True)
    district_code = models.ForeignKey('Districts', models.DO_NOTHING, db_column='district_code', to_field='district_code', blank=True, null=True)
    location_code = models.ForeignKey('Locations', models.DO_NOTHING, db_column='location_code', to_field='location_code', blank=True, null=True)
    pincode = models.CharField(max_length=15, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    farm_size = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    farm_size_unit = models.CharField(max_length=20, blank=True, null=True)
    status = models.IntegerField(db_comment='1=>Active, 2=>Inactive')
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'farmer_profiles'


class EquipmentCategories(models.Model):
    category_code = models.CharField(unique=True, max_length=45)
    category_name = models.CharField(unique=True, max_length=150)
    description = models.TextField(blank=True, null=True)
    category_image = models.BinaryField(blank=True, null=True)
    status = models.IntegerField(db_comment='1=>Active, 2=>Inactive')
    sort_order = models.IntegerField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'equipment_categories'


class Equipment(models.Model):
    equipment_code = models.CharField(unique=True, max_length=45)
    farmer_code = models.ForeignKey(FarmerProfiles, models.DO_NOTHING, db_column='farmer_code', to_field='farmer_code')
    category_code = models.ForeignKey(EquipmentCategories, models.DO_NOTHING, db_column='category_code', to_field='category_code')
    equipment_name = models.CharField(max_length=150)
    equipment_image = models.BinaryField(blank=True, null=True)
    brand = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    manufacturing_year = models.TextField(blank=True, null=True)  # This field type is a guess.
    description = models.TextField(blank=True, null=True)
    condition_type = models.CharField(max_length=12, blank=True, null=True)
    rental_price_per_hour = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    rental_price_per_day = models.DecimalField(max_digits=12, decimal_places=2)
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    availability_status = models.CharField(max_length=11, blank=True, null=True)
    location_address = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    status = models.IntegerField(db_comment='1=>Active, 2=>Inactive, 3=>Rejected')
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'equipment'


class EquipmentImages(models.Model):
    equipment_code = models.ForeignKey(Equipment, models.DO_NOTHING, db_column='equipment_code', to_field='equipment_code')
    image_path = models.BinaryField(blank=True, null=True)
    sort_order = models.IntegerField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'equipment_images'
        
class Bookings(models.Model):
    booking_code = models.CharField(unique=True, max_length=45)
    equipment_code = models.ForeignKey('Equipment', models.DO_NOTHING, db_column='equipment_code', to_field='equipment_code')
    farmer_code = models.ForeignKey('FarmerProfiles', models.DO_NOTHING, db_column='farmer_code', to_field='farmer_code')
    booking_date = models.DateTimeField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    rental_duration = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    rental_duration_unit = models.CharField(max_length=4, blank=True, null=True)
    rental_amount = models.DecimalField(max_digits=12, decimal_places=2)
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    delivery_charge = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    delivery_address = models.CharField(max_length=255, blank=True, null=True)
    delivery_latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    delivery_longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    booking_status = models.CharField(max_length=9, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'bookings'


class BookingStatusHistory(models.Model):
    booking_code = models.ForeignKey(Bookings, models.DO_NOTHING, db_column='booking_code', to_field='booking_code')
    old_status = models.CharField(max_length=30, blank=True, null=True)
    new_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey('Users', models.DO_NOTHING, db_column='changed_by', to_field='user_code', blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    changedon = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'booking_status_history'

class MaintenanceRecords(models.Model):
    maintenance_code = models.CharField(unique=True, max_length=45)
    equipment_code = models.ForeignKey('Equipment', models.DO_NOTHING, db_column='equipment_code', to_field='equipment_code')
    reported_by = models.ForeignKey('Users', models.DO_NOTHING, db_column='reported_by', to_field='user_code', blank=True, null=True)
    maintenance_type = models.CharField(max_length=10, blank=True, null=True)
    problem_description = models.TextField()
    maintenance_date = models.DateField(blank=True, null=True)
    completion_date = models.DateField(blank=True, null=True)
    maintenance_cost = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    maintenance_status = models.CharField(max_length=11, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'maintenance_records'


class Notifications(models.Model):
    notification_code = models.CharField(unique=True, max_length=45)
    user_code = models.ForeignKey('Users', models.DO_NOTHING, db_column='user_code', to_field='user_code')
    title = models.CharField(max_length=150)
    message = models.TextField()
    notification_type = models.CharField(max_length=7, blank=True, null=True)
    reference_id = models.IntegerField(blank=True, null=True)
    reference_type = models.CharField(max_length=50, blank=True, null=True)
    is_read = models.IntegerField()
    read_at = models.DateTimeField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'notifications'


class Payments(models.Model):
    payment_code = models.CharField(unique=True, max_length=45)
    booking_code = models.ForeignKey(Bookings, models.DO_NOTHING, db_column='booking_code', to_field='booking_code')
    farmer_code = models.ForeignKey('FarmerProfiles', models.DO_NOTHING, db_column='farmer_code', to_field='farmer_code')
    payment_gateway = models.CharField(max_length=50, blank=True, null=True)
    razorpay_order_id = models.CharField(unique=True, max_length=150, blank=True, null=True)
    razorpay_payment_id = models.CharField(unique=True, max_length=150, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    payment_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    payment_status = models.CharField(max_length=8, blank=True, null=True)
    transaction_date = models.DateTimeField(blank=True, null=True)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    refund_date = models.DateTimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'payments'


class Penalties(models.Model):
    penalty_code = models.CharField(unique=True, max_length=45)
    rental_code = models.ForeignKey('Rentals', models.DO_NOTHING, db_column='rental_code', to_field='rental_code')
    farmer_code = models.ForeignKey('FarmerProfiles', models.DO_NOTHING, db_column='farmer_code', to_field='farmer_code')
    penalty_type = models.CharField(max_length=11)
    penalty_description = models.TextField(blank=True, null=True)
    penalty_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(max_length=7, blank=True, null=True)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    paid_date = models.DateTimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'penalties'


class Rentals(models.Model):
    rental_code = models.CharField(unique=True, max_length=45)
    booking_code = models.OneToOneField(Bookings, models.DO_NOTHING, db_column='booking_code')
    equipment_code = models.ForeignKey('Equipment', models.DO_NOTHING, db_column='equipment_code', to_field='equipment_code')
    farmer_code = models.ForeignKey('FarmerProfiles', models.DO_NOTHING, db_column='farmer_code', to_field='farmer_code')
    actual_start_date = models.DateTimeField(blank=True, null=True)
    expected_return_date = models.DateTimeField()
    actual_return_date = models.DateTimeField(blank=True, null=True)
    rental_status = models.CharField(max_length=16, blank=True, null=True)
    equipment_condition_before = models.TextField(blank=True, null=True)
    equipment_condition_after = models.TextField(blank=True, null=True)
    handover_remarks = models.TextField(blank=True, null=True)
    return_remarks = models.TextField(blank=True, null=True)
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'rentals'


class Reviews(models.Model):
    review_code = models.CharField(unique=True, max_length=45)
    booking_code = models.OneToOneField(Bookings, models.DO_NOTHING, db_column='booking_code',to_field='booking_code')
    equipment_code = models.ForeignKey('Equipment', models.DO_NOTHING, db_column='equipment_code', to_field='equipment_code')
    farmer_code = models.ForeignKey('FarmerProfiles', models.DO_NOTHING, db_column='farmer_code', to_field='farmer_code')
    rating = models.IntegerField()
    review_comment = models.TextField(blank=True, null=True)
    status = models.IntegerField(db_comment='1=>Published, 2=>Hidden')
    createdon = models.DateTimeField(blank=True, null=True)
    createdby = models.IntegerField(blank=True, null=True)
    updatedon = models.DateTimeField(blank=True, null=True)
    updatedby = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'reviews'