import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiPost } from "@/components/services/api";

export const generateParagraph = createAsyncThunk(
  "paragraph/generateParagraph",
  async (formData, { rejectWithValue }) => {
    try {
      const payload = {
        student_class: formData.class,
        accent: formData.accent,
        topic: formData.topic,
        mood: formData.mood,
      };
      const response = await apiPost("/generate-prompt", payload);
      console.log("API Response:", response);
      return response.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "An error occurred"
      );
    }
  }
);

const initialState = {
  generatedParagraph: null,
  isLoading: false,
  error: null,
};

const paragraphSlice = createSlice({
  name: "paragraph",
  initialState,
  reducers: {
    resetParagraphState: (state) => {
      state.generatedParagraph = null;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateParagraph.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateParagraph.fulfilled, (state, action) => {
        state.isLoading = false;
        state.generatedParagraph = action.payload;
      })
      .addCase(generateParagraph.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { resetParagraphState } = paragraphSlice.actions;
export default paragraphSlice.reducer;
