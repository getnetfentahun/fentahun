"use client";

import { useEffect, useRef, useState } from "react";
import { getCameraFailureMessage } from "@/lib/biometric-policy";

type CameraState = "idle" | "loading" | "ready" | "error";

export default function BiometricCameraPrototype() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(false);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (state === "ready" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [state]);

  async function startCamera() {
    if (state === "loading" || state === "ready") return;
    setState("loading");
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is unavailable. Use a supported browser on HTTPS or localhost.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setState("ready");
    } catch (cause) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (!mountedRef.current) return;
      setState("error");
      setError(getCameraFailureMessage(cause instanceof Error ? cause.name : ""));
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
    setError("");
  }

  return (
    <div>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
        <div className="grid min-h-56 place-items-center overflow-hidden rounded-xl bg-slate-950">
          {state === "ready" ? (
            <video ref={videoRef} autoPlay playsInline muted aria-label="Local camera preview" className="h-full max-h-80 w-full object-cover" />
          ) : (
            <p className="max-w-xs px-6 text-center text-sm text-slate-300">
              {state === "loading" ? "Requesting camera access…" : "Camera is off. It will only be requested when you press the button."}
            </p>
          )}
        </div>
        <div className="flex flex-col items-start justify-center">
          <p className="text-sm font-semibold text-ink">Local camera permission test</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This development preview helps verify that a camera can be opened. Video stays in this browser tab; no image is captured, uploaded, matched, or saved.
          </p>
          {state === "error" && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
          {state === "ready" && (
            <p role="status" className="mt-3 text-sm font-medium text-emerald-700">Camera preview active. Identity is not verified.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {state !== "ready" ? (
              <button type="button" onClick={() => void startCamera()} disabled={state === "loading"}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60">
                {state === "loading" ? "Opening camera…" : "Allow camera preview"}
              </button>
            ) : (
              <button type="button" onClick={stopCamera}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                Stop camera
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
