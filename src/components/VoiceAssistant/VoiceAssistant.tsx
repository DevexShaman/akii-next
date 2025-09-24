import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchOverallScoring } from "@/store/slices/assistant/assistantSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";


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

const CLASS_OPTIONS = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const ACCENT_OPTIONS = [
  "American",
  "British",
  "Australian",
  "Indian",
  "Canadian",
];

const difficultyOptions = [
  "Easy", "Medium", "Strong"
];


const MOOD_OPTIONS = [
  "Neutral",
  "Happy",
  "Excited",
  "Calm",
  "Serious",
  "Playful",
];

function safeParseData(data) {
  try {
    if (typeof data === "object" && data !== null) {
      return data;
    }
    if (typeof data === "string") {
      let cleaned = data.replace(/\bNone\b/g, "null");

      let parsed = JSON.parse(cleaned);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);

      }

      return parsed;
    }
    return null;
  } catch (err) {
    console.error("Failed to parse data:", err);
    return null;
  }
}

export default function VoiceAssistant() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [status, setStatus] = useState("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcription, setTranscription] = useState("");
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
  const isPlayingRef = useRef(false);
  const audioQueueRef = useRef([]);
  const playbackContextRef = useRef(null); // New ref for playback context

  const [feedbackData, setFeedbackData] = useState(null);
  console.log("--------------", feedbackData)

  const [classOption, setClassOption] = useState("");
  const [accentOption, setAccentOption] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [moodOption, setMoodOption] = useState("");
  const [showPreSpeechPrompt, setShowPreSpeechPrompt] = useState(true);
  const [messages, setMessages] = useState<string[]>([]);
  const [errors, setErrors] = useState({
    class: false,
    accent: false,
    topic: false,
    mood: false,
  });

  const scoringState = useAppSelector((state) => state.assistant);
  const [essayId, setEssayId] = useState("");
  const [showResultButton, setShowResultButton] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [loadingText, setLoadingText] = useState("Preparing your results...");

  const validateForm = () => {
    const newErrors = {
      class: !classOption,
      accent: !accentOption,
      topic: !topicInput.trim(),
      mood: !moodOption,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const initializeAudioProcessing = async (stream) => {
    try {
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      ) {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const analyzer = audioContext.createAnalyser();
      analyzerRef.current = analyzer;
      analyzer.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (isPlayingRef.current) return;
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

      visualizeAudio();
    } catch (error) {
      console.error("Audio processing init error:", error);
      setStatus("error");
    }
  };

  const playAudioBuffer = async (arrayBuffer) => {
    if (isPlayingRef.current) {
      audioQueueRef.current.push(arrayBuffer);
      return;
    }

    try {
      setStatus("playing");
      isPlayingRef.current = true;

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.enabled = false;
        });
      }

      playbackContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
          sampleRate: 16000,
        });

      const context = playbackContextRef.current;
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);
      source.start(0);

      source.onended = () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => {
            track.enabled = true;
          });
        }

        context.close();
        playbackContextRef.current = null;

        if (audioQueueRef.current.length > 0) {
          const nextBuffer = audioQueueRef.current.shift();
          playAudioBuffer(nextBuffer);
        } else {
          setStatus("connected");
          isPlayingRef.current = false;
          setTranscription("");
        }
      };
    } catch (e) {
      console.error("Playback error:", e);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.enabled = true;
        });
      }
      setStatus("connected");
      isPlayingRef.current = false;

      if (playbackContextRef.current) {
        playbackContextRef.current.close();
        playbackContextRef.current = null;
      }

      if (audioQueueRef.current.length > 0) {
        const nextBuffer = audioQueueRef.current.shift();
        playAudioBuffer(nextBuffer);
      } else {
        isPlayingRef.current = false;
      }
    }
  };

  const initWebRTC = async () => {
    setShowPreSpeechPrompt(false);
    setEssayId("");
    setShowResultButton(false);
    setLoadingResult(false);

    if (!validateForm()) {
      return;
    }
    try {
      setStatus("connecting");

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

      await initializeAudioProcessing(stream);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          setStatus("error");
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const ws = wsRef.current;

          if (ws && ws.readyState === WebSocket.OPEN) {
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
      wsUrl.searchParams.append("student_class", classOption);
      wsUrl.searchParams.append("accent", accentOption);
      wsUrl.searchParams.append("topic", topicInput);
      wsUrl.searchParams.append("mood", moodOption);

      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        (ws as any).pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 2000);

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

        pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        })
          .then((offer) => {
            return pc.setLocalDescription(offer);
          })
          .then(() => {
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
        if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
          const arrayBuffer = await (event.data instanceof Blob
            ? event.data.arrayBuffer()
            : event.data);
          playAudioBuffer(arrayBuffer);
        }
        else if (typeof event.data === "string") {
          try {
            const message = JSON.parse(event.data);
            console.log("[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[object]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]", message)
            setMessages((prev) => [...prev, event.data]);

            // Capture feedback data and store it in state
            if (message.type === "feedback" && message.data) {
              const parsedFeedback = safeParseData(message.data);
              if (parsedFeedback) {
                setFeedbackData(parsedFeedback);
              }
            }

            if (message.essay_id) {
              setEssayId(message.essay_id);
            }
            if (message.type === "answer") {
              await pc.setRemoteDescription(new RTCSessionDescription(message));
              setStatus("connected");
            } else if (message.type === "candidate") {
              await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
            } else if (message.type === "transcript") {
              setTranscription(message.text);
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

    if (wsRef.current) {
      if (wsRef.current.pingInterval) {
        clearInterval(wsRef.current.pingInterval);
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current
        .close()
        .catch((e) => console.error("Error closing audio context:", e));
      audioContextRef.current = null;
    }

    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    rawAudioRef.current = [];
    setTranscription("");
  };

  const stopAssistant = () => {
    setStatus("idle");
    cleanup();
    setShowPreSpeechPrompt(true);
    if (essayId) {
      setLoadingResult(true);
      setTimeout(() => {
        setLoadingResult(false);
        setShowResultButton(true);
      }, 3000);
    }
  };


const handleShowResult = async () => {
  if (!essayId) return;

  try {
    setLoadingResult(true);
    setLoadingText("Preparing your results...");
    
    const messages = [
      "Preparing your results...",
      "Analyzing your essay...",
      "Almost there, finalizing results..."
    ];

    let index = 0;
    const textInterval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 5000);

    // This will now poll until it gets a success response
  
     router.push(`/assistantresult?essay_id=${essayId}`);
    clearInterval(textInterval);
    
    // Check if we got the success status
  
  } catch (error) {
    console.error("Failed to fetch scoring:", error);
    setLoadingResult(false);
  }
};





  const statusColors = {
    idle: "bg-gray-500",
    connecting: "bg-yellow-500",
    connected: "bg-green-500",
    playing: "bg-blue-500",
    error: "bg-red-500",
  };

  const statusMessages = {
    idle: "Ready to start",
    connecting: "Connecting...",
    connected: "Listening...",
    playing: "Assistant is speaking...",
    error: "Connection error",
  };



  // Helper function to render different data types appropriately
  const renderDataValue = (value, key) => {
    // Handle string values
    if (typeof value === 'string') {
      return (
        <div className="string-value bg-white p-3 rounded-lg">
          <p className="text-gray-700">{value}</p>
        </div>
      );
    }

    // Handle numeric values
    if (typeof value === 'number') {
      return (
        <div className="number-value bg-white p-3 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{value}/10</p>
        </div>
      );
    }

    // Handle array values
    if (Array.isArray(value)) {
      if (value.length === 0) return null;

      return (
        <div className="array-value bg-white p-3 rounded-lg">
          <ul className="list-disc list-inside pl-2">
            {value.map((item, index) => (
              <li key={index} className="text-sm text-gray-700 mb-1">
                {typeof item === 'object' ? JSON.stringify(item) : item}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Handle object values
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="object-value">
          {Object.entries(value).map(([subKey, subValue]) => {
            if (!subValue || (typeof subValue === 'object' && Object.keys(subValue).length === 0)) {
              return null;
            }

            return (
              <div key={subKey} className="sub-item mb-3 last:mb-0">
                <h4 className="text-md font-medium text-gray-600 mb-1 capitalize">
                  {subKey.replace(/_/g, ' ')}
                </h4>
                {renderDataValue(subValue, subKey)}
              </div>
            );
          })}
        </div>
      );
    }

    // Fallback for other types
    return (
      <div className="other-value bg-white p-3 rounded-lg">
        <p className="text-gray-700">{String(value)}</p>
      </div>
    );
  };




  const groupConsecutiveUserMessages = (messages) => {
    const grouped = [];
    let currentUserGroup = [];

    messages.forEach((msg, index) => {
      try {
        const messageData = typeof msg === "string" ? JSON.parse(msg) : msg;

        if (messageData.user_message !== undefined) {
          // Collect consecutive user messages (including empty/whitespace ones)
          currentUserGroup.push({
            message: messageData.user_message,
            raw: msg,
            index
          });
        } else {
          // If we have collected user messages, add them as a group
          if (currentUserGroup.length > 0) {
            grouped.push({
              type: 'user_group',
              userMessages: currentUserGroup
            });
            currentUserGroup = [];
          }

          // Add non-user message
          grouped.push({
            type: 'single',
            raw: msg,
            messageData,
            index
          });
        }
      } catch (error) {
        // Handle parsing errors
        if (currentUserGroup.length > 0) {
          grouped.push({
            type: 'user_group',
            userMessages: currentUserGroup
          });
          currentUserGroup = [];
        }

        grouped.push({
          type: 'error',
          raw: msg,
          index
        });
      }
    });

    // Don't forget to add any remaining user messages
    if (currentUserGroup.length > 0) {
      grouped.push({
        type: 'user_group',
        userMessages: currentUserGroup
      });
    }

    return grouped;
  };

  const hasContent = (data) => {
    if (!data) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === 'object') return Object.keys(data).length > 0;
    if (typeof data === 'string') return data.trim().length > 0;
    return true;
  };

  const getSafeArray = (data) => (Array.isArray(data) ? data : []);
  const getSafeObject = (data) => (typeof data === 'object' && data !== null ? data : {});





  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">
            Speech Assistant
          </h1>
          <p className="text-indigo-200 mt-1">AI-powered voice assistant</p>
        </div>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-center sm:text-left text-lg font-semibold text-gray-800 mb-3">
            Assistant Settings
          </h2>

          <div className="flex flex-col sm:grid sm:grid-cols-2 sm:gap-6 gap-4">
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Class <span className="text-red-600">*</span>
              </label>
              <select
                value={classOption}
                onChange={(e) => {
                  setClassOption(e.target.value);
                  if (errors.class) setErrors({ ...errors, class: false });
                }}
                className={`w-full text-gray-900 rounded-xl border ${errors.class ? "border-red-500" : "border-gray-300"
                  } bg-white py-3 px-4 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              >
                <option value="" disabled>
                  Select class
                </option>
                {CLASS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.class && (
                <p className="mt-1 text-sm text-red-600">Please select a class</p>
              )}
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Accent <span className="text-red-600">*</span>
              </label>
              <select
                value={accentOption}
                onChange={(e) => {
                  setAccentOption(e.target.value);
                  if (errors.accent) setErrors({ ...errors, accent: false });
                }}
                className={`w-full text-gray-900 rounded-xl border ${errors.accent ? "border-red-500" : "border-gray-300"
                  } bg-white py-3 px-4 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              >
                <option value="" disabled>
                  Select accent
                </option>
                {ACCENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.accent && (
                <p className="mt-1 text-sm text-red-600">Please select an accent</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-2 sm:gap-6 gap-4 mt-6">
            {/* Mood Select */}
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mood <span className="text-red-600">*</span>
              </label>
              <select
                value={moodOption}
                onChange={(e) => {
                  setMoodOption(e.target.value);
                  if (errors.mood) setErrors({ ...errors, mood: false });
                }}
                className={`w-full text-gray-900 rounded-xl border ${errors.mood ? "border-red-500" : "border-gray-300"
                  } bg-white py-3 px-4 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              >
                <option value="" disabled>
                  Select mood
                </option>
                {MOOD_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.mood && (
                <p className="mt-1 text-sm text-red-600">Please select a mood</p>
              )}
            </div>

            {/* Difficulty Level Select */}
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty Level <span className="text-red-600">*</span>
              </label>
              <select
                className={`w-full text-gray-900 rounded-xl border ${errors.accent ? "border-red-500" : "border-gray-300"
                  } bg-white py-3 px-4 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
              >
                <option value="" disabled>
                  Select difficulty level
                </option>
                {difficultyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Topic <span className="text-red-600">*</span>
              {/* Topic {errors.topic && <span className="text-red-600">*</span>} */}
            </label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => {
                setTopicInput(e.target.value);
                if (errors.topic) setErrors({ ...errors, topic: false });
              }}
              placeholder="Enter discussion topic"
              className={`w-full text-black rounded-lg border ${errors.topic ? "border-red-500" : "border-gray-300"
                } bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
            />
            {errors.topic && (
              <p className="mt-1 text-sm text-red-600">
                Please enter a topic
              </p>
            )}
          </div>
        </div>
        <div className="p-8 flex flex-col items-center">
          <AnimatePresence>
            {showPreSpeechPrompt && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center max-w-md"
              >
                <div className="flex items-center justify-center mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-500 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-blue-700 font-medium">
                    Recording Tip
                  </span>
                </div>
                <p className="text-blue-600 text-sm">
                  For best results, please try speaking in a quiet room.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative mb-8 cursor-pointer">
            <div className="cursor-pointer w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-inner">
              <AnimatePresence>
                {status === "connected" && (
                  <motion.div
                    className="cursor-pointer absolute inset-0 rounded-full bg-indigo-200 opacity-20"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </AnimatePresence>

              <div className="cursor-pointer relative z-10">
                <div className="cursor-pointer w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <motion.button
                    onClick={
                      status === "idle"
                        ? initWebRTC
                        : status !== "playing"
                          ? stopAssistant
                          : undefined
                    }
                    className={`cursor-pointer w-20 h-20 rounded-full flex items-center justify-center focus:outline-none ${status === "idle"
                      ? "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
                      : status === "playing"
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                    whileHover={
                      status !== "playing" ? { scale: 1.05 } : undefined
                    }
                    whileTap={
                      status !== "playing" ? { scale: 0.95 } : undefined
                    }
                    disabled={status === "playing"}
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

            {(status === "connected" || status === "playing") && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-1 h-8">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-2 rounded-t ${status === "playing" ? "bg-blue-500" : "bg-indigo-500"
                      }`}
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
                        : status === "playing"
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
            {status === "playing" && (
              <p>Assistant is responding to your question</p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 text-center text-gray-500 text-sm">
          Powered by WebRTC & AI
        </div>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg max-w-full">

          <p className=" break-words">{transcription}</p>
          <div className="max-w-full">
            <h1 className="text-black text-xl font-bold mb-4">Conversation</h1>

            <div className="space-y-4">
              {groupConsecutiveUserMessages(messages).map((group, groupIndex) => {
                if (group.type === 'user_group') {
                  // Render grouped consecutive user messages in one div
                  return (
                    <div key={`user-group-${groupIndex}`} className="flex justify-end">
                      <div className="bg-green-100 rounded-lg p-3 max-w-xs md:max-w-md">
                        <div className="flex items-center mb-1 justify-end">
                          <span className="text-xs text-gray-500 mr-2">You</span>
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Voice</span>
                        </div>
                        <div className="text-black">
                          {group.userMessages
                            .map((userMsg) => userMsg.message || '') // Handle null/undefined messages
                            .join(' ') // Join all messages with space
                            .trim() || 'Voice detected'} {/* Fallback if all messages are empty */}
                        </div>
                      </div>
                    </div>
                  );
                } else if (group.type === 'single') {
                  // Handle individual non-user messages (AI responses, feedback, etc.)
                  const messageData = group.messageData;
                  const messageType = messageData.type;
                  let messageContent;

                  if (messageType === "ai_response" || messageType === "transcribed_text") {
                    messageContent = messageData.text || messageData.message || group.raw;
                  } else if (messageType === "feedback") {
                    messageContent = messageData.data ? safeParseData(messageData.data) : null;
                  } else {
                    messageContent = group.raw;
                  }

                  // AI Response
                  if (messageType === "ai_response") {
                    return (
                      <div key={`ai-${groupIndex}`} className="flex justify-start">
                        <div className="bg-blue-100 rounded-lg p-3 max-w-xs md:max-w-md">
                          <div className="flex items-center mb-1">
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">AI</span>
                            <span className="text-xs text-gray-500 ml-2">Assistant</span>
                          </div>
                          <p className="text-black">{JSON.parse(messageContent).data}</p>
                        </div>
                      </div>
                    );
                  }

                  // Feedback messages (keep all your existing feedback rendering code here)
                  if (messageType === "feedback" && messageContent) {
                    return (
                      null
                    );
                  }

                  // Default fallback for other message types
                  return (
                    <div key={`other-${groupIndex}`} className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3 max-w-xs md:max-w-md">

                      </div>
                    </div>
                  );
                } else if (group.type === 'error') {
                  // Error messages
                  return (
                    <div key={`error-${groupIndex}`} className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3 max-w-xs md:max-w-md">
                        <p className="text-red-500 text-sm">Error parsing message</p>
                        <p className="text-black text-sm mt-1">{group.raw}</p>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>

          </div>
        </div>















        <div className="feedback-analysis mt-6 w-full max-w-5xl mx-auto">
          {feedbackData && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="header-section text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Feedback Analysis</h2>
                <div className="w-20 h-1 bg-blue-500 mx-auto"></div>
              </div>

              {/* Overall Scores */}
              {hasContent(feedbackData.overall_scores) && (
                <div className="overall-scores-card mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-purple-700 mb-4 text-center">Overall Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(getSafeObject(feedbackData.overall_scores)).map(([key, value]) => (
                      <div key={key} className="score-item text-center p-3 bg-white rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600 mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {typeof value === 'number' ? `${value}/10` : value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Understanding */}
              {hasContent(feedbackData.feedback?.content_understanding) && (
                <div className="feedback-card mb-6 bg-blue-50 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-700">Content Understanding</h3>
                  </div>

                  {feedbackData.feedback.content_understanding.score && (
                    <div className="score-badge inline-block bg-white px-3 py-1 rounded-full text-sm font-medium text-blue-600 mb-3">
                      Score: {feedbackData.feedback.content_understanding.score}
                    </div>
                  )}

                  {feedbackData.feedback.content_understanding.explanation && (
                    <div className="explanation-box bg-white p-3 rounded-lg mb-3">
                      <p className="text-gray-700">{feedbackData.feedback.content_understanding.explanation}</p>
                    </div>
                  )}

                  {feedbackData.feedback.content_understanding.evidence && (
                    <div className="evidence-box bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-600"><span className="font-medium">Evidence:</span> {feedbackData.feedback.content_understanding.evidence}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Detail Retention */}
              {hasContent(feedbackData.feedback?.detail_retention) && (
                <div className="feedback-card mb-6 bg-blue-50 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-700">Detail Retention</h3>
                  </div>

                  {feedbackData.feedback.detail_retention.score && (
                    <div className="score-badge inline-block bg-white px-3 py-1 rounded-full text-sm font-medium text-blue-600 mb-3">
                      Score: {feedbackData.feedback.detail_retention.score}
                    </div>
                  )}

                  {feedbackData.feedback.detail_retention.explanation && (
                    <div className="explanation-box bg-white p-3 rounded-lg mb-3">
                      <p className="text-gray-700">{feedbackData.feedback.detail_retention.explanation}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hasContent(feedbackData.feedback.detail_retention.specifics_mentioned) && (
                      <div className="specifics-box bg-white p-3 rounded-lg">
                        <p className="font-medium text-gray-700 mb-2 text-sm">Specifics Mentioned</p>
                        <ul className="list-disc list-inside pl-2">
                          {getSafeArray(feedbackData.feedback.detail_retention.specifics_mentioned).map((item, index) => (
                            <li key={index} className="text-sm text-gray-600 mb-1">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {hasContent(feedbackData.feedback.detail_retention.approximations) && (
                      <div className="approximations-box bg-white p-3 rounded-lg">
                        <p className="font-medium text-gray-700 mb-2 text-sm">Approximations</p>
                        <ul className="list-disc list-inside pl-2">
                          {getSafeArray(feedbackData.feedback.detail_retention.approximations).map((item, index) => (
                            <li key={index} className="text-sm text-gray-600 mb-1">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Points Covered */}
              {hasContent(feedbackData.feedback?.key_points_covered) && (
                <div className="feedback-card mb-6 bg-green-50 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-green-700">Key Points Covered</h3>
                  </div>

                  <ul className="list-disc list-inside pl-2 bg-white p-4 rounded-lg">
                    {getSafeArray(feedbackData.feedback.key_points_covered).map((item, index) => (
                      <li key={index} className="text-sm text-gray-700 mb-2">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missed Opportunities */}
              {hasContent(feedbackData.feedback?.potential_missed_opportunities) && (
                <div className="feedback-card mb-6 bg-yellow-50 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-700">Potential Missed Opportunities</h3>
                  </div>

                  <ul className="list-disc list-inside pl-2 bg-white p-4 rounded-lg">
                    {getSafeArray(feedbackData.feedback.potential_missed_opportunities).map((item, index) => (
                      <li key={index} className="text-sm text-gray-700 mb-2">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fluency Assessment */}
              {hasContent(feedbackData.fluency_assessment) && (
                <div className="feedback-card mb-6 bg-purple-50 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-purple-700">Fluency Assessment</h3>
                  </div>

                  {feedbackData.fluency_assessment.score && (
                    <div className="score-badge inline-block bg-white px-3 py-1 rounded-full text-sm font-medium text-purple-600 mb-3">
                      Score: {feedbackData.fluency_assessment.score}
                    </div>
                  )}

                  {feedbackData.fluency_assessment.analysis && (
                    <div className="analysis-box bg-white p-3 rounded-lg mb-3">
                      <p className="text-gray-700 text-sm">{feedbackData.fluency_assessment.analysis}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    {hasContent(feedbackData.fluency_assessment.strengths) && (
                      <div className="strengths-box bg-white p-3 rounded-lg">
                        <p className="font-medium text-green-600 text-sm mb-1">Strengths</p>
                        <p className="text-gray-700 text-sm">{feedbackData.fluency_assessment.strengths}</p>
                      </div>
                    )}

                    {hasContent(feedbackData.fluency_assessment.improvement_areas) && (
                      <div className="improvement-box bg-white p-3 rounded-lg">
                        <p className="font-medium text-yellow-600 text-sm mb-1">Areas for Improvement</p>
                        <p className="text-gray-700 text-sm">{feedbackData.fluency_assessment.improvement_areas}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grammar Assessment */}
              {hasContent(feedbackData.speaking_performance?.grammar_assessment) && (
                <div className="feedback-card mb-6 bg-red-50 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-700">Grammar Assessment</h3>
                  </div>

                  {feedbackData.speaking_performance.grammar_assessment.score && (
                    <div className="score-badge inline-block bg-white px-3 py-1 rounded-full text-sm font-medium text-red-600 mb-3">
                      Score: {feedbackData.speaking_performance.grammar_assessment.score}
                    </div>
                  )}

                  {feedbackData.speaking_performance.grammar_assessment.analysis && (
                    <div className="analysis-box bg-white p-3 rounded-lg mb-3">
                      <p className="text-gray-700 text-sm">{feedbackData.speaking_performance.grammar_assessment.analysis}</p>
                    </div>
                  )}

                  {hasContent(feedbackData.speaking_performance.grammar_assessment.error_examples) && (
                    <div className="errors-box bg-white p-3 rounded-lg mb-3">
                      <p className="font-medium text-red-600 text-sm mb-2">Error Examples</p>
                      <ul className="list-disc list-inside pl-2">
                        {getSafeArray(feedbackData.speaking_performance.grammar_assessment.error_examples).map((item, index) => (
                          <li key={index} className="text-sm text-gray-700 mb-1">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedbackData.speaking_performance.grammar_assessment.complexity_level && (
                    <div className="complexity-box bg-white p-3 rounded-lg">
                      <p className="font-medium text-red-600 text-sm mb-1">Complexity Level</p>
                      <p className="text-gray-700 text-sm">{feedbackData.speaking_performance.grammar_assessment.complexity_level}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pronunciation Assessment */}
              {hasContent(feedbackData.speaking_performance?.pronunciation_assessment) && (
                <div className="feedback-card mb-6 bg-teal-50 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0-9.9l4.95 4.95a7 7 0 010 9.9l-4.95-4.95a7 7 0 010-9.9z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-teal-700">Pronunciation Assessment</h3>
                  </div>

                  {feedbackData.speaking_performance.pronunciation_assessment.score && (
                    <div className="score-badge inline-block bg-white px-3 py-1 rounded-full text-sm font-medium text-teal-600 mb-3">
                      Score: {feedbackData.speaking_performance.pronunciation_assessment.score}
                    </div>
                  )}

                  {feedbackData.speaking_performance.pronunciation_assessment.analysis && (
                    <div className="analysis-box bg-white p-3 rounded-lg mb-3">
                      <p className="text-gray-700 text-sm">{feedbackData.speaking_performance.pronunciation_assessment.analysis}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hasContent(feedbackData.speaking_performance.pronunciation_assessment.well_prnounced_words) && (
                      <div className="well-pronounced-box bg-white p-3 rounded-lg">
                        <p className="font-medium text-green-600 text-sm mb-2">Well-Pronounced Words</p>
                        <ul className="list-disc list-inside pl-2">
                          {getSafeArray(feedbackData.speaking_performance.pronunciation_assessment.well_prnounced_words).map((item, index) => (
                            <li key={index} className="text-sm text-gray-700 mb-1">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {hasContent(feedbackData.speaking_performance.pronunciation_assessment.needs_work_words) && (
                      <div className="needs-work-box bg-white p-3 rounded-lg">
                        <p className="font-medium text-yellow-600 text-sm mb-2">Words Needing Work</p>
                        <ul className="list-disc list-inside pl-2">
                          {getSafeArray(feedbackData.speaking_performance.pronunciation_assessment.needs_work_words).map((item, index) => (
                            <li key={index} className="text-sm text-gray-700 mb-1">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vocabulary Usage */}
              {hasContent(feedbackData.speaking_performance?.vocabulary_usage) && (
                <div className="feedback-card mb-6 bg-indigo-50 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-indigo-700">Vocabulary Usage</h3>
                  </div>

                  {feedbackData.speaking_performance.vocabulary_usage.assessment && (
                    <div className="assessment-box bg-white p-3 rounded-lg mb-3">
                      <p className="text-gray-700 text-sm">{feedbackData.speaking_performance.vocabulary_usage.assessment}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    {hasContent(feedbackData.speaking_performance.vocabulary_usage.effective_vocabulary) && (
                      <div className="effective-vocab-box bg-white p-3 rounded-lg">
                        <p className="font-medium text-green-600 text-sm mb-2">Effective Vocabulary</p>
                        <ul className="list-disc list-inside pl-2">
                          {getSafeArray(feedbackData.speaking_performance.vocabulary_usage.effective_vocabulary).map((item, index) => (
                            <li key={index} className="text-sm text-gray-700 mb-1">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {hasContent(feedbackData.speaking_performance.vocabulary_usage.vocabulary_opportunities) && (
                      <div className="opportunities-box bg-white p-3 rounded-lg">
                        <p className="font-medium text-yellow-600 text-sm mb-2">Vocabulary Opportunities</p>
                        <ul className="list-disc list-inside pl-2">
                          {getSafeArray(feedbackData.speaking_performance.vocabulary_usage.vocabulary_opportunities).map((item, index) => (
                            <li key={index} className="text-sm text-gray-700 mb-1">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Suggestions */}
              {hasContent(feedbackData.detailed_suggestions) && (
                <div className="suggestions-section mt-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    Detailed Suggestions
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getSafeArray(feedbackData.detailed_suggestions).map((item, idx) => (
                      <div key={idx} className="suggestion-card bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-400 shadow-sm">
                        <div className="suggestion-header flex items-start mb-3">
                          <span className="suggestion-number bg-yellow-100 text-yellow-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">
                            {idx + 1}
                          </span>
                          <h4 className="text-md font-medium text-yellow-800">Suggestion</h4>
                        </div>

                        {item.suggestion && (
                          <p className="text-sm text-gray-700 mb-2 bg-white p-2 rounded-lg">
                            <span className="font-medium text-yellow-700">Suggestion:</span> {item.suggestion}
                          </p>
                        )}

                        {item.example && (
                          <p className="text-sm text-gray-700 mb-2 bg-white p-2 rounded-lg">
                            <span className="font-medium text-yellow-700">Example:</span> {item.example}
                          </p>
                        )}

                        {item.improved_version && (
                          <p className="text-sm text-gray-700 bg-white p-2 rounded-lg">
                            <span className="font-medium text-yellow-700">Improved Version:</span> {item.improved_version}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practice Recommendations */}
              {hasContent(feedbackData.practice_recommendations) && (
                <div className="recommendations-section mt-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    Practice Recommendations
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getSafeArray(feedbackData.practice_recommendations).map((item, idx) => (
                      <div key={idx} className="recommendation-card bg-blue-50 p-4 rounded-xl shadow-sm">
                        <div className="recommendation-number bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mb-3">
                          {idx + 1}
                        </div>

                        {item.activity && (
                          <p className="text-sm text-gray-700 mb-2">
                            <span className="font-medium text-blue-700">Activity:</span> {item.activity}
                          </p>
                        )}

                        {item.purpose && (
                          <p className="text-sm text-gray-700 mb-2">
                            <span className="font-medium text-blue-700">Purpose:</span> {item.purpose}
                          </p>
                        )}

                        {item.frequency && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-blue-700">Frequency:</span> {item.frequency}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Encouragement */}
              {hasContent(feedbackData.encouragement) && (
                <div className="encouragement-section mt-8 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-purple-700 mb-4 text-center flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Encouragement
                  </h3>

                  {typeof feedbackData.encouragement === 'string' ? (
                    <div className="encouragement-card bg-white p-4 rounded-lg text-center">
                      <p className="text-gray-700">{feedbackData.encouragement}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {feedbackData.encouragement.progress_highlight && (
                        <div className="encouragement-card bg-white p-4 rounded-lg text-center">
                          <p className="text-sm font-medium text-gray-700 mb-1">Progress Highlight</p>
                          <p className="text-xs text-gray-600">{feedbackData.encouragement.progress_highlight}</p>
                        </div>
                      )}

                      {feedbackData.encouragement.motivational_message && (
                        <div className="encouragement-card bg-white p-4 rounded-lg text-center">
                          <p className="text-sm font-medium text-gray-700 mb-1">Motivational Message</p>
                          <p className="text-xs text-gray-600">{feedbackData.encouragement.motivational_message}</p>
                        </div>
                      )}

                      {feedbackData.encouragement.growth_potential && (
                        <div className="encouragement-card bg-white p-4 rounded-lg text-center">
                          <p className="text-sm font-medium text-gray-700 mb-1">Growth Potential</p>
                          <p className="text-xs text-gray-600">{feedbackData.encouragement.growth_potential}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>














      </div>
      <div className="mt-6 flex flex-col items-center">
        {loadingResult && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-600 max-w-xs text-center">{loadingText}</p>
            <p className="text-xs text-gray-500 mt-2">
              This may take up to 15 seconds...
            </p>
          </div>
        )}

        {showResultButton && !loadingResult && (
          <motion.button
            onClick={handleShowResult}
            className="cursor-pointer mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium py-3 px-8 rounded-full shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            View Detailed Results
          </motion.button>
        )}

        {scoringState.error && (
          <p className="mt-2 text-red-500 text-sm">
            Error loading results: {scoringState.error}
          </p>
        )}
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
