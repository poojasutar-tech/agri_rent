

# =====================================================================
#  IMPORTS
# =====================================================================
from datetime import date, datetime, time
from decimal import Decimal, ROUND_HALF_UP

import razorpay
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

import razorpay
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from .models import BookingStatusHistory, Payments

# from .models import (
#     Bookings, BookingStatusHistory, Payments, Reviews,
#     Equipment, FarmerProfiles, Users,
# )

# Keep in sync with PLATFORM_FEE_PERCENT in marketplace-api.js (frontend)
PLATFORM_FEE_PERCENT = Decimal('5')
MAX_RENTAL_DAYS = 30


# =====================================================================
#  HELPERS
# =====================================================================
def next_code(model, field, prefix, width=6):
    """BK000001, PAY000001, REV000001 ...   Call ONLY inside transaction.atomic()."""
    last = model.objects.select_for_update().order_by('id').last()
    number = 1
    if last and getattr(last, field):
        try:
            number = int(getattr(last, field).replace(prefix, "")) + 1
        except ValueError:
            number = 1
    return f"{prefix}{number:0{width}d}"


def make_dt(day, at):
    """date + time -> datetime (timezone-aware only when USE_TZ is True)."""
    value = datetime.combine(day, at)
    return timezone.make_aware(value) if settings.USE_TZ else value


def money(value):
    return Decimal(value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def razorpay_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def log_status(booking, old, new, remarks, user=None):
    BookingStatusHistory.objects.create(
        booking_code=booking,
        old_status=old,
        new_status=new,
        changed_by=user,
        remarks=remarks,
        changedon=timezone.now(),
    )


def error(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({"error": message}, status=code)


def latest_payment(booking):
    return Payments.objects.filter(booking_code=booking).order_by('-id').first()