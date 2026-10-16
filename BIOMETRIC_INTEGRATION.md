# Biometric integration readiness

## Current implementation

The `/biometric` route is an authenticated development prototype. ADMIN and HR can view the employee enrollment-readiness list; EMPLOYEE can view only their own status. Every employee is explicitly shown as **Not enrolled**. There is no face detector, face matcher, enrollment action, liveness check, biometric template storage, or biometric attendance write.

The optional camera control calls `getUserMedia` only after a click. It displays a local browser preview, does not capture or upload a frame, and stops its media tracks when stopped or when the component is removed. Camera availability and permission are not identity verification.

Fingerprint scanning is marked **Hardware not connected**. The UI does not simulate a scan. Manual attendance remains available at `/attendance`.

## Work required before real biometric use

1. Select a supported face/fingerprint vendor and device after evaluating independent presentation-attack detection (PAD), documented false accept/reject rates, accessibility, and supported browsers/OS. Basic face detection, a still photograph, or a user-held challenge is not adequate liveness evidence.
2. Obtain explicit, informed consent and establish a lawful basis with local counsel. Explain purpose, retention, access, sharing, breach handling, and consequences. Provide a genuinely usable non-biometric attendance alternative without penalty where required.
3. Complete a privacy impact assessment and security review, limit enrollment operators to ADMIN/HR, audit enrollment/withdrawal, and define deletion/retention procedures before collecting any templates.
4. Keep raw face/fingerprint images out of browser uploads, logs, and the general application database. Prefer vendor/device-held templates or encrypted, access-controlled templates in a dedicated biometric service with key rotation and strict retention. Never expose templates to client components.
5. Have a trusted verifier return a signed, short-lived, one-time assertion bound to employee, challenge, and timestamp. The server must validate that assertion and liveness result, re-check the current user role, and only then write attendance. Handle confidence thresholds, replay, spoof/failure, device errors, and fallback manually.
6. Add audit trails and rate limits; do not identify an employee solely from an untrusted browser-supplied employee ID or face-match score.

## Database method tracking

The current `Attendance` table has a unique `(employeeId, attendanceDate)` constraint, but does not record an attendance method. The prototype does not create biometric attendance, so no migration is needed now. Before production method-tracking writes, add an additive Prisma migration for an `AttendanceMethod` enum (for example `MANUAL`, `FACE`, `FINGERPRINT`) and a non-null `method` column with `MANUAL` as the default for existing rows. Apply with the project's normal migration workflow; never reset the database.
