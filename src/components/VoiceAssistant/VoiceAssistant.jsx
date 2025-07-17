import { useState, useEffect, useRef } from "react";

const getUsername = () => {
  return localStorage.getItem("username") || "unknown_user";
};

const getAuthToken = () => {
  if (typeof window === "undefined") return "";
  try {
    const rawToken =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token") ||
      "";
    return rawToken ? `Bearer ${rawToken}` : "";
  } catch (error) {
    console.error("Error retrieving auth token:", error);
    return "";
  }
};

export default function VoiceAssistant() {
  const [status, setStatus] = useState("idle");
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Initialize WebRTC
  const initWebRTC = async () => {
    try {
      setStatus("connecting");

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      // Add local audio track
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
      ``;

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      const username = getUsername();
      const authHeader = getAuthToken();
      const token = authHeader.replace(/^Bearer\s+/i, ""); // Remove "Bearer " prefix

      // Create websocket connection
      const wsUrl = new URL("wss://llm.edusmartai.com/api/webrtc/assistant");
      wsUrl.searchParams.append("username", username);
      wsUrl.searchParams.append("token", token);

      // Create websocket connection
      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        // Create offer
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            ws.send(
              JSON.stringify({
                type: "offer",
                sdp: pc.localDescription.sdp,
              })
            );
          });
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(message));
          setStatus("connected");
        } else if (message.type === "candidate") {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
          } catch (e) {
            console.error("Error adding ICE candidate:", e);
          }
        }
      };
    } catch (error) {
      console.error("WebRTC setup error:", error);
      setStatus("error");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pcRef.current) pcRef.current.close();
      if (wsRef.current) wsRef.current.close();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="voice-assistant">
      <div className="status">Status: {status}</div>
      <button onClick={initWebRTC} disabled={status !== "idle"}>
        Start Voice Assistant
      </button>

      <audio ref={localAudioRef} muted autoPlay playsInline />
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
}
