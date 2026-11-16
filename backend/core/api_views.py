
from django.shortcuts import render
from django.http import JsonResponse
from .models import *
from .serializers import *
from rest_framework.permissions import AllowAny
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

    def get(self, request):
        try:
            objs = EquipmentCategories.objects.all().order_by("category_code")
            serializer = EquipmentCategoriesSerializer(objs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EquipmentCategoriesCreateView(APIView):

    def post(self, request):
        try:
            serializer = EquipmentCategoriesSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                serializer.save(
                    createdby=request.user.id,
                    createdon=timezone.now(),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EquipmentCategoriesUpdateView(APIView):

    def put(self, request, category_code):
        try:
            obj = get_object_or_404(EquipmentCategories, category_code=category_code)
            serializer = EquipmentCategoriesSerializer(obj, data=request.data, partial=True, context={"request": request})
            if serializer.is_valid():
                serializer.save(
                    updatedby=request.user.id,
                    updatedon=timezone.now()
                )
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EquipmentCategoriesDeleteView(APIView):

    def delete(self, request, category_code):
        try:
            obj = get_object_or_404(EquipmentCategories, category_code=category_code)
            obj.delete()
            return Response({"message": "Equipment Category deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
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
    def post(self, request):
        data = request.data
        email = data.get('email')
        mobile = data.get('mobile')

        # Check if email or mobile already exists
        if Users.objects.filter(email=email).exists():
            return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)
        if Users.objects.filter(mobile=mobile).exists():
            return Response({"error": "Mobile number already registered"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Generate a unique user code
            count = Users.objects.count() + 1
            user_code = f"USR-{count:04d}"

            # Create user and save createdon, status, email_verified, mobile_verified
            user = Users.objects.create(
                user_code=user_code,
                full_name=data.get('full_name'),
                email=email,
                mobile=mobile,
                password_hash=make_password(data.get('password')),
                role=data.get('role', 'FARMER'),
                status=1,                  # 1 => Active
                email_verified=0,          # 0 => Unverified
                mobile_verified=0,         # 0 => Unverified
                createdon=timezone.now(),  # Explicitly save registration timestamp
            )

            # Update createdby to point to themselves since they created their own account
            user.createdby = user.id
            user.save(update_fields=['createdby'])

            return Response({
                "message": "Registration successful!",
                "user_id": user.id,
                "user_code": user.user_code,
                "role": user.role
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
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

                # Update last_login timestamp
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])

                return Response({
                    "message": "Login successful!",
                    "role": user.role,
                    "full_name": user.full_name,
                    "user_code": user.user_code,
                    "user_id": user.id
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid email/mobile or password."}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)