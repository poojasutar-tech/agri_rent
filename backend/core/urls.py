from django.urls import path

from .views import *
from .api_views import *


urlpatterns = [
    
    path('api/', getRoutes),
    
    path("api/admin-login/", LoginView.as_view(), name="admin-login"),
    path("api/admin-register/", RegisterView.as_view(), name="admin-register"),
    
    
    
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', LoginView.as_view(), name='auth_login'),
    
    path('api/users/', UsersListView.as_view(), name='users-list'),
    path('api/users/create/', UsersCreateView.as_view(), name='users-create'),
    path('api/users/update/<str:user_code>/', UsersUpdateView.as_view(), name='users-update'),
    path('api/users/delete/<str:user_code>/', UsersDeleteView.as_view(), name='users-delete'),
    
    path('api/countries/', CountriesListView.as_view(), name='countries-list'),
    path('api/countries/create/', CountriesCreateView.as_view(), name='countries-create'),  
    path('api/countries/update/<str:country_code>/', CountriesUpdateView.as_view(), name='countries-update'),
    path('api/countries/delete/<str:country_code>/', CountriesDeleteView.as_view(), name='countries-delete'),
    
    path('api/states/', StatesListView.as_view(), name='states-list'),
    path('api/states/create/', StatesCreateView.as_view(), name='states-create'),
    path('api/states/update/<str:state_code>/', StatesUpdateView.as_view(), name='states-update'),
    path('api/states/delete/<str:state_code>/', StatesDeleteView.as_view(), name='states-delete'),

    path('api/districts/', DistrictsListView.as_view(), name='districts-list'),
    path('api/districts/create/', DistrictsCreateView.as_view(), name='districts-create'),
    path('api/districts/update/<str:district_code>/', DistrictsUpdateView.as_view(), name='districts-update'),
    path('api/districts/delete/<str:district_code>/', DistrictsDeleteView.as_view(), name='districts-delete'),

    path('api/locations/', LocationsListView.as_view(), name='locations-list'),
    path('api/locations/create/', LocationsCreateView.as_view(), name='locations-create'),
    path('api/locations/update/<str:location_code>/', LocationsUpdateView.as_view(), name='locations-update'),
    path('api/locations/delete/<str:location_code>/', LocationsDeleteView.as_view(), name='locations-delete'),
    
        
    path('api/farmer_profiles/', FarmerProfilesListView.as_view(), name='farmer_profiles-list'),
    path('api/farmer_profiles/create/', FarmerProfilesCreateView.as_view(), name='farmer_profiles-create'),
    path('api/farmer_profiles/update/<str:farmer_code>/', FarmerProfilesUpdateView.as_view(), name='farmer_profiles-update'),
    path('api/farmer_profiles/delete/<str:farmer_code>/', FarmerProfilesDeleteView.as_view(), name='farmer_profiles-delete'),
    
    path('api/equipment_categories/', EquipmentCategoriesListView.as_view(), name='equipment_categories-list'),
    path('api/equipment_categories/create/', EquipmentCategoriesCreateView.as_view(), name='equipment_categories-create'),
    path('api/equipment_categories/update/<str:category_code>/', EquipmentCategoriesUpdateView.as_view(), name='equipment_categories-update'),
    path('api/equipment_categories/delete/<str:category_code>/', EquipmentCategoriesDeleteView.as_view(), name='equipment_categories-delete'),

    
    path('api/equipment/', EquipmentListView.as_view(), name='equipment-list'),
    path('api/equipment/create/', EquipmentCreateView.as_view(), name='equipment-create'),
    path('api/equipment/update/<str:equipment_code>/', EquipmentUpdateView.as_view(), name='equipment-update'),
    path('api/equipment/delete/<str:equipment_code>/', EquipmentDeleteView.as_view(), name='equipment-delete'),
]