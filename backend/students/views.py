from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from institutions.views import JWTView
from institutions.models import Student, Guardian, StudentGuardian
from institutions.access import scoped_institution_filter, is_institution_allowed, load_permissions
from institutions.jwt_utils import generate_access_token, generate_refresh_token
from .serializers import StudentSerializer, StudentListSerializer, GuardianSerializer
from .services import StudentService


class StudentSignupView(APIView):
    """
    Public: a prospective student creates their own account, picking the
    institution they want to enroll in, and is logged straight in — no
    staff approval step. Batch assignment is left to a manager afterwards.
    """

    def post(self, request):
        try:
            student, user = StudentService.register_student(request.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        access_token  = generate_access_token(user)
        refresh_token = generate_refresh_token(user)
        perms = load_permissions(user)

        response = Response({
            'message': 'Account created successfully.',
            'user': {
                'id':              user.id,
                'username':        user.username,
                'email':           user.email,
                'role':            user.role.name,
                'role_id':         user.role_id,
                'institution_id':  student.institution_id,
                'permissions':     'ALL' if perms == 'ALL' else sorted(perms),
            },
            'access':  access_token,
            'refresh': refresh_token,
        }, status=status.HTTP_201_CREATED)

        response.set_cookie(
            key='access_token', value=access_token,
            httponly=True, secure=False, samesite='Lax',
            max_age=60 * 60 * 8, path='/',
        )
        response.set_cookie(
            key='refresh_token', value=refresh_token,
            httponly=True, secure=False, samesite='Lax',
            max_age=60 * 60 * 24 * 7, path='/',
        )
        return response


class StudentMyGuardiansView(JWTView):
    """
    Self-service: GET lists guardians linked to the logged-in student's own
    profile, POST adds one (reusing an existing Guardian by email if a
    sibling already added them, so they share the same parent dashboard).
    """
    allowed_roles = ['STUDENT']

    def _student(self, request):
        try:
            return request.current_user.student_profile
        except Student.DoesNotExist:
            return None

    def get(self, request):
        student = self._student(request)
        if not student:
            return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        guardians = StudentService.list_guardians_for_student(student)
        return Response(GuardianSerializer(guardians, many=True).data)

    def post(self, request):
        student = self._student(request)
        if not student:
            return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            guardian, created, linked = StudentService.add_guardian_for_student(student, request.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not linked:
            message = f"{guardian.name} is already linked to your account."
        elif created:
            message = f"Guardian account created for {guardian.name} and linked to your profile."
        else:
            message = f"Linked existing guardian account for {guardian.name}."

        return Response(
            {'message': message, 'data': GuardianSerializer(guardian).data},
            status=status.HTTP_201_CREATED if linked else status.HTTP_200_OK,
        )


class StudentListCreateView(JWTView):
    # Student record administration is a staff function — a STUDENT role's
    # own view_student/create_student grants (meant for self-service, not
    # yet built) intentionally don't reach this bulk staff endpoint.
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']
    permission_map = {'GET': 'view_student', 'POST': 'create_student'}

    def get(self, request):
        search         = request.query_params.get('search', '')
        batch_id       = request.query_params.get('batch', None)

        students = Student.objects.filter(
            is_deleted=False
        ).select_related('batch', 'institution', 'user')
        students = students.filter(**scoped_institution_filter(request.current_user, field='institution_id'))

        if search:
            students = students.filter(name__icontains=search) | \
                       students.filter(registration_no__icontains=search) | \
                       students.filter(email__icontains=search)

        if batch_id:
            students = students.filter(batch_id=batch_id)

        serializer = StudentListSerializer(students, many=True)
        return Response(serializer.data)

    def post(self, request):
        data         = request.data
        guardian_ids = request.data.get('guardian_ids', [])

        institution_id = None
        batch_id = data.get('batch_id')
        if batch_id:
            from institutions.models import Batch
            try:
                institution_id = Batch.objects.get(id=batch_id).institution_id
            except Batch.DoesNotExist:
                return Response({'error': 'Batch not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if institution_id and not is_institution_allowed(request.current_user, institution_id):
            return Response(
                {'error': 'You cannot add students to this institution.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            student    = StudentService.create_student(data, guardian_ids)
            serializer = StudentSerializer(student)
            return Response(
                {'message': 'Student created successfully.', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StudentDetailView(JWTView):
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']
    permission_map = {'GET': 'view_student', 'PUT': 'edit_student', 'DELETE': 'delete_student'}

    def get_object(self, request, pk):
        try:
            student = Student.objects.select_related(
                'batch', 'institution', 'user'
            ).prefetch_related(
                'student_guardians__guardian'
            ).get(id=pk, is_deleted=False)
        except Student.DoesNotExist:
            return None

        if not is_institution_allowed(request.current_user, student.institution_id):
            return None
        return student

    def get(self, request, pk):
        student = self.get_object(request, pk)
        if not student:
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = StudentSerializer(student)
        return Response(serializer.data)

    def put(self, request, pk):
        if not self.get_object(request, pk):
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        target_batch_id = request.data.get('batch_id')
        if target_batch_id:
            from institutions.models import Batch
            try:
                target_institution_id = Batch.objects.get(id=target_batch_id).institution_id
            except Batch.DoesNotExist:
                return Response({'error': 'Batch not found.'}, status=status.HTTP_400_BAD_REQUEST)
            if not is_institution_allowed(request.current_user, target_institution_id):
                return Response(
                    {'error': 'You cannot move students to this institution.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        guardian_ids = request.data.get('guardian_ids', None)
        try:
            student    = StudentService.update_student(pk, request.data, guardian_ids)
            serializer = StudentSerializer(student)
            return Response(
                {'message': 'Student updated successfully.', 'data': serializer.data}
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not self.get_object(request, pk):
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            StudentService.delete_student(pk)
            return Response({'message': 'Student deleted successfully.'})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class GuardianListCreateView(JWTView):
    """
    GET is scoped to guardians linked to a student in the caller's own
    institution(s) — e.g. a MANAGER creating/editing a student should only
    see that institution's guardians, not every guardian platform-wide.
    """
    permission_map = {'GET': 'view_guardian', 'POST': 'manage_guardian'}

    def get(self, request):
        student_filter = scoped_institution_filter(request.current_user, field='institution_id')
        guardian_ids = StudentGuardian.objects.filter(
            student__is_deleted=False,
            **{f'student__{key}': value for key, value in student_filter.items()}
        ).values_list('guardian_id', flat=True).distinct()

        guardians  = Guardian.objects.filter(id__in=guardian_ids).order_by('name')
        serializer = GuardianSerializer(guardians, many=True)
        return Response(serializer.data)

    def post(self, request):
        try:
            guardian   = StudentService.create_guardian(request.data)
            serializer = GuardianSerializer(guardian)
            return Response(
                {'message': 'Guardian created successfully.', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
