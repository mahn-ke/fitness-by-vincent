# Settings the image's settings.main doesn't read from the environment.
# Mounted into the web container as settings/fitness.py.

from settings.main import *  # noqa: F403

# allauth binds the app's refresh tokens to a Django session, so the session
# has to live as long as the refresh token (REFRESH_TOKEN_LIFETIME in
# prod.env). Every token refresh saves the session and extends it again.
SESSION_COOKIE_AGE = REFRESH_TOKEN_LIFETIME_HOURS * 3600  # noqa: F405

# Keep the refresh token across refreshes. With rotation, a refresh whose
# response never reaches the phone (timeout, flaky mobile data) leaves the app
# holding the old, already invalidated token, and its next refresh ends the
# session. The session is still saved and extended on every refresh, and a
# logout still invalidates the token by ending the session it is bound to.
HEADLESS_JWT_ROTATE_REFRESH_TOKEN = False
