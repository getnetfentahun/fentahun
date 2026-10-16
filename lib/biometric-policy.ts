export function canManageBiometrics(role: string): boolean {
  return role === "ADMIN" || role === "HR";
}

export function getCameraFailureMessage(errorName: string): string {
  if (errorName === "NotAllowedError" || errorName === "SecurityError") {
    return "Camera permission was denied. Allow camera access in your browser settings and try again.";
  }
  if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
    return "No camera was found on this device.";
  }
  if (errorName === "NotReadableError" || errorName === "TrackStartError") {
    return "The camera is busy or unavailable. Close other apps using it and try again.";
  }
  return "The camera could not be opened. Check browser permission and try again.";
}
