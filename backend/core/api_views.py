
from django.shortcuts import render
from django.http import JsonResponse
from .models import *
from .serializers import *
from rest_framework.permissions import AllowAny,IsAuthenticatedOrReadOnly
from rest_framework.views import APIView
from rest_framework.response import Response 
from rest_framework import status
from django.shortcuts import get_object_or_404   
from django.http import JsonResponse
# import razorpay
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import *
from .serializers import *
from django.utils import timezone
from django.shortcuts import get_object_or_404
# import re
# import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.utils import timezone

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from .models import Users
from .serializers import UsersSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status


from datetime import date, datetime, time
from decimal import Decimal

import razorpay
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .booking_helpers import (
    PLATFORM_FEE_PERCENT, MAX_RENTAL_DAYS,
    next_code, make_dt, money, razorpay_client, log_status, error, latest_payment,
    send_booking_email,
)
from .models import (
    Bookings, BookingStatusHistory, Payments, Reviews,
    Equipment, FarmerProfiles, Users,
)
from .serializers import BookingsSerializer, PaymentsSerializer, ReviewsSerializer

# admin login and register



class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username

        return token
    
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


@api_view(['GET'])
def getRoutes(request):
    routes = [
        '/api/token',
        '/api/token/refresh',
    ]

    return Response(routes)


class CredentialsProvidedPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method != "POST":
            return False
        username = request.data.get("username")
        password = request.data.get("password")
        return bool(username and password)


from django.db.models import Avg, Count, Q
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
import logging

