// src/lib/features/chat/chatSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface ChatRequest {
  question: string;
  student_class: string;
  subject: string;
}

interface ChatResponse {
  question: string;
  answer: string;
  context_used: string;
}

export const sendChatMessage = createAsyncThunk(
  "chat/sendMessage",
  async (payload: ChatRequest, { rejectWithValue }) => {
    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Request failed");
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "An error occurred");
    }
  }
);

interface ChatState {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ChatState = {
  status: "idle",
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { resetError } = chatSlice.actions;
export default chatSlice.reducer;
