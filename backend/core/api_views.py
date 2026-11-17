
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



class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        try:
            user = Users.objects.get(
                username=username,
                status=1
            )
        except Users.DoesNotExist:
            return Response(
                {
                    "error": "User not found or inactive"
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check encrypted password
        if not check_password(password, user.password):
            return Response(
                {
                    "error": "Invalid password"
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get User Type Name
        usertype_name = None

        if user.usertype_code:
            try:
                usertype = UsertypeMaster.objects.get(
                    usertype_code=user.usertype_code
                )
                usertype_name = usertype.usertype_name

            except UsertypeMaster.DoesNotExist:
                pass

        # Session Management
        request.session["user_id"] = user.user_id
        request.session["username"] = user.username
        request.session["usertype_code"] = user.usertype_code
        request.session["login_time"] = str(timezone.now())
        request.session.save()

        # Update Last Visit
        user.lastvisiton = timezone.now()
        user.save(update_fields=["lastvisiton"])

        # JWT Token
        refresh = RefreshToken.for_user(user)

        # Permissions
        permissions_response = {
            "modules": {},
            "submodules": {},
            "activities": {}
        }

        if user.usertype_code:
            try:
                all_permissions = Permissions.objects.filter(
                    usertype_code=user.usertype_code
                )

                for p in all_permissions:

                    perm_dict = {
                        "e_read": p.e_read,
                        "e_write": p.e_write,
                        "e_update": p.e_update
                    }

                    if p.activity_code:
                        permissions_response["activities"][
                            p.activity_code
                        ] = perm_dict

                    elif p.submodule_code:
                        permissions_response["submodules"][
                            p.submodule_code
                        ] = perm_dict

                    elif p.module_code:
                        permissions_response["modules"][
                            p.module_code
                        ] = perm_dict

            except Exception as e:
                logger.error(
                    f"Error fetching permissions: {str(e)}"
                )
        
        domain = None
        try:
            domain_setting = Settings.objects.get(setting_name="domain")
            domain = domain_setting.setting_value
        except Settings.DoesNotExist:
            pass

        # Final Response
        response_data = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "user_id": user.user_id,
            "usertype_code": user.usertype_code,
            "usertype_name": usertype_name,
            "company_code": user.company_code,
            "employee_code": user.employee_code,
            "status": user.status,
            "permission_details": permissions_response,
            "domain": domain
        }

        # Return doctor_code only for doctors
        if user.usertype_code == "DOC":
            response_data["doctor_code"] = user.doctor_code

        return Response(
            response_data,
            status=status.HTTP_200_OK
        )

class RegisterView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request):
        data = request.data
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)

        if Users.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

        max_id = Users.objects.aggregate(Max('user_id'))['user_id__max']
        next_user_id = (max_id or 0) + 1 

        create_params = {
            "user_id": next_user_id,
            "status": 1,
            "superuser": 0,
            "createdon": timezone.now(),
            "lastvisiton": timezone.now(),
        }

        fk_fields = ['company_code', 'usertype_code', 'employee_code']

        for key, value in data.items():
            if value is not None and value != "":
                if key == 'password':
                    create_params['password'] = make_password(value)
                elif key in fk_fields:
                    create_params[f"{key}_id"] = value
                else:
                    create_params[key] = value

        if not create_params.get("createdby"):
            create_params["createdby"] = next_user_id

        try:
            user = Users.objects.create(**create_params)
            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "User registered successfully",
                "user_id": user.user_id,
                "username": user.username,
                "createdon": user.createdon,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": f"Database Error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)




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
        
        
        
# Equipments

from django.utils import timezone

class EquipmentListView(APIView):
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            objs = Equipment.objects.all().order_by("equipment_code")
            serializer = EquipmentSerializer(objs, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
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