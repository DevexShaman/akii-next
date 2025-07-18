import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [audioLevel, setAudioLevel] = useState(0);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);

  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const rawAudioRef = useRef([]);
  const sendIntervalRef = useRef(null);
  const [transcription, setTranscription] = useState("");
  const isPlayingRef = useRef(false);
  const audioQueueRef = useRef([]);

  const initWebRTC = async () => {
    try {
      setStatus("connecting");
      console.log("Getting user media...");

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          noiseSuppression: true,
          echoCancellation: true,
        },
      });
      mediaStreamRef.current = stream;

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      const playAudioBuffer = async (arrayBuffer) => {
        try {
          const context = new (window.AudioContext ||
            window.webkitAudioContext)();
          const audioBuffer = await context.decodeAudioData(arrayBuffer);
          const source = context.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(context.destination);
          source.start(0);
          source.onended = () => context.close();
        } catch (e) {
          console.error("Error playing audio:", e);
        }
      };

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const analyzer = audioContext.createAnalyser();
      analyzerRef.current = analyzer;
      analyzer.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);
      visualizeAudio();

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Process audio chunks
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        rawAudioRef.current.push(pcmData);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          // Add your TURN servers here if needed
        ],
        iceTransportPolicy: "all",
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      });
      pcRef.current = pc;
      console.log("PeerConnection created");
      // Add local audio track
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
      ``;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const ws = wsRef.current;
          if (ws && ws.readyState === WebSocket.OPEN) {
            console.log("Sending ICE candidate", event.candidate);
            ws.send(
              JSON.stringify({
                type: "candidate",
                candidate: event.candidate,
              })
            );
          }
        }
      };

      pc.ontrack = (event) => {
        console.log("Received remote tracks");
        if (remoteAudioRef.current && !remoteAudioRef.current.srcObject) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current
            .play()
            .catch((e) => console.error("Remote audio play error:", e));
        }
      };
      const username = getUsername();
      const authHeader = getAuthToken();
      const token = authHeader.replace(/^Bearer\s+/i, "");

      const wsUrl = new URL("wss://llm.edusmartai.com/api/ws/assistant");
      wsUrl.searchParams.append("username", username);
      wsUrl.searchParams.append("token", token);

      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");

        sendIntervalRef.current = setInterval(() => {
          if (
            rawAudioRef.current.length === 0 ||
            ws.readyState !== WebSocket.OPEN
          )
            return;

          const chunks = [...rawAudioRef.current];
          rawAudioRef.current = [];

          const totalLength = chunks.reduce(
            (acc, chunk) => acc + chunk.length,
            0
          );
          const combined = new Int16Array(totalLength);
          let offset = 0;

          chunks.forEach((chunk) => {
            combined.set(chunk, offset);
            offset += chunk.length;
          });

          ws.send(combined.buffer);
        }, 3000);
        // Create offer
        pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        })
          .then((offer) => {
            console.log("Created offer:", offer);
            return pc.setLocalDescription(offer);
          })
          .then(() => {
            console.log("Sending offer:", pc.localDescription);
            ws.send(
              JSON.stringify({
                type: "offer",
                sdp: pc.localDescription.sdp,
              })
            );
          })
          .catch((error) => {
            console.error("Offer error:", error);
            setStatus("error");
          });
      };

      ws.onmessage = async (event) => {
        console.log("WebSocket message:", event.data);

        if (event.data instanceof Blob) {
          console.log("Received Blob audio");
          const arrayBuffer = await event.data.arrayBuffer();
          playAudioBuffer(arrayBuffer);
        } else if (event.data instanceof ArrayBuffer) {
          console.log("Received ArrayBuffer audio");
          playAudioBuffer(event.data);
        }
        // Handle text messages (signaling and transcriptions)

        // Handle text messages (WebRTC signaling)
        else if (typeof event.data === "string") {
          try {
            const message = JSON.parse(event.data);

            if (message.type === "answer") {
              console.log("Received answer");
              await pc.setRemoteDescription(new RTCSessionDescription(message));
              setStatus("connected");
            } else if (message.type === "candidate") {
              console.log("Received ICE candidate");
              await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
            }
          } catch (error) {
            console.error("Message handling error:", error);
          }
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("error");
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        setStatus("idle");
        cleanup();
      };
    } catch (error) {
      console.error("WebRTC setup error:", error);
      setStatus("error");
      cleanup();
    }
  };

  const visualizeAudio = () => {
    if (!analyzerRef.current) return;

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyzer.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      setAudioLevel(average / 128);
    };

    draw();
  };

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    rawAudioRef.current = [];

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    rawAudioRef.current = [];
    mediaStreamRef.current = null;
    pcRef.current = null;
    wsRef.current = null;
    analyzerRef.current = null;
    audioContextRef.current = null;
    processorRef.current = null;
  };

  const stopAssistant = () => {
    setStatus("idle");
    cleanup();
  };

  useEffect(() => {
    return cleanup;
  }, []);

  const statusColors = {
    idle: "bg-gray-500",
    connecting: "bg-yellow-500",
    connected: "bg-green-500",
    error: "bg-red-500",
  };

  const statusMessages = {
    idle: "Ready to start",
    connecting: "Connecting...",
    connected: "Listening...",
    error: "Connection error",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Voice Assistant</h1>
          <p className="text-indigo-200 mt-1">AI-powered voice assistant</p>
        </div>

        <div className="p-8 flex flex-col items-center">
          <div className="relative mb-8">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-inner">
              <AnimatePresence>
                {status === "connected" && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-indigo-200 opacity-20"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </AnimatePresence>

              <div className="relative z-10">
                <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center">
                  {/* Microphone Button */}
                  <motion.button
                    onClick={status === "idle" ? initWebRTC : stopAssistant}
                    className={`w-20 h-20 rounded-full flex items-center justify-center focus:outline-none ${
                      status === "idle"
                        ? "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {status === "idle" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Audio Visualizer */}
            {status === "connected" && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-1 h-8">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 bg-indigo-500 rounded-t"
                    animate={{
                      height: Math.max(
                        4,
                        audioLevel * 20 * (i % 3 === 0 ? 1.5 : 1)
                      ),
                    }}
                    transition={{
                      duration: 0.1,
                      ease: "easeOut",
                    }}
                    style={{ originY: 1 }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center mb-2">
              <motion.div
                className={`w-3 h-3 rounded-full mr-2 ${statusColors[status]}`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <span className="text-gray-700 font-medium">
                {statusMessages[status]}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${statusColors[status]}`}
                initial={{ width: 0 }}
                animate={{
                  width:
                    status === "connecting"
                      ? "60%"
                      : status === "connected"
                      ? "100%"
                      : "0%",
                }}
                transition={{
                  duration: status === "connecting" ? 2 : 0.5,
                  repeat: status === "connecting" ? Infinity : 0,
                  repeatType: "reverse",
                }}
              />
            </div>
          </div>

          <div className="mt-8 text-center text-gray-600 text-sm">
            {status === "idle" && <p>Click the microphone to start speaking</p>}
            {status === "connected" && (
              <p>Speak naturally - I'm listening to you</p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 text-center text-gray-500 text-sm">
          Powered by WebRTC & AI
        </div>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg max-w-full">
          <p className="text-sm text-gray-700 font-semibold">Transcription:</p>
          <p className="text-gray-600 break-words">{transcription}</p>
        </div>
      </div>
      <audio
        ref={localAudioRef}
        muted
        autoPlay
        playsInline
        className="hidden"
      />

      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
    </div>
  );
}
