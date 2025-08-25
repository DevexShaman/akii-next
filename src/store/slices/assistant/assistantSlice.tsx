import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

interface ScoringState {
  data: any;
  loading: boolean;
  error: string | null;
}

const initialState: ScoringState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchOverallScoring = createAsyncThunk(
  "assistant/fetchOverallScoring",
  async (essay_id: string, { rejectWithValue }) => {


    try {

      
      const response = await axios.get(
        `https://llm.edusmartai.com/api/overall-scoring-by-id-speech-module?essay_id=${essay_id}`
      );

      console.log("RESULT RESPONSE:", response)
      if (response.data.error) {
        throw new Error(response.data.error)
      }
      return response.data;
    } catch (error: any) {
      // toast.error(error.data.error)
      console.log("results api Error:", error)
      return rejectWithValue(error.data || error.message);
    }
  }
);

const assistantSlice = createSlice({
  name: "assistant",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverallScoring.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverallScoring.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchOverallScoring.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default assistantSlice.reducer;