logger = logging.getLogger(__name__)
class AdminLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # Prevents stale JWT headers from causing 401

    def post(self, request):
        login_id = request.data.get("username") or request.data.get("email")
        password = request.data.get("password")

        if not login_id or not password:
            return Response(
                {"error": "Username/Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = Users.objects.get(
                Q(email=login_id) | Q(user_code=login_id) | Q(mobile=login_id) | Q(full_name=login_id),
                status=1  # 1 = Active
            )
        except Users.DoesNotExist:
            return Response(
                {"error": "Admin account not found or inactive"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Users.MultipleObjectsReturned:
            return Response(
                {"error": "Multiple users found with this identifier. Please use email."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Restrict portal login strictly to ADMIN accounts
        if user.role != "ADMIN":
            return Response(
                {"error": "Access denied. Admin privileges required."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check encrypted password against password_hash
        if not check_password(password, user.password_hash):
            return Response(
                {"error": "Invalid password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Session Management
        request.session["user_id"] = user.id
        request.session["user_code"] = user.user_code
        request.session["role"] = user.role
        request.session["login_time"] = str(timezone.now())
        request.session.save()

        # Update Last Login
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        # JWT Token
        refresh = RefreshToken.for_user(user)

        # Permissions mapped by role and module_code
        permissions_response = {
            "modules": {}
        }

        if user.role:
            try:
                all_permissions = Permissions.objects.filter(role=user.role, status=1)

                for p in all_permissions:
                    perm_dict = {
                        "e_read": p.e_read,
                        "e_write": p.e_write,
                        "e_update": p.e_update,
                        "e_delete": p.e_delete
                    }
                    module_key = p.module_code.module_code if hasattr(p.module_code, 'module_code') else str(p.module_code)
                    permissions_response["modules"][module_key] = perm_dict

            except Exception as e:
                logger.error(f"Error fetching permissions: {str(e)}")

        domain = None
        try:
            domain_setting = Settings.objects.get(setting_name="domain")
            domain = domain_setting.setting_value
        except Exception:
            pass

        # Final Response (Matches AuthContext.jsx & AdminLoginPage)
        response_data = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user_code": user.user_code,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "permission_details": permissions_response,
            "domain": domain
        }

        return Response(response_data, status=status.HTTP_200_OK)


class AdminRegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # Prevents stale JWT headers from causing 401

    def post(self, request):
        data = request.data
        email = data.get("email")
        password = data.get("password")
        full_name = data.get("username") or data.get("full_name")
        mobile = data.get("mobile_no") or data.get("mobile") or "-"
        role = "ADMIN"  # Explicitly assign ADMIN role

        if not email or not password or not full_name:
            return Response(
                {"error": "Username, email, and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Users.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        if mobile != "-" and Users.objects.filter(mobile=mobile).exists():
            return Response({"error": "Mobile number already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique user_code
        last_user = Users.objects.order_by('-id').first()
        next_id = (last_user.id + 1) if last_user else 1
        user_code = f"USR-{next_id:04d}"

        try:
            user = Users.objects.create(
                user_code=user_code,
                full_name=full_name,
                email=email,
                mobile=mobile,
                password_hash=make_password(password),
                role=role,
                status=1,  # Active
                email_verified=0,
                mobile_verified=0,
                createdon=timezone.now()
            )
            user.createdby = user.id
            user.save(update_fields=["createdby"])

            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Admin registered successfully",
                "user_code": user.user_code,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Database Error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        
# Routes for engine module

import os
from pathlib import Path
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

class FrontendRoutesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Points to F:\agri_rent\frontend\app
        frontend_app_dir = Path(settings.BASE_DIR).parent / "frontend" / "app"
        routes = []

        if frontend_app_dir.exists():
            for root, dirs, files in os.walk(frontend_app_dir):
                # Skip internal Next.js folders or dynamic [id] folders if needed
                if "page.jsx" in files or "page.js" in files:
                    rel_path = os.path.relpath(root, frontend_app_dir).replace("\\", "/")
                    if rel_path == ".":
                        route_path = "/"
                        label = "Home"
                    else:
                        route_path = f"/{rel_path}"
                        # Format 'admin/engineModules' -> 'Admin - Engine Modules'
                        label = rel_path.split("/")[-1].replace("-", " ").replace("_", " ").title()

                    routes.append({
                        "label": label,
                        "path": route_path
                    })

        return Response({"routes": routes})

# Engine Module

from django.db import transaction, IntegrityError
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
# Make sure to import your CustomJWTAuthentication, SessionAuthentication, EngineModuleSerializer, etc.

class EngineModuleCreateView(APIView):


    def post(self, request):
        try:
            with transaction.atomic():
                data = request.data.copy()
                permissions_data = data.pop("permissions", {}) # Expected format: { "ADMIN": { "read": 1, "write": 1, ... }, "FARMER": { ... } }

                serializer = EngineModuleSerializer(data=data)
                if serializer.is_valid():
                    module = serializer.save(createdby=request.user.id)
                    
                    # Loop through roles and assign permissions
                    for role_name, perms in permissions_data.items():
                        Permissions.objects.create(
                            role=role_name,
                            module_code=module, # Assigns the EngineModule instance (mapped via module_code field)
                            e_read=1 if perms.get("read") or perms.get("e_read") else 0,
                            e_write=1 if perms.get("write") or perms.get("e_write") else 0,
                            e_update=1 if perms.get("update") or perms.get("e_update") else 0,
                            e_delete=1 if perms.get("delete") or perms.get("e_delete") else 0,
                            status=1
                        )

                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EngineModuleListView(APIView):


    def get(self, request):
        try:
            modules = EngineModule.objects.all().order_by('id')
            result = []

            for module in modules:
                module_data = EngineModuleSerializer(module).data

                # Fetch permissions for this module by module_code
                perms = Permissions.objects.filter(module_code=module.module_code)
                permissions_dict = {}

                for perm in perms:
                    permissions_dict[perm.role] = {
                        "read": perm.e_read == 1,
                        "write": perm.e_write == 1,
                        "update": perm.e_update == 1,
                        "delete": perm.e_delete == 1
                    }

                module_data['permissions'] = permissions_dict
                result.append(module_data)

            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
       

class EngineModuleDetailView(APIView):


    def get(self, request, module_code, format=None):
        module = get_object_or_404(EngineModule, module_code=module_code)
        module_data = EngineModuleSerializer(module).data

        # Fetch permissions for this module
        perms = Permissions.objects.filter(module_code=module.module_code)
        permissions_dict = {}

        for perm in perms:
            permissions_dict[perm.role] = {
                "read": perm.e_read == 1,
                "write": perm.e_write == 1,
                "update": perm.e_update == 1,
                "delete": perm.e_delete == 1
            }

        module_data['permissions'] = permissions_dict
        return Response(module_data, status=status.HTTP_200_OK)


class EngineModuleUpdateView(APIView):


    def put(self, request, module_code):
        try:
            with transaction.atomic():
                module = get_object_or_404(EngineModule, module_code=module_code)
                data = request.data.copy()
                permissions_provided = "permissions" in data
                permissions_data = data.pop("permissions", None)
                if permissions_provided and not isinstance(permissions_data, dict):
                    return Response(
                        {"error": "Permissions must be an object keyed by role."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                serializer = EngineModuleSerializer(module, data=data, partial=True)
                if serializer.is_valid():
                    serializer.save(
                        updatedby=request.user.id,
                        updatedon=timezone.now()
                    )

                    if permissions_provided:
                        Permissions.objects.filter(module_code=module.module_code).delete()

                        for role_name, perms in permissions_data.items():
                            Permissions.objects.create(
                                role=role_name,
                                module_code=module,
                                e_read=1 if perms.get("read") or perms.get("e_read") else 0,
                                e_write=1 if perms.get("write") or perms.get("e_write") else 0,
                                e_update=1 if perms.get("update") or perms.get("e_update") else 0,
                                e_delete=1 if perms.get("delete") or perms.get("e_delete") else 0,
                                status=1
                            )

                    return Response(serializer.data, status=status.HTTP_200_OK)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
 
class EngineModuleDeleteView(APIView):

 
    def delete(self, request, module_code):
        try:
            with transaction.atomic():
                module = get_object_or_404(EngineModule, module_code=module_code)
                Permissions.objects.filter(module_code=module_code).delete()
                Settings.objects.filter(module_code=module_code).delete()
                module.delete()
 
            return Response(status=status.HTTP_204_NO_CONTENT)
 
        except Http404:
            return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            return Response({"error": "Cannot delete module due to existing constraints or relations"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# User Login and Register

class UsersListView(APIView):
    def get(self, request):
        try:
            objs = Users.objects.all().order_by("user_code")
            serializer = UsersSerializer(objs, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UsersCreateView(APIView):
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        try:
            serializer = UsersSerializer(data=request.data, context={"request": request})
            
            if serializer.is_valid():
                user_id = request.user.id if request.user and request.user.is_authenticated else request.data.get('createdby')
                obj = serializer.save(
                    createdby=user_id,
                    createdon=timezone.now(),
                    status=request.data.get('status', 1),
                    email_verified=request.data.get('email_verified', 0),
                    mobile_verified=request.data.get('mobile_verified', 0)
                )
                return Response(
                    UsersSerializer(obj, context={"request": request}).data, 
                    status=status.HTTP_201_CREATED
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UsersUpdateView(APIView):
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def put(self, request, user_code):
        try:
            obj = get_object_or_404(Users, user_code=user_code)
            serializer = UsersSerializer(obj, data=request.data, partial=True, context={"request": request})
            
            if serializer.is_valid():
                user_id = request.user.id if request.user and request.user.is_authenticated else request.data.get('updatedby')
                instance = serializer.save(
                    updatedby=user_id,
                    updatedon=timezone.now()
                )
                return Response(
                    UsersSerializer(instance, context={"request": request}).data, 
                    status=status.HTTP_200_OK
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UsersDeleteView(APIView):
    def delete(self, request, user_code):
        try:
            obj = get_object_or_404(Users, user_code=user_code)
            obj.delete()
            return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# countries

class CountriesListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            data = Countries.objects.all().order_by('country_name')
            serializer = CountriesSerializer(data, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CountriesCreateView(APIView):


    def post(self, request):
        try:
            serializer = CountriesSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    createdby=request.user.id,
                    createdon=timezone.now(),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CountriesUpdateView(APIView):


    def put(self, request, country_code):
        try:
            obj = get_object_or_404(Countries, country_code=country_code)
            serializer = CountriesSerializer(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save(
                    updatedby=request.user.id,
                    updatedon=timezone.now()
                )
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CountriesDeleteView(APIView):


    def delete(self, request, country_code):
        try:
            obj = get_object_or_404(Countries, country_code=country_code)
            obj.delete()
            return Response(
                {"message": "Country deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
# states

class StatesListView(APIView):


    def get(self, request):
        try:
            objs = States.objects.all().order_by("state_code")
            serializer = StatesSerializer(objs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StatesCreateView(APIView):


    def post(self, request):
        try:
            serializer = StatesSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StatesUpdateView(APIView):


    def put(self, request, state_code):
        try:
            obj = get_object_or_404(States, state_code=state_code)
            serializer = StatesSerializer(obj, data=request.data, partial=True, context={"request": request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StatesDeleteView(APIView):


    def delete(self, request, state_code):
        try:
            obj = get_object_or_404(States, state_code=state_code)
            obj.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e), "trace": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# districts

class DistrictsListView(APIView):
    def get(self, request):
        try:
            objs = Districts.objects.all().order_by("district_code")
            serializer = DistrictsSerializer(objs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Added POST handling directly to the List view if preferred
    def post(self, request):
        try:
            serializer = DistrictsSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                serializer.save(createdon=timezone.now(), updatedon=timezone.now())
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DistrictsCreateView(APIView):


    def post(self, request):
        try:
            serializer = DistrictsSerializer(
                data=request.data,
                context={"request": request}
            )

            if serializer.is_valid():
                serializer.save(
                    createdon=timezone.now(),
                    updatedon=timezone.now()
                )
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
                )

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DistrictsUpdateView(APIView):


    def put(self, request, district_code):
        try:
            obj = get_object_or_404(
                Districts,
                district_code=district_code
            )

            serializer = DistrictsSerializer(
                obj,
                data=request.data,
                partial=True,
                context={"request": request}
            )

            if serializer.is_valid():
                serializer.save(updatedon=timezone.now())
                return Response(
                    serializer.data,
                    status=status.HTTP_200_OK
                )

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DistrictsDeleteView(APIView):


    def delete(self, request, district_code):
        try:
            obj = get_object_or_404(
                Districts,
                district_code=district_code
            )

            obj.delete()

            return Response(
                {"message": "District deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )

        except Exception as e:
            return Response(
                {
                    "error": str(e),
                    "trace": traceback.format_exc()
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# locations

class LocationsListView(APIView):
    def get(self, request):
        try:
            objs = Locations.objects.all().order_by("location_code")
            serializer = LocationsSerializer(objs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Added POST handling directly to the List view if preferred
    def post(self, request):
        try:
            serializer = LocationsSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class LocationsCreateView(APIView):

    def post(self, request):
        try:
            serializer = LocationsSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LocationsUpdateView(APIView):

    def put(self, request, location_code):
        try:
            obj = get_object_or_404(Locations, location_code=location_code)
            serializer = LocationsSerializer(obj, data=request.data, partial=True, context={"request": request})
            if serializer.is_valid():
                serializer.save(updatedon=timezone.now())
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LocationsDeleteView(APIView):

    def delete(self, request, location_code):
        try:
            obj = get_object_or_404(Locations, location_code=location_code)
            obj.delete()
            return Response({"message": "Location deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# Farmer Profiles 

# class FarmerProfilesListView(APIView):

#     def get(self, request):
#         try:
#             objs = FarmerProfiles.objects.all().order_by("farmer_code")
#             serializer = FarmerProfilesSerializer(objs, many=True)
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class FarmerProfilesCreateView(APIView):

#     def post(self, request):
#         try:
#             serializer = FarmerProfilesSerializer(data=request.data, context={"request": request})
#             if serializer.is_valid():
#                 serializer.save()
#                 return Response(serializer.data, status=status.HTTP_201_CREATED)
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class FarmerProfilesUpdateView(APIView):

#     def put(self, request, farmer_code):
#         try:
#             obj = get_object_or_404(FarmerProfiles, farmer_code=farmer_code)
#             serializer = FarmerProfilesSerializer(obj, data=request.data, partial=True, context={"request": request})
#             if serializer.is_valid():
#                 serializer.save(updatedon=timezone.now())
#                 return Response(serializer.data, status=status.HTTP_200_OK)
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class FarmerProfilesDeleteView(APIView):

#     def delete(self, request, farmer_code):
#         try:
#             obj = get_object_or_404(FarmerProfiles, farmer_code=farmer_code)
#             obj.delete()
#             return Response({"message": "Equipment Category deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
        
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import FarmerProfiles
from .serializers import FarmerProfilesSerializer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from .models import FarmerProfiles
from .serializers import FarmerProfilesSerializer

class FarmerProfilesListView(APIView):
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            objs = FarmerProfiles.objects.all().order_by("farmer_code")
            serializer = FarmerProfilesSerializer(objs, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FarmerProfilesCreateView(APIView):
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        try:
            # Pass context request so serializer can access request.FILES
            serializer = FarmerProfilesSerializer(data=request.data, context={"request": request})
            
            if serializer.is_valid():
                user_id = request.user.id if request.user and request.user.is_authenticated else request.data.get('createdby')
                obj = serializer.save(
                    createdby=user_id,
                    createdon=timezone.now(),
                    status=request.data.get('status', 1)
                )
                return Response(
                    FarmerProfilesSerializer(obj, context={"request": request}).data, 
                    status=status.HTTP_201_CREATED
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FarmerProfilesUpdateView(APIView):
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def put(self, request, farmer_code):
        try:
            obj = get_object_or_404(FarmerProfiles, farmer_code=farmer_code)
            # Pass context request so serializer can access request.FILES
            serializer = FarmerProfilesSerializer(obj, data=request.data, partial=True, context={"request": request})
            
            if serializer.is_valid():
                user_id = request.user.id if request.user and request.user.is_authenticated else request.data.get('updatedby')
                instance = serializer.save(
                    updatedby=user_id,
                    updatedon=timezone.now()
                )
                return Response(
                    FarmerProfilesSerializer(instance, context={"request": request}).data, 
                    status=status.HTTP_200_OK
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FarmerProfilesDeleteView(APIView):
    def delete(self, request, farmer_code):
        try:
            obj = get_object_or_404(FarmerProfiles, farmer_code=farmer_code)
            obj.delete()
            return Response({"message": "Farmer profile deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# equipment Categories


class EquipmentCategoriesListView(APIView):
    
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            objs = EquipmentCategories.objects.all().order_by("category_code")
            serializer = EquipmentCategoriesSerializer(
                objs, many=True, context={"request": request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EquipmentCategoriesCreateView(APIView):
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        try:
            serializer = EquipmentCategoriesSerializer(
                data=request.data, context={"request": request}
            )
            if serializer.is_valid():
                obj = serializer.save(
                    createdby=request.user.id if request.user.is_authenticated else None,
                    createdon=timezone.now(),
                )
                return Response(
                    EquipmentCategoriesSerializer(obj, context={"request": request}).data,
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EquipmentCategoriesUpdateView(APIView):
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def put(self, request, category_code):
        try:
            obj = get_object_or_404(EquipmentCategories, category_code=category_code)
            serializer = EquipmentCategoriesSerializer(
                obj, data=request.data, partial=True, context={"request": request}
            )
            if serializer.is_valid():
                instance = serializer.save(
                    updatedby=request.user.id if request.user.is_authenticated else None,
                    updatedon=timezone.now(),
                )
                return Response(
                    EquipmentCategoriesSerializer(instance, context={"request": request}).data,
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Http404:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EquipmentCategoriesDeleteView(APIView):

    def delete(self, request, category_code):
        try:
            obj = get_object_or_404(EquipmentCategories, category_code=category_code)
            obj.delete()
            return Response(
                {"message": "Equipment Category deleted successfully"},
                status=status.HTTP_200_OK,
            )
        except Http404:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# User Reg and login

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Q
from django.utils import timezone
from .models import Users

class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data
        email = data.get('email')
        mobile = data.get('mobile')
        country_code = data.get('country_code')
        password = data.get('password')

        if not all((data.get('full_name'), email, mobile, password, country_code)):
            return Response(
                {"error": "Name, email, mobile, password, and country are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        country = Countries.objects.filter(country_code=country_code, status=1).first()
        if not country:
            return Response({"error": "Select a valid country."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if email or mobile already exists
        if Users.objects.filter(email=email).exists():
            return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)
        if Users.objects.filter(mobile=mobile).exists():
            return Response({"error": "Mobile number already registered"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                count = Users.objects.count() + 1
                user_code = f"USR-{count:04d}"
                user = Users.objects.create(
                    user_code=user_code,
                    full_name=data.get('full_name'),
                    email=email,
                    mobile=mobile,
                    password_hash=make_password(password),
                    role='FARMER',
                    status=1,
                    email_verified=0,
                    mobile_verified=0,
                    createdon=timezone.now(),
                )
                user.createdby = user.id
                user.save(update_fields=['createdby'])

                last_profile = (
                    FarmerProfiles.objects.select_for_update()
                    .order_by('farmer_code')
                    .last()
                )
                try:
                    last_number = int(
                        last_profile.farmer_code.replace("FARMER", "").replace("FAR", "")
                    ) if last_profile else 0
                except (ValueError, TypeError):
                    last_number = 0
                farmer = FarmerProfiles.objects.create(
                    farmer_code=f"FARMER{last_number + 1:06d}",
                    user_code=user,
                    farm_name=(data.get('farm_name') or '').strip() or None,
                    country_code=country,
                    status=1,
                    createdon=timezone.now(),
                    createdby=user.id,
                )

            return Response({
                "message": "Registration successful!",
                "user_id": user.id,
                "user_code": user.user_code,
                "farmer_code": farmer.farmer_code,
                "role": user.role
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        identifier = request.data.get('email') # Can be email or mobile
        password = request.data.get('password')

        if not identifier or not password:
            return Response({"error": "Email/Mobile and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Users.objects.filter(Q(email=identifier) | Q(mobile=identifier)).first()

            if user and check_password(password, user.password_hash):
                if user.status != 1:
                    return Response({"error": "This account is inactive or blocked."}, status=status.HTTP_403_FORBIDDEN)

                refresh = RefreshToken.for_user(user)
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])

                return Response({
                    "message": "Login successful!",
                    "role": user.role,
                    "full_name": user.full_name,
                    "user_code": user.user_code,
                    "user_id": user.id,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid email/mobile or password."}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
        
# Equipments

from django.utils import timezone

class EquipmentListView(APIView):
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            objs = list(Equipment.objects.all().order_by("equipment_code"))
            serializer = EquipmentSerializer(objs, many=True, context={"request": request})
            equipment_data = list(serializer.data)
            occupied_codes = set(
                Bookings.objects.filter(
                    booking_status__in=['PENDING', 'CONFIRMED']
                ).values_list('equipment_code_id', flat=True)
            )
            ratings = {
                row['equipment_code_id']: row
                for row in Reviews.objects.filter(status=1)
                .values('equipment_code_id')
                .annotate(average_rating=Avg('rating'), review_count=Count('id'))
            }

            for equipment, item in zip(objs, equipment_data):
                current_status = equipment.availability_status or 'AVAILABLE'
                if current_status != 'MAINTENANCE':
                    item['availability_status'] = (
                        'OCCUPIED'
                        if equipment.equipment_code in occupied_codes
                        else 'AVAILABLE'
                    )

                rating = ratings.get(equipment.equipment_code, {})
                item['platform_fee_percent'] = str(PLATFORM_FEE_PERCENT)
                item['average_rating'] = (
                    round(float(rating['average_rating']), 1)
                    if rating.get('average_rating') is not None
                    else None
                )
                item['review_count'] = rating.get('review_count', 0)

            return Response(equipment_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EquipmentCreateView(APIView):
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        try:
            serializer = EquipmentSerializer(data=request.data, context={"request": request})
            
            if serializer.is_valid():
                user_id = request.user.id if request.user and request.user.is_authenticated else request.data.get('createdby')
                obj = serializer.save(
                    createdby=user_id,
                    createdon=timezone.now(),
                    status=request.data.get('status', 1)
                )
                return Response(
                    EquipmentSerializer(obj, context={"request": request}).data, 
                    status=status.HTTP_201_CREATED
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.http import Http404

class EquipmentUpdateView(APIView):
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def put(self, request, equipment_code):
        try:
            obj = get_object_or_404(Equipment, equipment_code=equipment_code)
            serializer = EquipmentSerializer(
                obj, data=request.data, partial=True, context={"request": request}
            )
            if serializer.is_valid():
                user_id = (
                    request.user.id
                    if request.user and request.user.is_authenticated
                    else request.data.get('updatedby')
                )
                instance = serializer.save(updatedby=user_id, updatedon=timezone.now())
                return Response(
                    EquipmentSerializer(instance, context={"request": request}).data,
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Http404:
            return Response({"error": "Equipment not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EquipmentDeleteView(APIView):
    def delete(self, request, equipment_code):
        try:
            obj = get_object_or_404(Equipment, equipment_code=equipment_code)
            obj.delete()
            return Response({"message": "Equipment deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 
        
        
        
        
        
        

# =====================================================================
#  BOOKING VIEWS
# =====================================================================
def _booking_queryset():
    return Bookings.objects.select_related(
        'equipment_code__farmer_code__user_code', 'farmer_code__user_code'
    )


class BookingsListView(APIView):
    """
    GET api/bookings/?user_code=USR001     -> bookings MADE by this user (renter)
    GET api/bookings/?owner_code=USR002    -> bookings for machines OWNED by this user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            qs = _booking_queryset().order_by('-id')
            user_code = request.query_params.get('user_code')
            owner_code = request.query_params.get('owner_code')
            actor_code = request.user.user_code
            if (user_code and user_code != actor_code) or (owner_code and owner_code != actor_code):
                if (request.user.role or '').upper() != 'ADMIN':
                    return error("You cannot view another user's bookings.", status.HTTP_403_FORBIDDEN)
            if user_code:
                qs = qs.filter(farmer_code__user_code=user_code)
            elif owner_code:
                qs = qs.filter(equipment_code__farmer_code__user_code=owner_code)
            elif (request.user.role or '').upper() != 'ADMIN':
                qs = qs.filter(farmer_code__user_code=actor_code)
            return Response(BookingsSerializer(qs, many=True).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingsDetailView(APIView):
    """GET api/bookings/detail/<booking_code>/?user_code=USR001   (renter or machine owner only)"""
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_code):
        booking = _booking_queryset().filter(booking_code=booking_code).first()
        if not booking:
            return error("Booking not found.", status.HTTP_404_NOT_FOUND)

        user_code = request.user.user_code
        renter = booking.farmer_code.user_code_id
        owner = booking.equipment_code.farmer_code.user_code_id
        if user_code not in (renter, owner) and (request.user.role or '').upper() != 'ADMIN':
            return error("You cannot view this booking.", status.HTTP_403_FORBIDDEN)

        return Response(BookingsSerializer(booking).data, status=status.HTTP_200_OK)


class BookingsCreateView(APIView):
    """
    POST api/bookings/create/
    body: { user_code, equipment_code, start_date, end_date, service_type, delivery_address, remarks }
    Dates are "YYYY-MM-DD" and INCLUSIVE (21 Oct -> 23 Oct = 3 days).
    Every amount is calculated HERE from the machine price - never trusted from the browser.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.data

            # ---- 1. dates ----
            try:
                start_day = datetime.strptime(str(data.get('start_date')), "%Y-%m-%d").date()
                end_day = datetime.strptime(str(data.get('end_date')), "%Y-%m-%d").date()
            except (TypeError, ValueError):
                return error("Valid start_date and end_date (YYYY-MM-DD) are required.")

            if start_day < timezone.localdate():
                return error("Start date cannot be in the past.")
            if end_day < start_day:
                return error("Return date cannot be before the start date.")
            days = (end_day - start_day).days + 1
            if days > MAX_RENTAL_DAYS:
                return error(f"You can rent for at most {MAX_RENTAL_DAYS} days.")

            # ---- 2. machine ----
            equipment = Equipment.objects.filter(
                equipment_code=data.get('equipment_code'), status=1
            ).first()
            if not equipment:
                return error("Equipment not found.", status.HTTP_404_NOT_FOUND)
            if equipment.availability_status == 'MAINTENANCE':
                return error("This machine is not available for booking.")

            # ---- 3. the renting farmer (looked up from the logged-in user_code) ----
            farmer = FarmerProfiles.objects.select_related('user_code').filter(
                user_code=request.user.user_code
            ).first()
            if not farmer:
                return error("No farmer profile found for this user.")
            if equipment.farmer_code_id == farmer.farmer_code:
                return error("You cannot book your own machine.")

            # ---- 4. amounts ----
            rental_amount = money(Decimal(equipment.rental_price_per_day) * days)
            security_deposit = money(equipment.security_deposit or 0)
            delivery_charge = money(0)  # no delivery price list yet
            platform_fee = money(rental_amount * PLATFORM_FEE_PERCENT / 100)
            total_amount = rental_amount + security_deposit + delivery_charge + platform_fee

            start_dt = make_dt(start_day, time.min)       # 00:00 on the first day
            end_dt = make_dt(end_day, time.max)           # end of the last day

            service_type = (data.get('service_type') or '').strip()
            notes = (data.get('remarks') or '').strip()
            remarks = (f"[{service_type}] {notes}").strip() if service_type else notes

            # ---- 5. save (lock the machine row so two people cannot take the same dates) ----
            with transaction.atomic():
                locked_equipment = Equipment.objects.select_for_update().get(
                    equipment_code=equipment.equipment_code
                )
                if locked_equipment.availability_status == 'MAINTENANCE':
                    return error("This machine is not available for booking.")

                clash = Bookings.objects.filter(
                    equipment_code=equipment,
                    booking_status__in=['PENDING', 'CONFIRMED'],
                    start_date__lt=end_dt,
                    end_date__gt=start_dt,
                ).exists()
                if clash:
                    return error("These dates are already booked. Please choose other dates.",
                                 status.HTTP_409_CONFLICT)

                booking = Bookings.objects.create(
                    booking_code=next_code(Bookings, 'booking_code', 'BK'),
                    equipment_code=equipment,
                    farmer_code=farmer,
                    booking_date=timezone.now(),
                    start_date=start_dt,
                    end_date=end_dt,
                    rental_duration=days,
                    rental_duration_unit='DAY',
                    rental_amount=rental_amount,
                    security_deposit=security_deposit,
                    delivery_charge=delivery_charge,
                    total_amount=total_amount,
                    delivery_address=(data.get('delivery_address') or '').strip() or None,
                    booking_status='PENDING',
                    remarks=remarks or None,
                    createdon=timezone.now(),
                    createdby=farmer.user_code.id,
                )
                log_status(booking, None, 'PENDING', 'Booking created', user=farmer.user_code)

            booking = _booking_queryset().get(pk=booking.pk)
            return Response(BookingsSerializer(booking).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BookingStatusUpdateView(APIView):
    """
    PUT api/bookings/status/<booking_code>/
    body: { user_code, status: CONFIRMED | REJECTED | CANCELLED | COMPLETED, remarks }

      Machine owner (or an ADMIN user): PENDING -> CONFIRMED / REJECTED / CANCELLED
                                        CONFIRMED -> COMPLETED / CANCELLED
      Renter:                           PENDING -> CANCELLED   (own booking only)

    REJECTED / CANCELLED automatically refunds an online (Razorpay) payment.
    COMPLETED marks a pending cash payment as SUCCESS (cash was collected).
    """
    permission_classes = [IsAuthenticated]

    ALLOWED = {
        'PENDING': ['CONFIRMED', 'REJECTED', 'CANCELLED'],
        'CONFIRMED': ['COMPLETED', 'CANCELLED'],
    }

    def put(self, request, booking_code):
        try:
            new_status = (request.data.get('status') or '').upper()
            remarks = request.data.get('remarks')

            booking = _booking_queryset().filter(booking_code=booking_code).first()
            if not booking:
                return error("Booking not found.", status.HTTP_404_NOT_FOUND)

            actor = request.user

            old_status = booking.booking_status
            if new_status not in self.ALLOWED.get(old_status, []):
                return error(f"A {old_status} booking cannot be changed to {new_status}.")

            is_admin = (actor.role or '').upper() == 'ADMIN'
            is_owner = booking.equipment_code.farmer_code.user_code_id == actor.user_code
            is_renter = booking.farmer_code.user_code_id == actor.user_code
            renter_cancelling = is_renter and old_status == 'PENDING' and new_status == 'CANCELLED'
            if not (is_admin or is_owner or renter_cancelling):
                return error("You are not allowed to do this.", status.HTTP_403_FORBIDDEN)

            if new_status == 'CONFIRMED' and not Payments.objects.filter(
                booking_code=booking,
            ).filter(
                Q(payment_gateway='CASH', payment_status__in=['PENDING', 'SUCCESS'])
                | Q(payment_gateway='RAZORPAY', payment_status='SUCCESS')
            ).exists():
                return error("Complete online payment or select cash before confirming this booking.")

            # ---- refund an online payment BEFORE touching our database ----
            paid_online = None
            if new_status in ('REJECTED', 'CANCELLED'):
                paid_online = Payments.objects.filter(
                    booking_code=booking, payment_gateway='RAZORPAY', payment_status='SUCCESS'
                ).first()
                if paid_online and paid_online.razorpay_payment_id:
                    try:
                        razorpay_client().payment.refund(
                            paid_online.razorpay_payment_id,
                            {"amount": int((paid_online.payment_amount * 100).to_integral_value())},
                        )
                    except Exception as refund_error:
                        return error(f"Refund failed, booking not changed: {refund_error}",
                                     status.HTTP_502_BAD_GATEWAY)

            with transaction.atomic():
                now = timezone.now()

                if paid_online:
                    paid_online.payment_status = 'REFUNDED'
                    paid_online.refund_amount = paid_online.payment_amount
                    paid_online.refund_date = now
                    paid_online.updatedon = now
                    paid_online.save()

                pending_cash = Payments.objects.filter(
                    booking_code=booking,
                    payment_gateway='CASH',
                    payment_status='PENDING',
                ).first()
                if new_status == 'COMPLETED' and pending_cash:
                    return error(
                        "Confirm that cash was received before completing this rental."
                    )

                if new_status in ('REJECTED', 'CANCELLED'):
                    Payments.objects.filter(
                        booking_code=booking,
                        payment_status='PENDING',
                    ).update(
                        payment_status='FAILED',
                        updatedon=now,
                        updatedby=actor.id,
                    )

                booking.booking_status = new_status
                booking.updatedon = now
                booking.updatedby = actor.id
                booking.save(update_fields=['booking_status', 'updatedon', 'updatedby'])
                log_status(booking, old_status, new_status, remarks or f"Status changed to {new_status}",
                           user=actor)

            response_data = BookingsSerializer(booking).data
            if new_status == 'CONFIRMED':
                response_data['confirmation_email_sent'] = send_booking_email(
                    booking,
                    f"Your Agrirent booking {booking.booking_code} is confirmed",
                    (
                        f"Hello {booking.farmer_code.user_code.full_name},\n\n"
                        f"Your booking for {booking.equipment_code.equipment_name} "
                        f"({booking.booking_code}) has been confirmed.\n"
                        f"Rental dates: {booking.start_date:%Y-%m-%d} to "
                        f"{booking.end_date:%Y-%m-%d}.\n\n"
                        "Thank you for using Agrirent."
                    ),
                )
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)









# Payment Statuses



class PaymentStatusMasterListView(APIView):
    def get(self, request):
        try:
            # Ordering by sort_order or status_name as appropriate for master data
            data = PaymentStatusMaster.objects.filter(status__gte=0).order_by('sort_order', 'status_name')
            serializer = PaymentStatusMasterSerializer(data, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PaymentStatusMasterDetailView(APIView):
    def get(self, request, payment_status_code):
        try:
            obj = get_object_or_404(PaymentStatusMaster, payment_status_code=payment_status_code)
            serializer = PaymentStatusMasterSerializer(obj)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PaymentStatusMasterCreateView(APIView):
    def post(self, request):
        try:
            serializer = PaymentStatusMasterSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    createdby=request.user.id if request.user.is_authenticated else None,
                    createdon=timezone.now(),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PaymentStatusMasterUpdateView(APIView):
    def put(self, request, payment_status_code):
        try:
            obj = get_object_or_404(PaymentStatusMaster, payment_status_code=payment_status_code)
            serializer = PaymentStatusMasterSerializer(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save(
                    updatedby=request.user.id if request.user.is_authenticated else None,
                    updatedon=timezone.now()
                )
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PaymentStatusMasterDeleteView(APIView):
    def delete(self, request, payment_status_code):
        try:
            obj = get_object_or_404(PaymentStatusMaster, payment_status_code=payment_status_code)
            obj.delete()
            return Response(
                {"message": "Payment status deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
# payment modes

class PaymentModeMasterListView(APIView):
    def get(self, request):
        try:
            data = PaymentModeMaster.objects.filter(status__gte=0).order_by('sort_order')
            serializer = PaymentModeMasterSerializer(data, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaymentModeMasterDetailView(APIView):
    def get(self, request, payment_mode_code):
        try:
            obj = get_object_or_404(PaymentModeMaster, payment_mode_code=payment_mode_code)
            serializer = PaymentModeMasterSerializer(obj)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaymentModeMasterCreateView(APIView):
    def post(self, request):
        try:
            serializer = PaymentModeMasterSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    createdby=request.user.id if request.user.is_authenticated else None,
                    createdon=timezone.now(),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaymentModeMasterUpdateView(APIView):
    def put(self, request, payment_mode_code):
        try:
            obj = get_object_or_404(PaymentModeMaster, payment_mode_code=payment_mode_code)
            serializer = PaymentModeMasterSerializer(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save(
                    updatedby=request.user.id if request.user.is_authenticated else None,
                    updatedon=timezone.now()
                )
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaymentModeMasterDeleteView(APIView):
    def delete(self, request, payment_mode_code):
        try:
            obj = get_object_or_404(PaymentModeMaster, payment_mode_code=payment_mode_code)
            obj.delete()
            return Response({"message": "Payment mode deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
        



# =====================================================================
#  PAYMENT VIEWS  (Razorpay online  +  Cash)
# =====================================================================

# def _get_payable_booking(booking_code, user_code, allow_successful_cash=False):
#     """
#     Returns (booking, error_response).
#     Payable bookings belong to this user and are still awaiting owner approval.
#     """
#     booking = _booking_queryset().filter(booking_code=booking_code).first()
#     if not booking:
#         return None, error("Booking not found.", status.HTTP_404_NOT_FOUND)
#     if booking.farmer_code.user_code_id != user_code:
#         return None, error("This is not your booking.", status.HTTP_403_FORBIDDEN)
#     if booking.booking_status != 'PENDING':
#         return None, error(f"This booking is already {booking.booking_status}.")
#     successful_payment = Payments.objects.filter(
#         booking_code=booking,
#         payment_status='SUCCESS',
#     ).order_by('-id').first()
#     if successful_payment and not (
#         allow_successful_cash and successful_payment.payment_gateway == 'CASH'
#     ):
#         return None, error("This booking is already paid.")
#     return booking, None


# class RazorpayCreateOrderView(APIView):
#     """POST api/payments/razorpay/create-order/   body: { booking_code, user_code }"""
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         try:
#             booking, err = _get_payable_booking(
#                 request.data.get('booking_code'), request.user.user_code
#             )
#             if err:
#                 return err

#             amount_paise = int((booking.total_amount * 100).to_integral_value())
#             with transaction.atomic():
#                 booking = Bookings.objects.select_for_update().get(pk=booking.pk)
#                 pending = Payments.objects.filter(
#                     booking_code=booking, payment_status='PENDING'
#                 ).first()
#                 if pending:
#                     if pending.payment_gateway == 'CASH':
#                         return error("Cash payment was already selected for this booking.")
#                     return Response({
#                         "order_id": pending.razorpay_order_id,
#                         "amount": amount_paise,
#                         "currency": "INR",
#                         "key_id": settings.RAZORPAY_KEY_ID,
#                     }, status=status.HTTP_200_OK)

#                 order = razorpay_client().order.create({
#                     "amount": amount_paise,
#                     "currency": "INR",
#                     "receipt": booking.booking_code,
#                     "payment_capture": 1,
#                 })
#                 Payments.objects.create(
#                     payment_code=next_code(Payments, 'payment_code', 'PAY'),
#                     booking_code=booking,
#                     farmer_code=booking.farmer_code,
#                     payment_gateway='RAZORPAY',
#                     razorpay_order_id=order['id'],
#                     payment_amount=booking.total_amount,
#                     payment_status='PENDING',
#                     createdon=timezone.now(),
#                     createdby=booking.farmer_code.user_code.id,
#                 )

#             return Response({
#                 "order_id": order['id'],
#                 "amount": amount_paise,
#                 "currency": "INR",
#                 "key_id": settings.RAZORPAY_KEY_ID,  # public key - safe to send to the browser
#             }, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class RazorpayVerifyView(APIView):
#     """
#     POST api/payments/razorpay/verify/
#     body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_code }
#     The signature check proves the payment is real - never skip it.
#     """
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         try:
#             order_id = request.data.get('razorpay_order_id')
#             payment_id = request.data.get('razorpay_payment_id')
#             signature = request.data.get('razorpay_signature')
#             if not all((order_id, payment_id, signature)):
#                 return error("Payment verification details are incomplete.")

#             payment = Payments.objects.select_related(
#                 'booking_code__farmer_code__user_code'
#             ).filter(razorpay_order_id=order_id).first()
#             if not payment:
#                 return error("Order not found.", status.HTTP_404_NOT_FOUND)

#             booking = payment.booking_code
#             if booking.farmer_code.user_code_id != request.user.user_code:
#                 return error("This is not your booking.", status.HTTP_403_FORBIDDEN)

#             if payment.payment_status == 'SUCCESS':  # verify called twice - already done
#                 return Response(PaymentsSerializer(payment).data, status=status.HTTP_200_OK)
#             if (
#                 payment.payment_status != 'PENDING'
#                 or payment.payment_gateway != 'RAZORPAY'
#                 or booking.booking_status != 'PENDING'
#             ):
#                 return error("This payment can no longer be completed.")

#             client = razorpay_client()
#             try:
#                 client.utility.verify_payment_signature({
#                     'razorpay_order_id': order_id,
#                     'razorpay_payment_id': payment_id,
#                     'razorpay_signature': signature,
#                 })
#             except razorpay.errors.SignatureVerificationError:
#                 return error("Payment verification failed.")

#             gateway_payment = client.payment.fetch(payment_id)
#             expected_amount = int((payment.payment_amount * 100).to_integral_value())
#             if (
#                 gateway_payment.get('order_id') != order_id
#                 or gateway_payment.get('amount') != expected_amount
#                 or gateway_payment.get('status') != 'captured'
#             ):
#                 return error("Razorpay has not confirmed the expected captured payment.")

#             with transaction.atomic():
#                 payment = Payments.objects.select_for_update().get(pk=payment.pk)
#                 booking = Bookings.objects.select_for_update().get(pk=booking.pk)
#                 if payment.payment_status == 'SUCCESS':
#                     return Response(PaymentsSerializer(payment).data, status=status.HTTP_200_OK)
#                 if booking.booking_status != 'PENDING':
#                     return error("This booking can no longer be paid.")
#                 if Payments.objects.filter(
#                     booking_code=booking, payment_status='SUCCESS'
#                 ).exclude(pk=payment.pk).exists():
#                     return error("This booking already has a successful payment.")

#                 now = timezone.now()
#                 payment.razorpay_payment_id = payment_id
#                 payment.razorpay_signature = signature
#                 payment.payment_status = 'SUCCESS'
#                 payment.payment_method = 'ONLINE'
#                 payment.transaction_date = now
#                 payment.updatedon = now
#                 payment.save()

#                 # booking stays PENDING - the owner still has to approve it
#             email_sent = send_booking_email(
#                 booking,
#                 f"Payment received for Agrirent booking {booking.booking_code}",
#                 (
#                     f"Hello {booking.farmer_code.user_code.full_name},\n\n"
#                     f"Your online payment for booking {booking.booking_code} has been received. "
#                     "The equipment owner still needs to confirm the booking."
#                 ),
#             )
#             response_data = PaymentsSerializer(payment).data
#             response_data['booking_email_sent'] = email_sent
#             return Response(response_data, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class CashPaymentView(APIView):
#     """POST api/payments/cash/ records cash as successful when selected."""
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         try:
#             booking, err = _get_payable_booking(
#                 request.data.get('booking_code'),
#                 request.user.user_code,
#                 allow_successful_cash=True,
#             )
#             if err:
#                 return err

#             with transaction.atomic():
#                 booking = Bookings.objects.select_for_update().get(pk=booking.pk)
#                 existing_cash = Payments.objects.filter(
#                     booking_code=booking,
#                     payment_gateway='CASH',
#                     payment_status='SUCCESS',
#                 ).order_by('-id').first()
#                 if existing_cash:
#                     return Response(
#                         PaymentsSerializer(existing_cash).data,
#                         status=status.HTTP_200_OK,
#                     )

#                 existing = Payments.objects.filter(
#                     booking_code=booking, payment_status='PENDING'
#                 ).first()
#                 if existing:
#                     if existing.payment_gateway == 'CASH':
#                         now = timezone.now()
#                         existing.payment_status = 'SUCCESS'
#                         existing.transaction_date = now
#                         existing.updatedon = now
#                         existing.updatedby = request.user.id
#                         existing.remarks = 'Cash payment confirmed when selected.'
#                         existing.save(update_fields=[
#                             'payment_status',
#                             'transaction_date',
#                             'updatedon',
#                             'updatedby',
#                             'remarks',
#                         ])
#                         payment = existing
#                     else:
#                         return error("Online payment was already selected for this booking.")
#                 else:
#                     now = timezone.now()
#                     payment = Payments.objects.create(
#                         payment_code=next_code(Payments, 'payment_code', 'PAY'),
#                         booking_code=booking,
#                         farmer_code=booking.farmer_code,
#                         payment_gateway='CASH',
#                         payment_amount=booking.total_amount,
#                         payment_method='CASH',
#                         payment_status='SUCCESS',
#                         transaction_date=now,
#                         remarks='Cash payment confirmed when selected.',
#                         createdon=now,
#                         createdby=booking.farmer_code.user_code.id,
#                     )
#             email_sent = send_booking_email(
#                 booking,
#                 f"Cash payment successful: {booking.booking_code}",
#                 (
#                     f"Hello {booking.farmer_code.user_code.full_name},\n\n"
#                     f"Your cash payment for booking {booking.booking_code} has been "
#                     "recorded as successful. The equipment owner still needs to confirm "
#                     "the booking."
#                 ),
#             )
#             response_data = PaymentsSerializer(payment).data
#             response_data['booking_email_sent'] = email_sent
#             return Response(response_data, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class CashPaymentConfirmView(APIView):
#     """POST api/payments/cash/confirm/<booking_code>/ after cash is received."""
#     permission_classes = [IsAuthenticated]

#     def post(self, request, booking_code):
#         try:
#             with transaction.atomic():
#                 booking = _booking_queryset().select_for_update().filter(
#                     booking_code=booking_code
#                 ).first()
#                 if not booking:
#                     return error("Booking not found.", status.HTTP_404_NOT_FOUND)

#                 is_owner = booking.equipment_code.farmer_code.user_code_id == request.user.user_code
#                 is_admin = (request.user.role or '').upper() == 'ADMIN'
#                 if not (is_owner or is_admin):
#                     return error(
#                         "Only the equipment owner can confirm cash receipt.",
#                         status.HTTP_403_FORBIDDEN,
#                     )

#                 payment = Payments.objects.select_for_update().filter(
#                     booking_code=booking,
#                     payment_gateway='CASH',
#                 ).order_by('-id').first()
#                 if not payment:
#                     return error("No cash payment was selected for this booking.")
#                 if payment.payment_status == 'SUCCESS':
#                     return Response(
#                         PaymentsSerializer(payment).data,
#                         status=status.HTTP_200_OK,
#                     )
#                 if payment.payment_status != 'PENDING':
#                     return error(f"This cash payment is {payment.payment_status.lower()}.")
#                 if booking.booking_status in ('CANCELLED', 'REJECTED'):
#                     return error("Cash cannot be confirmed for a cancelled booking.")

#                 now = timezone.now()
#                 payment.payment_status = 'SUCCESS'
#                 payment.transaction_date = now
#                 payment.updatedon = now
#                 payment.updatedby = request.user.id
#                 payment.remarks = "Cash receipt confirmed by equipment owner."
#                 payment.save(update_fields=[
#                     'payment_status',
#                     'transaction_date',
#                     'updatedon',
#                     'updatedby',
#                     'remarks',
#                 ])

#             email_sent = send_booking_email(
#                 booking,
#                 f"Cash payment received for Agrirent booking {booking.booking_code}",
#                 (
#                     f"Hello {booking.farmer_code.user_code.full_name},\n\n"
#                     f"The equipment owner confirmed receiving your cash payment for "
#                     f"booking {booking.booking_code}."
#                 ),
#             )
#             response_data = PaymentsSerializer(payment).data
#             response_data['booking_email_sent'] = email_sent
#             return Response(response_data, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# eqpt payment apiviews ends

# payment_views.py  (every view is self-contained: no helper functions)
import logging
import re
from decimal import Decimal, ROUND_HALF_UP

import razorpay
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .actor import get_actor

# Adjust the import path to your app
from .models import (
    Bookings,
    FarmerProfiles,
    PaymentModeMaster,
    Payments,
    PaymentStatusMaster,
    Settings,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------
# 1. Renter pays by CASH -> row saved directly as SUCCESS
# POST api/payments/cash/   {booking_code, user_code}
# ---------------------------------------------------------------------
class EquipmentCashPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            booking_code = request.data.get("booking_code")
            actor = get_actor(request)
            user_code = actor.user_code if actor else None
            if not booking_code or not user_code:
                return Response({"error": "booking_code and user_code are required"},
                                status=status.HTTP_400_BAD_REQUEST)

            farmer = FarmerProfiles.objects.filter(user_code=user_code).first()
            if not farmer:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

            booking = Bookings.objects.filter(booking_code=booking_code).first()
            if not booking:
                return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

            # Only the renter can pay
            if booking.farmer_code_id != farmer.farmer_code:
                return Response({"error": "Only the renter can pay for this booking"},
                                status=status.HTTP_403_FORBIDDEN)

            if str(booking.booking_status or "").upper() in ["CANCELLED", "REJECTED", "COMPLETED", "EXPIRED"]:
                return Response({"error": "This booking is no longer waiting for payment"},
                                status=status.HTTP_400_BAD_REQUEST)

            if Payments.objects.filter(booking_code=booking_code, payment_status_code="SUCCESS").exists():
                return Response({"error": "This booking is already paid"},
                                status=status.HTTP_409_CONFLICT)

            status_paid = PaymentStatusMaster.objects.filter(payment_status_code="SUCCESS").first()
            mode_cash = PaymentModeMaster.objects.filter(payment_mode_code="CASH").first()
            if not status_paid or not mode_cash:
                missing = [n for n, v in (("payment_status_master.SUCCESS", status_paid),
                                          ("payment_mode_master.CASH", mode_cash)) if not v]
                logger.error("Missing master rows: %s", missing)
                return Response({"error": "Payment configuration missing: " + ", ".join(missing)}, status=500)

            now = timezone.now()
            amount = Decimal(str(booking.total_amount))  # always the server-side amount

            with transaction.atomic():
                # Reuse the latest unfinished attempt instead of creating many rows
                payment = (
                    Payments.objects.select_for_update()
                    .filter(booking_code=booking_code, payment_status_code__in=["PENDING", "FAILED"])
                    .order_by("-id")
                    .first()
                )

                if payment:
                    payment.payment_gateway = "CASH"
                    payment.payment_mode_code = mode_cash
                    payment.payment_status_code = status_paid
                    payment.payment_method = "CASH"
                    payment.payment_amount = amount
                    payment.razorpay_order_id = None
                    payment.razorpay_payment_id = None
                    payment.razorpay_signature = None
                    payment.remarks = "Cash payment recorded."
                    payment.transaction_date = now
                    payment.updatedon = now
                    payment.updatedby = actor.id
                    payment.save()
                else:
                    payment = None
                    for _ in range(3):  # retry if two requests grab the same code
                        try:
                            with transaction.atomic():
                                last = Payments.objects.order_by("-id").first()
                                number = 1
                                if last and last.payment_code:
                                    match = re.search(r"\d+", last.payment_code)
                                    number = int(match.group()) + 1 if match else 1
                                payment = Payments.objects.create(
                                    payment_code=f"PAY{number:06d}",
                                    booking_code=booking,
                                    farmer_code=farmer,
                                    payment_gateway="CASH",
                                    payment_mode_code=mode_cash,
                                    payment_method="CASH",
                                    payment_amount=amount,
                                    payment_status_code=status_paid,
                                    refund_amount=Decimal("0.00"),
                                    remarks="Cash payment recorded.",
                                    transaction_date=now,
                                    createdon=now,
                                    createdby=actor.id,
                                )
                            break
                        except IntegrityError:
                            continue
                    if payment is None:
                        return Response({"error": "Could not create the payment"}, status=500)

            return Response({
                "payment_code": payment.payment_code,
                "booking_code": booking.booking_code,
                "payment_gateway": payment.payment_gateway,
                "payment_mode": "CASH",
                "payment_status": "SUCCESS",
                "payment_amount": str(payment.payment_amount),
            }, status=status.HTTP_200_OK)
        except Exception:
            logger.exception("Cash payment failed")
            return Response({"error": "Could not record the cash payment"}, status=500)


# ---------------------------------------------------------------------
# 2. Owner confirms cash received -> SUCCESS
# POST api/payments/cash/confirm/<booking_code>/   {user_code}
# ---------------------------------------------------------------------
class EquipmentCashConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_code):
        try:
            actor = get_actor(request)
            user_code = actor.user_code if actor else None
            if not user_code:
                return Response({"error": "user_code is required"}, status=status.HTTP_400_BAD_REQUEST)

            farmer = FarmerProfiles.objects.filter(user_code=user_code).first()
            booking = Bookings.objects.filter(booking_code=booking_code).first()
            if not farmer or not booking:
                return Response({"error": "Booking or user not found"}, status=status.HTTP_404_NOT_FOUND)

            # ADAPT to your schema: the user must be the owner of the booked equipment
            try:
                is_owner = booking.equipment_code.owner_code.user_code == user_code
            except AttributeError:
                is_owner = False
            if not is_owner:
                return Response({"error": "Only the equipment owner can confirm cash"},
                                status=status.HTTP_403_FORBIDDEN)

            status_success = PaymentStatusMaster.objects.filter(payment_status_code="SUCCESS").first()
            if not status_success:
                return Response({"error": "Payment configuration missing"}, status=500)

            with transaction.atomic():
                payment = (
                    Payments.objects.select_for_update()
                    .filter(booking_code=booking_code, payment_gateway="CASH", payment_status_code="PENDING")
                    .order_by("-id")
                    .first()
                )
                if not payment:
                    return Response({"error": "No pending cash payment for this booking"},
                                    status=status.HTTP_404_NOT_FOUND)

                payment.payment_status_code = status_success
                payment.transaction_date = timezone.now()
                payment.remarks = "Cash received - confirmed by owner."
                payment.updatedon = timezone.now()
                payment.save()

            return Response({
                "payment_code": payment.payment_code,
                "booking_code": booking_code,
                "payment_gateway": "CASH",
                "payment_status": "SUCCESS",
            }, status=status.HTTP_200_OK)
        except Exception:
            logger.exception("Cash confirm failed")
            return Response({"error": "Could not confirm cash receipt"}, status=500)


# ---------------------------------------------------------------------
# 3. Razorpay: create order
# POST api/payments/razorpay/create-order/   {booking_code, user_code}
# ---------------------------------------------------------------------
class RazorpayCreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            booking_code = request.data.get("booking_code")
            actor = get_actor(request)
            user_code = actor.user_code if actor else None
            if not booking_code or not user_code:
                return Response({"error": "booking_code and user_code are required"},
                                status=status.HTTP_400_BAD_REQUEST)

            farmer = FarmerProfiles.objects.filter(user_code=user_code).first()
            if not farmer:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

            booking = Bookings.objects.filter(booking_code=booking_code).first()
            if not booking:
                return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

            if booking.farmer_code_id != farmer.farmer_code:
                return Response({"error": "Only the renter can pay for this booking"},
                                status=status.HTTP_403_FORBIDDEN)

            if str(booking.booking_status or "").upper() in ["CANCELLED", "REJECTED", "COMPLETED", "EXPIRED"]:
                return Response({"error": "This booking is no longer waiting for payment"},
                                status=status.HTTP_400_BAD_REQUEST)

            if Payments.objects.filter(booking_code=booking_code, payment_status_code="SUCCESS").exists():
                return Response({"error": "This booking is already paid"}, status=status.HTTP_409_CONFLICT)

            key_id = Settings.objects.filter(setting_name="RAZORPAY_KEY_ID").values_list("setting_value", flat=True).first()
            key_secret = Settings.objects.filter(setting_name="RAZORPAY_KEY_SECRET").values_list("setting_value", flat=True).first()
            status_pending = PaymentStatusMaster.objects.filter(payment_status_code="PENDING").first()
            mode_online = PaymentModeMaster.objects.filter(payment_mode_code="ONLINE").first()
            if not all([key_id, key_secret, status_pending, mode_online]):
                return Response({"error": "Online payment is not configured"}, status=500)

            now = timezone.now()
            amount = Decimal(str(booking.total_amount))  # server-side amount only
            amount_paise = int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
            if amount_paise <= 0:
                return Response({"error": "Invalid payable amount"}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                payment = (
                    Payments.objects.select_for_update()
                    .filter(booking_code=booking_code, payment_status_code__in=["PENDING", "FAILED"])
                    .order_by("-id")
                    .first()
                )

                if payment:
                    payment.payment_gateway = "RAZORPAY"
                    payment.payment_mode_code = mode_online
                    payment.payment_status_code = status_pending
                    payment.payment_amount = amount
                    payment.payment_method = None
                    payment.razorpay_order_id = None
                    payment.razorpay_payment_id = None
                    payment.razorpay_signature = None
                    payment.updatedon = now
                    payment.updatedby = actor.id
                    payment.save()
                else:
                    payment = None
                    for _ in range(3):
                        try:
                            with transaction.atomic():
                                last = Payments.objects.order_by("-id").first()
                                number = 1
                                if last and last.payment_code:
                                    match = re.search(r"\d+", last.payment_code)
                                    number = int(match.group()) + 1 if match else 1
                                payment = Payments.objects.create(
                                    payment_code=f"PAY{number:06d}",
                                    booking_code=booking,
                                    farmer_code=farmer,
                                    payment_gateway="RAZORPAY",
                                    payment_mode_code=mode_online,
                                    payment_amount=amount,
                                    payment_status_code=status_pending,
                                    refund_amount=Decimal("0.00"),
                                    createdon=now,
                                    createdby=actor.id,
                                )
                            break
                        except IntegrityError:
                            continue
                    if payment is None:
                        return Response({"error": "Could not create the payment"}, status=500)

            # Razorpay call is made outside the DB transaction
            client = razorpay.Client(auth=(key_id, key_secret))
            order = client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": payment.payment_code,
                "payment_capture": 1,
                "notes": {"booking_code": booking.booking_code},
            })

            payment.razorpay_order_id = order["id"]
            payment.updatedon = timezone.now()
            payment.save(update_fields=["razorpay_order_id", "updatedon"])

            return Response({
                "key_id": key_id,
                "order_id": order["id"],
                "amount": amount_paise,
                "currency": "INR",
                "payment_code": payment.payment_code,
            }, status=status.HTTP_200_OK)
        except Exception:
            logger.exception("Razorpay create-order failed")
            return Response({"error": "Could not start the online payment"}, status=500)


# ---------------------------------------------------------------------
# 4. Razorpay: verify signature -> SUCCESS
# POST api/payments/razorpay/verify/
#   {razorpay_order_id, razorpay_payment_id, razorpay_signature, user_code}
# ---------------------------------------------------------------------
class RazorpayVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            order_id = request.data.get("razorpay_order_id")
            payment_id = request.data.get("razorpay_payment_id")
            signature = request.data.get("razorpay_signature")
            actor = get_actor(request)
            user_code = actor.user_code if actor else None
            if not all([order_id, payment_id, signature, user_code]):
                return Response({"error": "Missing payment verification fields"},
                                status=status.HTTP_400_BAD_REQUEST)

            farmer = FarmerProfiles.objects.filter(user_code=user_code).first()
            if not farmer:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

            key_id = Settings.objects.filter(setting_name="RAZORPAY_KEY_ID").values_list("setting_value", flat=True).first()
            key_secret = Settings.objects.filter(setting_name="RAZORPAY_KEY_SECRET").values_list("setting_value", flat=True).first()
            status_success = PaymentStatusMaster.objects.filter(payment_status_code="SUCCESS").first()
            status_failed = PaymentStatusMaster.objects.filter(payment_status_code="FAILED").first()
            if not all([key_id, key_secret, status_success, status_failed]):
                return Response({"error": "Online payment is not configured"}, status=500)

            with transaction.atomic():
                payment = Payments.objects.select_for_update().filter(razorpay_order_id=order_id).first()
                if not payment:
                    return Response({"error": "Payment order not found"}, status=status.HTTP_404_NOT_FOUND)
                if payment.farmer_code_id != farmer.farmer_code:
                    return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

                # Already verified -> safe to call twice
                if payment.payment_status_code_id == "SUCCESS":
                    return Response({
                        "payment_code": payment.payment_code,
                        "payment_status": "SUCCESS",
                        "payment_gateway": "RAZORPAY",
                    }, status=status.HTTP_200_OK)

                client = razorpay.Client(auth=(key_id, key_secret))
                try:
                    client.utility.verify_payment_signature({
                        "razorpay_order_id": order_id,
                        "razorpay_payment_id": payment_id,
                        "razorpay_signature": signature,
                    })
                except razorpay.errors.SignatureVerificationError:
                    payment.payment_status_code = status_failed
                    payment.remarks = "Signature verification failed"
                    payment.updatedon = timezone.now()
                    payment.save()
                    return Response({"error": "Payment verification failed"},
                                    status=status.HTTP_400_BAD_REQUEST)

                method = None
                try:
                    method = client.payment.fetch(payment_id).get("method")
                except Exception:
                    logger.warning("Could not fetch Razorpay payment method", exc_info=True)

                payment.razorpay_payment_id = payment_id
                payment.razorpay_signature = signature
                payment.payment_method = (method or "online").upper()
                payment.payment_status_code = status_success
                payment.transaction_date = timezone.now()
                payment.remarks = "Paid online via Razorpay"
                payment.updatedon = timezone.now()
                payment.save()

            return Response({
                "payment_code": payment.payment_code,
                "booking_code": payment.booking_code_id,
                "payment_gateway": "RAZORPAY",
                "payment_method": payment.payment_method,
                "payment_status": "SUCCESS",
            }, status=status.HTTP_200_OK)
        except Exception:
            logger.exception("Razorpay verify failed")
            return Response({"error": "Could not verify the payment"}, status=500)


# ---------------------------------------------------------------------
# 5. Razorpay: checkout reported payment.failed
# POST api/payments/razorpay/failed/   {razorpay_order_id, user_code, reason}
# ---------------------------------------------------------------------
class RazorpayFailedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            order_id = request.data.get("razorpay_order_id")
            actor = get_actor(request)
            user_code = actor.user_code if actor else None
            reason = (request.data.get("reason") or "Payment failed")[:500]
            if not order_id or not user_code:
                return Response({"error": "razorpay_order_id and user_code are required"},
                                status=status.HTTP_400_BAD_REQUEST)

            farmer = FarmerProfiles.objects.filter(user_code=user_code).first()
            payment = Payments.objects.filter(razorpay_order_id=order_id).first()
            if not farmer or not payment or payment.farmer_code_id != farmer.farmer_code:
                return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

            # never downgrade a payment that already succeeded
            if payment.payment_status_code_id != "SUCCESS":
                status_failed = PaymentStatusMaster.objects.filter(payment_status_code="FAILED").first()
                payment.payment_status_code = status_failed
                payment.remarks = reason
                payment.updatedon = timezone.now()
                payment.save()

            return Response({
                "payment_code": payment.payment_code,
                "payment_status": payment.payment_status_code_id,
            }, status=status.HTTP_200_OK)
        except Exception:
            logger.exception("Mark failed error")
            return Response({"error": "Could not update the payment"}, status=500)


# ---------------------------------------------------------------------
# 6. Latest payment of a booking
# GET api/payments/status/<booking_code>/
# ---------------------------------------------------------------------
class BookingPaymentStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_code):
        payment = Payments.objects.filter(booking_code=booking_code).order_by("-id").first()
        if not payment:
            return Response({"booking_code": booking_code, "payment_status": None, "payment_gateway": None})
        return Response({
            "payment_code": payment.payment_code,
            "booking_code": booking_code,
            "payment_gateway": payment.payment_gateway,
            "payment_mode": payment.payment_mode_code_id,
            "payment_method": payment.payment_method,
            "payment_status": payment.payment_status_code_id,
            "payment_amount": str(payment.payment_amount),
            "transaction_date": payment.transaction_date,
        })

# eqpt payment apiviews ends


# ==========================================
# Payments Views
# ==========================================

class PaymentListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            objs = list(Payments.objects.all().order_by("payment_code"))
            serializer = PaymentsSerializer(objs, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentCreateView(APIView):
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        try:
            serializer = PaymentsSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                user_id = _resolve_user_id(request, "createdby")
                obj = serializer.save(
                    createdby=user_id,
                    createdon=timezone.now(),
                )
                return Response(
                    PaymentsSerializer(obj, context={"request": request}).data,
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentUpdateView(APIView):
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def put(self, request, payment_code):
        try:
            obj = get_object_or_404(Payments, payment_code=payment_code)
            serializer = PaymentsSerializer(
                obj, data=request.data, partial=True, context={"request": request}
            )
            if serializer.is_valid():
                user_id = _resolve_user_id(request, "updatedby")
                instance = serializer.save(updatedby=user_id, updatedon=timezone.now())
                return Response(
                    PaymentsSerializer(instance, context={"request": request}).data,
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Http404:
            return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentDeleteView(APIView):
    def delete(self, request, payment_code):
        try:
            obj = get_object_or_404(Payments, payment_code=payment_code)
            obj.delete()
            return Response({"message": "Payment deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Http404:
            return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from django.db import IntegrityError, transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


def _resolve_user_id(request, fallback_key: str):
    if request.user and getattr(request.user, "is_authenticated", False):
        return request.user.id
    return request.data.get(fallback_key)


def _resolve_user_code(request):
    if request.user and getattr(request.user, "is_authenticated", False):
        return getattr(request.user, "user_code", None)
    return request.data.get("user_code") or request.query_params.get("user_code")


# ==========================================
# MaintenanceRecords Views
# ==========================================

class MaintenanceRecordListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            qs = MaintenanceRecords.objects.all().order_by("maintenance_code")

            equipment_code = request.query_params.get("equipment_code")
            if equipment_code:
                qs = qs.filter(equipment_code__equipment_code=equipment_code)

            maintenance_status = request.query_params.get("maintenance_status")
            if maintenance_status:
                qs = qs.filter(maintenance_status=maintenance_status)

            maintenance_type = request.query_params.get("maintenance_type")
            if maintenance_type:
                qs = qs.filter(maintenance_type=maintenance_type)

            objs = list(qs)
            serializer = MaintenanceRecordsSerializer(objs, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MaintenanceRecordCreateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        try:
            serializer = MaintenanceRecordsSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                user_id = _resolve_user_id(request, "createdby")
                obj = serializer.save(
                    createdby=user_id,
                    createdon=timezone.now(),
                )
                return Response(
                    MaintenanceRecordsSerializer(obj, context={"request": request}).data,
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MaintenanceRecordUpdateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def put(self, request, maintenance_code):
        try:
            obj = get_object_or_404(MaintenanceRecords, maintenance_code=maintenance_code)
            serializer = MaintenanceRecordsSerializer(
                obj, data=request.data, partial=True, context={"request": request}
            )
            if serializer.is_valid():
                user_id = _resolve_user_id(request, "updatedby")
                instance = serializer.save(updatedby=user_id, updatedon=timezone.now())
                return Response(
                    MaintenanceRecordsSerializer(instance, context={"request": request}).data,
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Http404:
            return Response({"error": "Maintenance record not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MaintenanceRecordDeleteView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, maintenance_code):
        try:
            obj = get_object_or_404(MaintenanceRecords, maintenance_code=maintenance_code)
            obj.delete()
            return Response({"message": "Maintenance record deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Http404:
            return Response({"error": "Maintenance record not found"}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            return Response({"error": "Cannot delete maintenance record due to linked records"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# Notifications Views
# ==========================================

class NotificationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            qs = Notifications.objects.all().order_by("-id")

            user_code = request.query_params.get("user_code")
            if user_code:
                qs = qs.filter(user_code__user_code=user_code)

            is_read = request.query_params.get("is_read")
            if is_read is not None and is_read != "":
                qs = qs.filter(is_read=int(is_read))

            objs = list(qs)
            serializer = NotificationsSerializer(objs, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationCreateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        try:
            serializer = NotificationsSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                obj = serializer.save(createdon=timezone.now())
                return Response(
                    NotificationsSerializer(obj, context={"request": request}).data,
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationUpdateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def put(self, request, notification_code):
        try:
            obj = get_object_or_404(Notifications, notification_code=notification_code)
            serializer = NotificationsSerializer(
                obj, data=request.data, partial=True, context={"request": request}
            )
            if serializer.is_valid():
                extra_kwargs = {}
                if str(request.data.get("is_read")) in ("1", "true", "True") and not request.data.get("read_at"):
                    extra_kwargs["read_at"] = timezone.now()
                instance = serializer.save(**extra_kwargs)
                return Response(
                    NotificationsSerializer(instance, context={"request": request}).data,
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Http404:
            return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationDeleteView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, notification_code):
        try:
            obj = get_object_or_404(Notifications, notification_code=notification_code)
            obj.delete()
            return Response({"message": "Notification deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Http404:
            return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            return Response({"error": "Cannot delete notification due to linked records"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# Penalties Views
# ==========================================

class PenaltyListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            qs = Penalties.objects.all().order_by("penalty_code")

            rental_code = request.query_params.get("rental_code")
            if rental_code:
                qs = qs.filter(rental_code__rental_code=rental_code)

            booking_code = request.query_params.get("booking_code")
            if booking_code:
                qs = qs.filter(rental_code__booking_code__booking_code=booking_code)

            farmer_code = request.query_params.get("farmer_code")
            if farmer_code:
                qs = qs.filter(farmer_code__farmer_code=farmer_code)

            payment_status = request.query_params.get("payment_status")
            if payment_status:
                qs = qs.filter(payment_status=payment_status)

            objs = list(qs)
            serializer = PenaltiesSerializer(objs, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PenaltyCreateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        try:
            serializer = PenaltiesSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                user_id = _resolve_user_id(request, "createdby")
                obj = serializer.save(
                    createdby=user_id,
                    createdon=timezone.now(),
                )
                return Response(
                    PenaltiesSerializer(obj, context={"request": request}).data,
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PenaltyUpdateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def put(self, request, penalty_code):
        try:
            obj = get_object_or_404(Penalties, penalty_code=penalty_code)
            serializer = PenaltiesSerializer(
                obj, data=request.data, partial=True, context={"request": request}
            )
            if serializer.is_valid():
                user_id = _resolve_user_id(request, "updatedby")
                instance = serializer.save(updatedby=user_id, updatedon=timezone.now())
                return Response(
                    PenaltiesSerializer(instance, context={"request": request}).data,
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Http404:
            return Response({"error": "Penalty not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PenaltyDeleteView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, penalty_code):
        try:
            obj = get_object_or_404(Penalties, penalty_code=penalty_code)
            obj.delete()
            return Response({"message": "Penalty deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Http404:
            return Response({"error": "Penalty not found"}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            return Response({"error": "Cannot delete penalty due to linked records"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# Rentals Views
# ==========================================

class RentalListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            qs = Rentals.objects.all().order_by("rental_code")

            booking_code = request.query_params.get("booking_code")
            if booking_code:
                qs = qs.filter(booking_code__booking_code=booking_code)

            equipment_code = request.query_params.get("equipment_code")
            if equipment_code:
                qs = qs.filter(equipment_code__equipment_code=equipment_code)

            farmer_code = request.query_params.get("farmer_code")
            if farmer_code:
                qs = qs.filter(farmer_code__farmer_code=farmer_code)

            rental_status = request.query_params.get("rental_status")
            if rental_status:
                qs = qs.filter(rental_status=rental_status)

            objs = list(qs)
            serializer = RentalsSerializer(objs, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RentalCreateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        try:
            serializer = RentalsSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                user_id = _resolve_user_id(request, "createdby")
                obj = serializer.save(
                    createdby=user_id,
                    createdon=timezone.now(),
                )
                return Response(
                    RentalsSerializer(obj, context={"request": request}).data,
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RentalUpdateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def put(self, request, rental_code):
        try:
            obj = get_object_or_404(Rentals, rental_code=rental_code)
            serializer = RentalsSerializer(
                obj, data=request.data, partial=True, context={"request": request}
            )
            if serializer.is_valid():
                user_id = _resolve_user_id(request, "updatedby")
                instance = serializer.save(updatedby=user_id, updatedon=timezone.now())
                return Response(
                    RentalsSerializer(instance, context={"request": request}).data,
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Http404:
            return Response({"error": "Rental not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RentalDeleteView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, rental_code):
        try:
            obj = get_object_or_404(Rentals, rental_code=rental_code)
            obj.delete()
            return Response({"message": "Rental deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Http404:
            return Response({"error": "Rental not found"}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            return Response({"error": "Cannot delete rental while penalties or linked records exist"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# Reviews Views
# ==========================================

# class ReviewsListView(APIView):
#     """GET api/reviews/?equipment_code=EQ000001   (published reviews only)"""
#     permission_classes = [AllowAny]

#     def get(self, request):
#         try:
#             qs = Reviews.objects.select_related(
#                 "booking_code", "equipment_code", "farmer_code__user_code"
#             ).filter(status=1).order_by("-id")

#             equipment_code = request.query_params.get("equipment_code")
#             if equipment_code:
#                 qs = qs.filter(equipment_code__equipment_code=equipment_code)

#             booking_code = request.query_params.get("booking_code")
#             if booking_code:
#                 qs = qs.filter(booking_code__booking_code=booking_code)

#             farmer_code = request.query_params.get("farmer_code")
#             if farmer_code:
#                 qs = qs.filter(farmer_code__farmer_code=farmer_code)

#             serializer = ReviewsSerializer(qs, many=True, context={"request": request})
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class ReviewsDetailView(APIView):
#     """GET api/reviews/<review_code>/"""
#     permission_classes = [AllowAny]

#     def get(self, request, review_code):
#         try:
#             obj = get_object_or_404(
#                 Reviews.objects.select_related(
#                     "booking_code", "equipment_code", "farmer_code__user_code"
#                 ),
#                 review_code=review_code,
#             )
#             serializer = ReviewsSerializer(obj, context={"request": request})
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         except Http404:
#             return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class ReviewsCreateView(APIView):
#     """POST api/reviews/create/   body: { user_code, booking_code, rating 1-5, review_comment }"""
#     permission_classes = [AllowAny]
#     parser_classes = [JSONParser, FormParser, MultiPartParser]

#     def post(self, request):
#         try:
#             data = request.data

#             try:
#                 rating = int(data.get("rating"))
#             except (TypeError, ValueError):
#                 return Response({"error": "Rating is required."}, status=status.HTTP_400_BAD_REQUEST)

#             if rating < 1 or rating > 5:
#                 return Response({"error": "Rating must be between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)

#             booking_code_val = (data.get("booking_code") or "").strip()
#             if not booking_code_val:
#                 return Response({"error": "Booking code is required."}, status=status.HTTP_400_BAD_REQUEST)

#             booking_qs = _booking_queryset() if "_booking_queryset" in globals() else Bookings.objects.select_related("equipment_code", "farmer_code__user_code")
#             booking = booking_qs.filter(booking_code=booking_code_val).first()
#             if not booking:
#                 return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

#             provided_user_code = _resolve_user_code(request)
#             booking_owner_code = getattr(booking.farmer_code, "user_code_id", None) or getattr(getattr(booking.farmer_code, "user_code", None), "user_code", None)
#             if provided_user_code and booking_owner_code and provided_user_code != booking_owner_code:
#                 return Response(
#                     {"error": "You can only review your own bookings."},
#                     status=status.HTTP_403_FORBIDDEN,
#                 )

#             if not Payments.objects.filter(
#                 booking_code__booking_code=booking.booking_code,
#                 payment_status="SUCCESS",
#             ).exists():
#                 return Response(
#                     {"error": "Complete payment before reviewing this booking."},
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )

#             if Reviews.objects.filter(booking_code__booking_code=booking.booking_code).exists():
#                 return Response(
#                     {"error": "You already reviewed this booking."},
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )

#             user_id = (
#                 request.user.id
#                 if request.user and getattr(request.user, "is_authenticated", False)
#                 else getattr(getattr(booking.farmer_code, "user_code", None), "id", None)
#             )

#             with transaction.atomic():
#                 review_code_val = (
#                     next_code(Reviews, "review_code", "REV")
#                     if "next_code" in globals()
#                     else _next_prefixed_code(Reviews.objects.all(), "review_code", "RV")
#                 )
#                 review = Reviews.objects.create(
#                     review_code=review_code_val,
#                     booking_code=booking,
#                     equipment_code=booking.equipment_code,
#                     farmer_code=booking.farmer_code,
#                     rating=rating,
#                     review_comment=(data.get("review_comment") or "").strip() or None,
#                     status=int(data.get("status", 1)),
#                     createdon=timezone.now(),
#                     createdby=user_id,
#                 )

#             return Response(
#                 ReviewsSerializer(review, context={"request": request}).data,
#                 status=status.HTTP_201_CREATED,
#             )
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class ReviewsUpdateView(APIView):
#     """PUT api/reviews/update/<review_code>/"""
#     permission_classes = [AllowAny]
#     parser_classes = [JSONParser, FormParser, MultiPartParser]

#     def put(self, request, review_code):
#         try:
#             obj = get_object_or_404(
#                 Reviews.objects.select_related("farmer_code__user_code"),
#                 review_code=review_code,
#             )

#             provided_user_code = _resolve_user_code(request)
#             owner_code = getattr(obj.farmer_code, "user_code_id", None) or getattr(getattr(obj.farmer_code, "user_code", None), "user_code", None)
#             if (
#                 provided_user_code
#                 and owner_code
#                 and provided_user_code != owner_code
#                 and not getattr(request.user, "is_staff", False)
#             ):
#                 return Response(
#                     {"error": "You can only update your own reviews."},
#                     status=status.HTTP_403_FORBIDDEN,
#                 )

#             data = request.data

#             if "rating" in data and data.get("rating") is not None:
#                 try:
#                     rating = int(data.get("rating"))
#                 except (TypeError, ValueError):
#                     return Response({"error": "Rating must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)
#                 if rating < 1 or rating > 5:
#                     return Response({"error": "Rating must be between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
#                 obj.rating = rating

#             if "review_comment" in data:
#                 obj.review_comment = (data.get("review_comment") or "").strip() or None

#             if "status" in data and data.get("status") is not None:
#                 obj.status = int(data.get("status"))

#             user_id = _resolve_user_id(request, "updatedby")
#             obj.updatedby = user_id
#             obj.updatedon = timezone.now()
#             obj.save()

#             return Response(
#                 ReviewsSerializer(obj, context={"request": request}).data,
#                 status=status.HTTP_200_OK,
#             )
#         except Http404:
#             return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class ReviewsDeleteView(APIView):
#     """DELETE api/reviews/delete/<review_code>/"""
#     permission_classes = [AllowAny]

#     def delete(self, request, review_code):
#         try:
#             obj = get_object_or_404(
#                 Reviews.objects.select_related("farmer_code__user_code"),
#                 review_code=review_code,
#             )

#             provided_user_code = _resolve_user_code(request)
#             owner_code = getattr(obj.farmer_code, "user_code_id", None) or getattr(getattr(obj.farmer_code, "user_code", None), "user_code", None)
#             if (
#                 provided_user_code
#                 and owner_code
#                 and provided_user_code != owner_code
#                 and not getattr(request.user, "is_staff", False)
#             ):
#                 return Response(
#                     {"error": "You can only delete your own reviews."},
#                     status=status.HTTP_403_FORBIDDEN,
#                 )

#             obj.delete()
#             return Response(
#                 {"message": "Review deleted successfully"},
#                 status=status.HTTP_204_NO_CONTENT,
#             )
#         except Http404:
#             return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
#         except IntegrityError:
#             return Response({"error": "Cannot delete review due to linked records"}, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)






from django.db import IntegrityError, transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Bookings, Reviews
from .serializers import ReviewsSerializer


class ReviewsListView(APIView):
    """GET api/reviews/?equipment_code=EQ000001   (published reviews only)"""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            qs = Reviews.objects.select_related(
                "booking_code", "equipment_code", "farmer_code__user_code"
            ).filter(status=1).order_by("-id")

            equipment_code = request.query_params.get("equipment_code")
            if equipment_code:
                qs = qs.filter(equipment_code__equipment_code=equipment_code)

            booking_code = request.query_params.get("booking_code")
            if booking_code:
                qs = qs.filter(booking_code__booking_code=booking_code)

            farmer_code = request.query_params.get("farmer_code")
            if farmer_code:
                qs = qs.filter(farmer_code__farmer_code=farmer_code)

            serializer = ReviewsSerializer(qs, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReviewsDetailView(APIView):
    """GET api/reviews/<review_code>/"""
    permission_classes = [AllowAny]

    def get(self, request, review_code):
        try:
            obj = get_object_or_404(
                Reviews.objects.select_related(
                    "booking_code", "equipment_code", "farmer_code__user_code"
                ),
                review_code=review_code,
            )
            serializer = ReviewsSerializer(obj, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Http404:
            return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReviewsCreateView(APIView):
    """POST api/reviews/create/   body: { user_code, booking_code, rating 1-5, review_comment }"""
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        try:
            data = request.data

            try:
                rating = int(data.get("rating"))
            except (TypeError, ValueError):
                return Response({"error": "Rating is required."}, status=status.HTTP_400_BAD_REQUEST)

            if rating < 1 or rating > 5:
                return Response({"error": "Rating must be between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)

            booking_code_val = (data.get("booking_code") or "").strip()
            if not booking_code_val:
                return Response({"error": "Booking code is required."}, status=status.HTTP_400_BAD_REQUEST)

            booking_qs = _booking_queryset() if "_booking_queryset" in globals() else Bookings.objects.select_related("equipment_code", "farmer_code__user_code")
            booking = booking_qs.filter(booking_code=booking_code_val).first()
            if not booking:
                return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

            provided_user_code = _resolve_user_code(request)
            booking_owner_code = getattr(booking.farmer_code, "user_code_id", None) or getattr(getattr(booking.farmer_code, "user_code", None), "user_code", None)
            if provided_user_code and booking_owner_code and provided_user_code != booking_owner_code:
                return Response(
                    {"error": "You can only review your own bookings."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if Reviews.objects.filter(booking_code=booking).exists():
                return Response(
                    {"error": "You already reviewed this booking."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user_id = (
                request.user.id
                if request.user and getattr(request.user, "is_authenticated", False)
                else getattr(getattr(booking.farmer_code, "user_code", None), "id", None)
            )

            with transaction.atomic():
                review_code_val = (
                    next_code(Reviews, "review_code", "REV")
                    if "next_code" in globals()
                    else _next_prefixed_code(Reviews.objects.all(), "review_code", "RV")
                )
                review = Reviews.objects.create(
                    review_code=review_code_val,
                    booking_code=booking,
                    equipment_code=booking.equipment_code,
                    farmer_code=booking.farmer_code,
                    rating=rating,
                    review_comment=(data.get("review_comment") or "").strip() or None,
                    status=int(data.get("status", 1)),
                    createdon=timezone.now(),
                    createdby=user_id,
                )

            return Response(
                ReviewsSerializer(review, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReviewsUpdateView(APIView):
    """PUT api/reviews/update/<review_code>/"""
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def put(self, request, review_code):
        try:
            obj = get_object_or_404(
                Reviews.objects.select_related("farmer_code__user_code"),
                review_code=review_code,
            )

            provided_user_code = _resolve_user_code(request)
            owner_code = getattr(obj.farmer_code, "user_code_id", None) or getattr(getattr(obj.farmer_code, "user_code", None), "user_code", None)
            if (
                provided_user_code
                and owner_code
                and provided_user_code != owner_code
                and not getattr(request.user, "is_staff", False)
            ):
                return Response(
                    {"error": "You can only update your own reviews."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            data = request.data

            if "rating" in data and data.get("rating") is not None:
                try:
                    rating = int(data.get("rating"))
                except (TypeError, ValueError):
                    return Response({"error": "Rating must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)
                if rating < 1 or rating > 5:
                    return Response({"error": "Rating must be between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
                obj.rating = rating

            if "review_comment" in data:
                obj.review_comment = (data.get("review_comment") or "").strip() or None

            if "status" in data and data.get("status") is not None:
                obj.status = int(data.get("status"))

            user_id = _resolve_user_id(request, "updatedby")
            obj.updatedby = user_id
            obj.updatedon = timezone.now()
            obj.save()

            return Response(
                ReviewsSerializer(obj, context={"request": request}).data,
                status=status.HTTP_200_OK,
            )
        except Http404:
            return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReviewsDeleteView(APIView):
    """DELETE api/reviews/delete/<review_code>/"""
    permission_classes = [AllowAny]

    def delete(self, request, review_code):
        try:
            obj = get_object_or_404(
                Reviews.objects.select_related("farmer_code__user_code"),
                review_code=review_code,
            )

            provided_user_code = _resolve_user_code(request)
            owner_code = getattr(obj.farmer_code, "user_code_id", None) or getattr(getattr(obj.farmer_code, "user_code", None), "user_code", None)
            if (
                provided_user_code
                and owner_code
                and provided_user_code != owner_code
                and not getattr(request.user, "is_staff", False)
            ):
                return Response(
                    {"error": "You can only delete your own reviews."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            obj.delete()
            return Response(
                {"message": "Review deleted successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )
        except Http404:
            return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            return Response({"error": "Cannot delete review due to linked records"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)