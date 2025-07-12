"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  initializePractice,
  startRecording,
  stopRecording,
  resetPracticeState,
  setAnalysisResults,
} from "@/store/slices/practiceSlice";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FaMicrophone, FaStop, FaPlay, FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const PracticePage = () => {
  const dispatch = useAppDispatch();
const router = useRouter();
 const searchParams = useSearchParams();
  const audioRef = useRef(null);

  const paragraph = searchParams.get("paragraph") 
    ? decodeURIComponent(searchParams.get("paragraph")!)
    : "";

  console.log("PracticePage received paragraph:", paragraph);
  const audioUrl = searchParams.get("audioUrl") || "";

  const [recordedChunks, setRecordedChunks] = useState([]);
  const [debugAudioUrl, setDebugAudioUrl] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitorRef = useRef(null);

  const debugAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const rawAudioRef = useRef([]);

  const [showInfoNotice, setShowInfoNotice] = useState(true);
  // const { username } = useAppSelector((state) => state.auth);

  const getUsername = () => {
    return localStorage.getItem("username") || "unknown_user";
  };

  // New refs for media objects
  const mediaStreamRef = useRef(null);
  // const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);

  const { isRecording, isAnalyzing, analysisResults, error } = useAppSelector(
    (state) => state.practice
  );

  const getAuthToken = () => {
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
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const testWebSocketConnection = async () => {
    const token = getAuthToken();
    console.log("Testing WebSocket connection with token:", token);
    const cleanBaseUrl = BASE_URL.replace(/^https?:\/\//, "");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    const testSocket = new WebSocket(
      `${protocol}//${cleanBaseUrl}/ws/audio?username=test&token=${encodeURIComponent(
        token
      )}`
    );
    testSocket.onopen = () => {
      console.log("[TEST] WebSocket connected");
      testSocket.send(
        JSON.stringify({ type: "test", data: "Connection test" })
      );
      testSocket.close();
    };

    testSocket.onerror = (error) => {
      console.error("[TEST] WebSocket error:", error);
    };

    testSocket.onmessage = (e) => {
      console.log("[TEST] Received:", e.data);
    };
  };

  const startMicrophoneMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (monitorRef.current) {
        monitorRef.current.srcObject = stream;
        monitorRef.current
          .play()
          .catch((e) => console.error("Monitoring play error:", e));
        setIsMonitoring(true);
      }
    } catch (error) {
      console.error("Monitoring error:", error);
      toast.error("Microphone access failed during monitoring");
    }
  };

  const stopMicrophoneMonitoring = () => {
    if (monitorRef.current && monitorRef.current.srcObject) {
      monitorRef.current.srcObject.getTracks().forEach((track) => track.stop());
      monitorRef.current.srcObject = null;
      setIsMonitoring(false);
    }
  };

  const checkMicrophoneAccess = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((d) => d.kind === "audioinput");

      if (mics.length === 0) {
        toast.error("No microphones detected");
        return false;
      }

      console.log("Available microphones:", mics);
      return true;
    } catch (error) {
      console.error("Device enumeration error:", error);
      toast.error("Couldn't access device list");
      return false;
    }
  };

  useEffect(() => {
    if (paragraph) {
      dispatch(initializePractice(paragraph));
      testWebSocketConnection();
    } else {
      toast.error("No paragraph found for practice");
      router.push("/dashboard");
    }
  }, [dispatch, paragraph, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleStartRecording = async () => {
    setShowInfoNotice(false);
    setRecordedChunks([]);
    setDebugAudioUrl(null);
    rawAudioRef.current = [];

    const hasMicrophone = await checkMicrophoneAccess();
    if (!hasMicrophone) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          noiseSuppression: true,
          echoCancellation: true,
        },
      });
      const audioTracks = stream.getAudioTracks();
      console.log("Active audio tracks:", audioTracks);

      audioTracks.forEach((track) => {
        console.log("Track settings:", track.getSettings());
        console.log("Track enabled:", track.enabled);
        console.log("Track readyState:", track.readyState);
      });

      mediaStreamRef.current = stream;

      // const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      //   ? "audio/webm;codecs=opus"
      //   : MediaRecorder.isTypeSupported("audio/webm")
      //   ? "audio/webm"
      //   : "";

      // if (!mimeType) {
      //   toast.error("Browser doesn't support required audio formats");
      //   return;
      // }

      // console.log("Using MIME type:", mimeType);

      // const mediaRecorder = new MediaRecorder(stream, {
      //   mimeType,
      //   audioBitsPerSecond: 128000,
      // });

      // Create audio context and processor
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Add to raw audio buffer
        rawAudioRef.current.push(pcmData);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      const token = getAuthToken();
      if (!token) {
        toast.error("Missing authentication token");
        return;
      }
      const username = getUsername();
      console.log("Using username:", username);
      // mediaRecorderRef.current = mediaRecorder;
      const cleanBaseUrl = BASE_URL.replace(/^https?:\/\//, "");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const params = new URLSearchParams({
        username: encodeURIComponent(username),
        token: encodeURIComponent(token),
      });
      const socket = new WebSocket(
        `${protocol}//${cleanBaseUrl}/ws/audio?${params.toString()}`
      );
      console.log("Connecting to:", socket.url);
      socketRef.current = socket;

      // Handle socket events
      socket.onopen = () => {
        console.log("WebSocket connected");
        console.log("Protocol:", socket.protocol);
        console.log("Extensions:", socket.extensions);
        // mediaRecorder.start(3000);
        dispatch(startRecording());
        socket.sendInterval = setInterval(() => {
          if (
            rawAudioRef.current.length === 0 ||
            socket.readyState !== WebSocket.OPEN
          )
            return;

          // Combine and send all available PCM chunks
          const chunks = rawAudioRef.current;
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

          // Send raw PCM data directly
          socket.send(combined.buffer);
        }, 500);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Analysis received:", data);
        // Handle analysis data (you might want to accumulate or display it)
        dispatch(setAnalysisResults(data));
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("WebSocket connection error");
        dispatch(stopRecording());
      };

      socket.onclose = (event) => {
        console.error("WebSocket closed unexpectedly", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        toast.error("WebSocket connection closed unexpectedly");
      };

      // mediaRecorder.ondataavailable = (event) => {
      //   if (event.data.size > 0) {
      //     console.log("Audio chunk received:", {
      //       size: event.data.size,
      //       type: event.data.type,
      //       duration: event.data.duration,
      //     });

      // Store chunk for debugging
      setRecordedChunks((prev) => [...prev, event.data]);
      const reader = new FileReader();

      // Send to WebSocket
      reader.onload = () => {
        if (socket.readyState === WebSocket.OPEN) {
          console.log("Sending audio chunk as ArrayBuffer");
          socket.send(reader.result);
        }
      };
      // reader.readAsArrayBuffer(event.data);

      // mediaRecorder.onstop = () => {
      //   if (socket.readyState === WebSocket.OPEN) {
      //     socket.send(JSON.stringify({ action: "end" }));
      //     socket.close();
      //   }
      // };
      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Failed to access microphone. Please check permissions.");
      dispatch(stopRecording());
    }
  };

  const playRecordedAudio = () => {
    if (rawAudioRef.current.length === 0) return;

    // Combine all PCM chunks
    const chunks = rawAudioRef.current;
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Int16Array(totalLength);
    let offset = 0;

    chunks.forEach((chunk) => {
      combined.set(chunk, offset);
      offset += chunk.length;
    });

    // Create WAV file for playback only
    const wavBuffer = createWavFile(combined);
    const blob = new Blob([wavBuffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    setDebugAudioUrl(url);
  };

  const createWavFile = (pcmData) => {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + pcmData.length * 2, true);
    writeString(view, 8, "WAVE");

    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 16000 * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    writeString(view, 36, "data");
    view.setUint32(40, pcmData.length * 2, true);

    const dataOffset = 44;
    for (let i = 0; i < pcmData.length; i++) {
      view.setInt16(dataOffset + i * 2, pcmData[i], true);
    }

    return buffer;
  };

  const handleStopRecording = () => {
    setShowInfoNotice(false);

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Send remaining chunks and close socket
    if (socketRef.current) {
      const socket = socketRef.current;

      // Send any remaining audio chunks
      if (
        rawAudioRef.current.length > 0 &&
        socket.readyState === WebSocket.OPEN
      ) {
        const chunks = rawAudioRef.current;
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

        socket.send(combined.buffer);
      }

      // Clear send interval if exists
      if (socket.sendInterval) {
        clearInterval(socket.sendInterval);
      }

      // Send end signal and close
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: "end" }));
        socket.close(1000, "Recording completed");
      } else {
        socket.close();
      }
    }

    dispatch(stopRecording());
  };

  // Play audio function
  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    dispatch(resetPracticeState());
    router.push("/dashboard");
  };

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (socketRef.current) socketRef.current.close();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (debugAudioUrl) URL.revokeObjectURL(debugAudioUrl);
    };
  }, [debugAudioUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <toast position="top-right" autoClose={5000} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-white shadow-xl rounded-xl overflow-hidden"
      >
        <div className="bg-indigo-600 py-4 px-6 flex items-center">
          <button
            onClick={handleBackToDashboard}
            className="text-white mr-4 p-2 rounded-full hover:bg-indigo-700 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-2xl font-bold text-white text-center flex-grow">
            Practice Your English
          </h2>
        </div>

        <div className="p-6">
          {isAnalyzing && !paragraph ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <span className="ml-4 text-gray-700">
                Loading practice session...
              </span>
            </div>
          ) : (
            <>
              {/* Paragraph Display */}
              {!isRecording && (
                <div className="mb-8 bg-indigo-50 p-4 rounded-xl border border-indigo-100 transition-all duration-500">
                  <h3 className="text-lg font-semibold text-indigo-800 mb-3">
                    Read this paragraph aloud:
                  </h3>
                  <div className="bg-white p-4 rounded-lg shadow-inner max-h-60 overflow-y-auto">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {paragraph}
                    </p>
                  </div>
                </div>
              )}

              {/* Audio Player */}
              <div className="mb-8 flex justify-center">
                <button
                  onClick={handlePlayAudio}
                  className="flex items-center justify-center bg-indigo-100 text-indigo-600 p-4 rounded-full hover:bg-indigo-200 transition-colors"
                  disabled={isRecording}
                >
                  <FaPlay className="text-xl" />
                  <span className="ml-2">Listen Again</span>
                </button>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  className="hidden"
                />
              </div>

              {/* Recording Controls */}
              <div className="flex flex-col items-center justify-center my-8">
                {showInfoNotice && !isRecording && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded"
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          The paragraph will be hidden when you start recording
                          to encourage memorization and natural speech.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {!isRecording ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartRecording}
                    className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isAnalyzing}
                  >
                    <FaMicrophone className="text-3xl" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStopRecording}
                    className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <FaStop className="text-3xl" />
                  </motion.button>
                )}

                <p className="mt-4 text-gray-600">
                  {isRecording
                    ? "Recording... Click to stop."
                    : "Click the microphone to start recording."}
                </p>

                {isRecording && (
                  <div className="mt-4 flex space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [10, 30, 10] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                        className="w-3 bg-indigo-500 rounded-full"
                      />
                    ))}
                  </div>
                )}
              </div>
              {recordedChunks.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-bold text-yellow-800">Debug Panel</h3>
                  <p className="text-sm text-yellow-700 mb-2">
                    {recordedChunks.length} chunks recorded (
                    {recordedChunks.reduce((acc, chunk) => acc + chunk, 0)}{" "}
                    bytes)
                  </p>

                  <button
                    onClick={playRecordedAudio}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Play Recorded Audio
                  </button>

                  {debugAudioUrl && (
                    <div className="mt-2">
                      <audio
                        ref={debugAudioRef}
                        src={debugAudioUrl}
                        controls
                        className="w-full"
                      />
                      <a
                        href={debugAudioUrl}
                        download="debug-audio.webm"
                        className="text-blue-600 text-sm underline mt-1 block"
                      >
                        Download Audio
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Analysis Results */}
              {analysisResults && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 p-6 bg-white rounded-xl border border-indigo-100 shadow-md"
                >
                  <h3 className="text-xl font-semibold text-indigo-800 mb-4">
                    Your Analysis Results
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h4 className="font-medium text-indigo-700">
                        Pronunciation
                      </h4>
                      <p className="text-2xl font-bold text-indigo-600">
                        {analysisResults.pronunciationScore || "8.5"}/10
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h4 className="font-medium text-indigo-700">Fluency</h4>
                      <p className="text-2xl font-bold text-indigo-600">
                        {analysisResults.fluencyScore || "7.2"}/10
                      </p>
                    </div>
                  </div>

                  <h3 className="font-bold text-blue-800 mb-2">
                    Microphone Diagnostics
                  </h3>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={
                        isMonitoring
                          ? stopMicrophoneMonitoring
                          : startMicrophoneMonitoring
                      }
                      className={`flex items-center px-4 py-2 rounded-md ${
                        isMonitoring
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white`}
                    >
                      {isMonitoring ? (
                        <FaVolumeMute className="mr-2" />
                      ) : (
                        <FaVolumeUp className="mr-2" />
                      )}
                      {isMonitoring ? "Stop Monitoring" : "Test Microphone"}
                    </button>

                    <p className="text-sm text-blue-700">
                      {isMonitoring
                        ? "You should hear your microphone input now"
                        : "Click to verify microphone works"}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium text-indigo-700 mb-2">
                      Feedback
                    </h4>
                    <ul className="space-y-2">
                      {(
                        analysisResults.feedback || [
                          "Good job on pronunciation!",
                          "Try to speak a bit slower for better clarity.",
                          "Watch your intonation on questions.",
                        ]
                      ).map((item, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PracticePage;
