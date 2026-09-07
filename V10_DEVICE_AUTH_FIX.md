# V10 Device Authentication Fix

## Problem
After device activation, Guard/Attendance could fail with `auth/admin-restricted-operation` because `signInAnonymously()` was attempted when Firebase Anonymous Authentication was not enabled, or because the existing Auth session was not restored before a new sign-in was requested.

## Fix
- Device auth now restores/persists the Firebase Auth session with `browserLocalPersistence` before attempting a new anonymous sign-in.
- Existing authenticated device sessions are reused.
- The `auth/admin-restricted-operation` error is converted into an actionable Firebase setup message.
- Device setup uses the same persistence configuration and actionable error handling.
- Guard and Attendance application files are preserved unchanged.

## Required Firebase Console setting
In Firebase Console → Authentication → Sign-in method, enable **Anonymous** authentication for project `newlook-dc1cf`.

This is required because the existing V10 device architecture uses anonymous Firebase Auth for device identities and Firestore device authorization.


## One-Time Device Activation
Guard and Attendance are designed for one-time activation per physical browser/device. After an administrator-generated setup code is successfully claimed, the device identity, tenant, site, type and active status are persisted locally and the Firebase anonymous authentication session uses browser-local persistence. Normal launches therefore open the Guard or Attendance application directly without requiring the setup code again. Re-activation is only required when the device is deactivated, its local activation data is removed, the browser/device storage is reset, or the administrator registers a replacement device.

The activation cleanup path removes only NEWLOOK device keys; it does not clear unrelated application localStorage.
