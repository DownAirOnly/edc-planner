# EDC Pocket — Firebase setup (account rollout)

The live app currently runs without accounts. This development branch prepares the first account release; do not enable it until the following steps are completed.

1. Create a **new, separate Firebase project**, not Everyday's or Botanica's.
2. Register a Web app. Paste its public `firebaseConfig` into `firebase-config.js` as `window.EDC_FIREBASE_CONFIG = { ... };`. Never paste a service-account key.
3. In Firebase Authentication → Sign-in method, enable **Google**. In Settings → Authorized domains, add `downaironly.github.io` (the hostname, not the repository path).
4. Create a Cloud Firestore database and publish the contents of `firestore.rules` as the database security rules. Start with these deny-by-default rules, not test mode.
5. Open the staging/preview build and test on iOS Safari **and** the installed Home Screen PWA. Pop-up authentication can be blocked on some mobile environments; GitHub Pages also has limitations for Firebase redirect sign-in. Do not ship until the relevant flow is working.
6. With a previously saved schedule in localStorage `edcpocket_2026_v1`, sign in and confirm all selections and meetup pins survive, and that a second device restores them.
7. Confirm a failed/offline login never erases guest picks; a failed cloud write must not display "Saved to cloud".
8. Deploy only after signing in, signing out, offline edits, and restoring from the old JSON backup have passed validation.

## Current data layout

- `users/{uid}/data/schedule`: selected set IDs, friendName, lead, meet, updatedAt
- `users/{uid}/settings/profile`: user-chosen `screenName`, updatedAt
- Local data: `edcpocket_2026_v1` retained, plus a `before_cloud` safety backup and a migration marker.
- No user directory, email fields, social graph, or discoverability published in this rollout.

## Security

Google account email, full name, and profile photo are not written into the public database. User-chosen display names are private in this rollout. The future friends feature should use a separate opt-in public profile collection and explicit friend-approved schedule visibility. Rules are deny-by-default except each authenticated user’s own data.

Firebase web config is public by design, but protect Firestore with rules, enable App Check if appropriate, and monitor abuse and quotas.