# actor.py  (same folder as api_views.py / models.py)
from .models import FarmerProfiles


def get_actor(request):
    """
    Returns the app user (the model FarmerProfiles.user_code points to) for the
    logged-in JWT user, or None when the two cannot be matched.

    Why this exists: request.user is whatever model the JWT was issued for.
    If that is Django's built-in auth User, it has no `user_code` / `role`.
    """
    cached = getattr(request, "_actor", None)
    if cached is not None:
        return cached

    auth_user = request.user

    # Case 1: the JWT user already is the app user
    if getattr(auth_user, "user_code", None):
        request._actor = auth_user
        return auth_user

    # Case 2: JWT user is a different table -> match on a shared unique field.
    # (Never match on `id`: ids of two different tables are unrelated.)
    app_user_model = FarmerProfiles._meta.get_field("user_code").related_model
    concrete = {f.name for f in app_user_model._meta.get_fields() if getattr(f, "concrete", False)}
    for field in ("email", "username", "mobile", "phone"):
        value = getattr(auth_user, field, None)
        if value and field in concrete:
            actor = app_user_model.objects.filter(**{field: value}).first()
            if actor:
                request._actor = actor
                return actor

    return None