from django.urls import path

from .views import *
from .api_views import *


urlpatterns = [
    
    path('api/', getRoutes),
    
    path('api/admin-login/', AdminLoginView.as_view(), name='admin-login'),
    path('api/admin-register/', AdminRegisterView.as_view(), name='admin-register'),
        
    
    
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', LoginView.as_view(), name='auth_login'),
    
    path('api/users/', UsersListView.as_view(), name='users-list'),
    path('api/users/create/', UsersCreateView.as_view(), name='users-create'),
    path('api/users/update/<str:user_code>/', UsersUpdateView.as_view(), name='users-update'),
    path('api/users/delete/<str:user_code>/', UsersDeleteView.as_view(), name='users-delete'),
    
    path('api/routes/', FrontendRoutesView.as_view(), name='frontend-routes'),
    
    path("api/engine-module/", EngineModuleListView.as_view()),
    path("api/engine-module/create/", EngineModuleCreateView.as_view()),
    path("api/engine-module/<str:module_code>/", EngineModuleDetailView.as_view()),
    path("api/engine-module/update/<str:module_code>/", EngineModuleUpdateView.as_view()),
    path("api/engine-module/delete/<str:module_code>/", EngineModuleDeleteView.as_view()),

    
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
    
    
    path('api/bookings/', BookingsListView.as_view(), name='bookings-list'),
    path('api/bookings/create/', BookingsCreateView.as_view(), name='bookings-create'),
    path('api/bookings/detail/<str:booking_code>/', BookingsDetailView.as_view(), name='bookings-detail'),
    path('api/bookings/status/<str:booking_code>/', BookingStatusUpdateView.as_view(), name='bookings-status'),

       
    path('api/payment_statuses/', PaymentStatusMasterListView.as_view(), name='payment-status-list'),
    path('api/payment_statuses/create/', PaymentStatusMasterCreateView.as_view(), name='payment-status-create'),
    path('api/payment_statuses/<str:payment_status_code>/', PaymentStatusMasterDetailView.as_view(), name='payment-status-detail'),
    path('api/payment_statuses/<str:payment_status_code>/update/', PaymentStatusMasterUpdateView.as_view(), name='payment-status-update'),
    path('api/payment_statuses/<str:payment_status_code>/delete/', PaymentStatusMasterDeleteView.as_view(), name='payment-status-delete'),
        
    path('api/payment_modes/', PaymentModeMasterListView.as_view(), name='payment-mode-list'),
    path('api/payment_modes/create/', PaymentModeMasterCreateView.as_view(), name='payment-mode-create'),
    path('api/payment_modes/<str:payment_mode_code>/', PaymentModeMasterDetailView.as_view(), name='payment-mode-detail'),
    path('api/payment_modes/update/<str:payment_mode_code>/', PaymentModeMasterUpdateView.as_view(), name='payment-mode-update'),
    path('api/payment_modes/delete/<str:payment_mode_code>/', PaymentModeMasterDeleteView.as_view(), name='payment-mode-delete'),
    


    path('api/payments/cash/', EquipmentCashPaymentView.as_view(), name='payment-cash'),
    path('api/payments/cash/confirm/<str:booking_code>/', EquipmentCashConfirmView.as_view(), name='payment-cash-confirm'),
    path('api/payments/razorpay/create-order/', RazorpayCreateOrderView.as_view(), name='payment-razorpay-create-order'),
    path('api/payments/razorpay/verify/', RazorpayVerifyView.as_view(), name='payment-razorpay-verify'),
    path('api/payments/razorpay/failed/', RazorpayFailedView.as_view(), name='payment-razorpay-failed'),
    path('api/payments/status/<str:booking_code>/', BookingPaymentStatusView.as_view(), name='payment-status'),


    # path('api/payments/razorpay/create-order/', RazorpayCreateOrderView.as_view(), name='razorpay-create-order'),
    # path('api/payments/razorpay/verify/', RazorpayVerifyView.as_view(), name='razorpay-verify'),
    # path('api/payments/cash/', CashPaymentView.as_view(), name='payments-cash'),
    # path('api/payments/cash/confirm/<str:booking_code>/', CashPaymentConfirmView.as_view(), name='payments-cash-confirm'),


    path("api/maintenance-records/", MaintenanceRecordListView.as_view(), name="maintenance-record-list"),
    path("api/maintenance-records/create/", MaintenanceRecordCreateView.as_view(), name="maintenance-record-create"),
    path("api/maintenance-records/update/<str:maintenance_code>/", MaintenanceRecordUpdateView.as_view(), name="maintenance-record-update"),
    path("api/maintenance-records/delete/<str:maintenance_code>/", MaintenanceRecordDeleteView.as_view(), name="maintenance-record-delete"),

    path("api/notifications/", NotificationListView.as_view(), name="notification-list"),
    path("api/notifications/create/", NotificationCreateView.as_view(), name="notification-create"),
    path("api/notifications/update/<str:notification_code>/", NotificationUpdateView.as_view(), name="notification-update"),
    path("api/notifications/delete/<str:notification_code>/", NotificationDeleteView.as_view(), name="notification-delete"),

    path("api/payments/", PaymentListView.as_view(), name="payment-list"),
    path("api/payments/create/", PaymentCreateView.as_view(), name="payment-create"),
    path("api/payments/update/<str:payment_code>/", PaymentUpdateView.as_view(), name="payment-update"),
    path("api/payments/delete/<str:payment_code>/", PaymentDeleteView.as_view(), name="payment-delete"),

    path("api/penalties/", PenaltyListView.as_view(), name="penalty-list"),
    path("api/penalties/create/", PenaltyCreateView.as_view(), name="penalty-create"),
    path("api/penalties/update/<str:penalty_code>/", PenaltyUpdateView.as_view(), name="penalty-update"),
    path("api/penalties/delete/<str:penalty_code>/", PenaltyDeleteView.as_view(), name="penalty-delete"),

    path("api/rentals/", RentalListView.as_view(), name="rental-list"),
    path("api/rentals/create/", RentalCreateView.as_view(), name="rental-create"),
    path("api/rentals/update/<str:rental_code>/", RentalUpdateView.as_view(), name="rental-update"),
    path("api/rentals/delete/<str:rental_code>/", RentalDeleteView.as_view(), name="rental-delete"),

    path('api/reviews/', ReviewsListView.as_view(), name='reviews-list'),
    path('api/reviews/create/', ReviewsCreateView.as_view(), name='reviews-create'),
    path('api/reviews/<str:review_code>/', ReviewsDetailView.as_view(), name='reviews-detail'),
    path('api/reviews/update/<str:review_code>/', ReviewsUpdateView.as_view(), name='reviews-update'),
    path('api/reviews/delete/<str:review_code>/', ReviewsDeleteView.as_view(), name='reviews-delete'),
    
    
    
]