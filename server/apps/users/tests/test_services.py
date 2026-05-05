from django.test import SimpleTestCase

from apps.users import services


class UserServiceImportTests(SimpleTestCase):
    def test_profile_image_validation_accepts_known_image_type(self):
        image = type("Upload", (), {"content_type": "image/png", "size": 1024})()
        self.assertIsNone(services.validate_profile_image(image_file=image))
