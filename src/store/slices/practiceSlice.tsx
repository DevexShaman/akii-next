
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk for initializing practice session
export const initializePractice = createAsyncThunk(
  "practice/initialize",
  async (paragraph, { rejectWithValue }) => {
    try {
      return { paragraph };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to initialize practice"
      );
    }
  }
);

const initialState = {
  isRecording: false,
  isAnalyzing: false,
  analysisResults: null,
  error: null,
  paragraph: "",
  audioChunks: [],
  socket: null,
  mediaRecorder: null,
  stream: null,
  sessionId: null,
};

const practiceSlice = createSlice({
  name: "practice",
  initialState,
  reducers: {
    startRecording: (state) => {
      state.isRecording = true;
    },
    stopRecording: (state) => {
      state.isRecording = false;
      if (state.mediaRecorder) {
        state.mediaRecorder.stop();
      }
      if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
      }
      if (state.socket) {
        state.socket.close();
      }
    },
    addAudioChunk: (state, action) => {
      state.audioChunks.push(action.payload);
    },
    setAnalysisResults: (state, action) => {
      state.analysisResults = action.payload;
      state.isAnalyzing = false;
    },
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    setMediaRecorder: (state, action) => {
      state.mediaRecorder = action.payload;
    },
    setStream: (state, action) => {
      state.stream = action.payload;
    },
    resetPracticeState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializePractice.pending, (state) => {
        state.isAnalyzing = true;
        state.error = null;
      })
      .addCase(initializePractice.fulfilled, (state, action) => {
        state.paragraph = action.payload.paragraph;
        state.isAnalyzing = false;
      })
      .addCase(initializePractice.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.error = action.payload;
      });
  },
});

export const {
  startRecording,
  stopRecording,
  addAudioChunk,
  setAnalysisResults,
  setSocket,
  setMediaRecorder,
  setStream,
  resetPracticeState,
} = practiceSlice.actions;

export default practiceSlice.reducer;
