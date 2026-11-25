from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.profile_url = reverse("user_profile")
        self.token_refresh_url = reverse("token_refresh")

        self.user_data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!",
            "first_name": "Test",
            "last_name": "User",
        }

    def test_successful_registration(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertEqual(response.data["user"]["username"], "testuser")
        self.assertTrue(User.objects.filter(username="testuser").exists())

    def test_duplicate_email_registration_fails(self):
        self.client.post(self.register_url, self.user_data)
        duplicate_data = self.user_data.copy()
        duplicate_data["username"] = "anotheruser"
        response = self.client.post(self.register_url, duplicate_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_mismatched_password_registration_fails(self):
        bad_data = self.user_data.copy()
        bad_data["confirm_password"] = "MismatchedPassword123!"
        response = self.client.post(self.register_url, bad_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", response.data)

    def test_successful_login(self):
        User.objects.create_user(
            username="loginuser",
            email="loginuser@example.com",
            password="StrongPassword123!",
        )
        response = self.client.post(
            self.login_url,
            {"username": "loginuser", "password": "StrongPassword123!"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)

    def test_login_with_invalid_credentials_fails(self):
        response = self.client.post(
            self.login_url,
            {"username": "nonexistent", "password": "WrongPassword!"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        User.objects.create_user(
            username="refreshuser",
            email="refreshuser@example.com",
            password="StrongPassword123!",
        )
        login_resp = self.client.post(
            self.login_url,
            {"username": "refreshuser", "password": "StrongPassword123!"},
        )
        refresh_token = login_resp.data["refresh"]

        refresh_resp = self.client.post(
            self.token_refresh_url,
            {"refresh": refresh_token},
        )
        self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_resp.data)

    def test_unauthenticated_profile_access_denied(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
