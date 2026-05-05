from django.test import SimpleTestCase

from apps.follows import selectors


class FollowSelectorImportTests(SimpleTestCase):
    def test_follow_relationship_selector_exists(self) -> None:
        self.assertTrue(callable(selectors.follow_relationships_for_user))
