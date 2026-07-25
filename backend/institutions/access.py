"""
Permission + institution-scoping helpers, driven entirely by the
roles / permissions / roles_permissions tables (institutions/models.py).

SUPER_ADMIN is treated as platform-level and bypasses both permission
and institution-scoping checks everywhere.
"""
from institutions.models import (
    RolePermission, Institution, Manager, Educator, Student, Guardian, StudentGuardian,
)


def load_permissions(user):
    """
    Returns the set of permission names granted to this user's role,
    or the sentinel 'ALL' for SUPER_ADMIN (unrestricted).
    """
    if user.role.name.upper() == 'SUPER_ADMIN':
        return 'ALL'
    return set(
        RolePermission.objects.filter(role_id=user.role_id)
        .values_list('permission__name', flat=True)
    )


def has_permission(user, name):
    perms = getattr(user, 'permissions', None)
    if perms == 'ALL':
        return True
    return bool(perms) and name in perms


def resolve_institution_id(user):
    """
    The single institution this user's role is bound to, or None if the
    role isn't bound to exactly one institution (SUPER_ADMIN, PARENT,
    or an OWNER who may own more than one — see owned_institution_ids).
    """
    role = user.role.name.upper()

    if role == 'MANAGER':
        try:
            return user.manager_profile.institution_id
        except Exception:
            return None

    if role == 'EDUCATOR':
        try:
            return user.educator_profile.institution_id
        except Exception:
            return None

    if role == 'STUDENT':
        try:
            student = user.student_profile
        except Exception:
            return None
        if student.batch_id:
            return student.batch.institution_id
        return student.institution_id

    return None


def owned_institution_ids(user):
    """All institution ids this OWNER owns (usually one, but not assumed)."""
    return list(user.owned_institutions.filter(is_deleted=False).values_list('id', flat=True))


def scoped_institution_filter(user, field='institution_id'):
    """
    A **kwargs dict to AND onto a queryset, restricting results to the
    institution(s) this user may see. {} means unrestricted (SUPER_ADMIN).
    """
    role = user.role.name.upper()

    if role == 'SUPER_ADMIN':
        return {}

    if role == 'OWNER':
        return {f'{field}__in': owned_institution_ids(user)}

    inst_id = resolve_institution_id(user)
    return {field: inst_id} if inst_id else {f'{field}__in': []}


def institution_member_user_ids(institution_ids):
    """
    All User ids "enrolled in" the given institutions: the owner(s), plus
    every manager/educator/student/guardian attached to them. Used to scope
    audit/login-activity views to a single OWNER's institution(s).
    """
    if not institution_ids:
        return []

    ids = set(
        Institution.objects.filter(id__in=institution_ids)
        .values_list('owner_id', flat=True)
    )
    ids.update(
        Manager.objects.filter(institution_id__in=institution_ids)
        .values_list('user_id', flat=True)
    )
    ids.update(
        Educator.objects.filter(institution_id__in=institution_ids)
        .exclude(user_id=None).values_list('user_id', flat=True)
    )
    ids.update(
        Student.objects.filter(institution_id__in=institution_ids, is_deleted=False)
        .exclude(user_id=None).values_list('user_id', flat=True)
    )
    guardian_ids = StudentGuardian.objects.filter(
        student__institution_id__in=institution_ids, student__is_deleted=False,
    ).values_list('guardian_id', flat=True)
    ids.update(
        Guardian.objects.filter(id__in=guardian_ids)
        .exclude(user_id=None).values_list('user_id', flat=True)
    )
    return list(ids)


def is_institution_allowed(user, institution_id):
    """Can this user create/modify records belonging to institution_id?"""
    if institution_id is None:
        return False

    role = user.role.name.upper()

    if role == 'SUPER_ADMIN':
        return True

    if role == 'OWNER':
        return int(institution_id) in owned_institution_ids(user)

    return resolve_institution_id(user) == int(institution_id)
