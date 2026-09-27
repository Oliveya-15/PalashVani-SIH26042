# Auth feature -- design notes

This document is referenced from several code comments (`app/models/user.py`,
`app/core/security.py`, `app/services/auth_service.py`). It explains the
reasoning behind each decision, the way `docs/architecture.md` does for the
rest of the project.

## Why three roles, and why admin can't self-register

The SIH26042 problem statement is explicit about who this tool is for: a
government-owned (Dept. of Higher & Technical Education, Jharkhand)
classroom tool used directly by teachers, with students as the ultimate
beneficiaries. That maps to three roles:

- **teacher** -- the primary user, default on registration.
- **student** -- included because the brief named students as a possible
  user. It currently has *identical* permissions to teacher, since no
  student-specific screen exists in the app yet -- this is stated plainly
  rather than pretending the role does something it doesn't.
- **admin** -- represents departmental/government oversight. A real
  government system does not let the public internet self-assign
  administrative access by picking an option in a dropdown, so the
  `POST /api/auth/register` endpoint's schema (`SelfRegisterableRole` in
  `auth_schemas.py`) only accepts `teacher` or `student` -- `admin` is
  rejected with a 422 before it ever reaches business logic. The only way
  to create an admin account is `scripts/create_admin.py`, run directly
  against the database by whoever controls it. This mirrors how real
  institutional accounts are provisioned, and is honest about the fact
  that "admin" isn't a fully-built dashboard yet -- just a role, ready for
  future admin-only features to check against.

## Why JWT instead of session cookies

Your frontend (Vercel) and backend (Render) are on different origins/
domains, which makes cross-site cookies the more fragile option (SameSite
and CORS-with-credentials configuration, and some browsers restricting
third-party cookies by default). A bearer token stored in `localStorage`
and sent as an `Authorization: Bearer <token>` header sidesteps all of
that, at the cost of the token being readable by any JavaScript running on
the page (a standard, accepted trade-off for this class of app; the
mitigation is not shipping untrusted third-party scripts).

## Why this is a stateless design (and what that means for "logout")

There is no server-side session table or token revocation list. A JWT is
valid until it expires (`JWT_EXPIRE_MINUTES`, default 7 days) purely
because the server can verify its signature -- nothing is looked up in the
database to check if it's still "logged in." This has one real
consequence worth knowing: **"Log out" only deletes the token from the
browser.** If that exact token were copied elsewhere before logout, it
would still work until it naturally expires. For a classroom tool with no
sensitive personal data beyond a name/email/school, this is a reasonable
trade-off for the simplicity it buys; a production upgrade path would be
short-lived access tokens (e.g. 15 minutes) plus a refresh-token table
that can be revoked server-side.

## What was deliberately left out of this update

- **Password reset / "forgot password" flow.** Needs an email-sending
  service (another paid/optional dependency) to do properly -- flagged as
  a natural next step rather than half-implemented insecurely.
- **Email verification.** Same reasoning -- would need an email provider.
- **Protecting existing endpoints** (`/translations`, `/curriculum`,
  etc.) behind login. Deliberately not done: the person requesting this
  feature asked for login/register to be *added*, not for the existing,
  already-working, zero-friction classroom tool to suddenly require an
  account. Auth is additive here. If you want to require login for a
  specific route later, add `current_user: User = Depends(get_current_user)`
  to that route's function signature -- the dependency already exists and
  works.
- **Tying feedback submissions to a logged-in user.** Would need a schema
  change to the existing `Feedback` table (a nullable `user_id` column),
  which was avoided so this update touches zero existing tables. A future
  version could add this cleanly since `user_id` would simply be optional.
