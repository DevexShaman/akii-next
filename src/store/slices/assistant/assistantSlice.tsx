import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { log } from "console";

// Interfaces for your data structure
export interface FeedbackData {
  feedback: {
    content_understanding: {
      score: string;
      explanation: string;
      pattern_analysis: string;
      evidence: string;
    };
    detail_retention: {
      score: string;
      explanation: string;
      key_points_covered: string[];
      missed_points: string[];
      improvement_trend: string;
    };
    comprehension_consistency: string;
  };
  speaking_performance: {
    fluency_assessment: {
      score: number;
      analysis: string;
      consistency: string;
      specific_examples: any[];
    };
    pronunciation_assessment: {
      score: number;
      analysis: string;
      consistent_strengths: string[];
      systematic_errors: any[];
      situational_errors: any[];
    };
    grammar_assessment: {
      score: number;
      analysis: string;
      error_patterns: string[];
      complexity_attempts: string;
      self_correction: string;
    };
    vocabulary_usage: {
      assessment: string;
      consistency: string;
      appropriateness: string;
    };
    speaking_clarity: {
      overall_rating: string;
      clarity_trend: string;
    };
  };
  // Note: The API response shows this is a comment, not actual data
  // "... rest of the output in the provided JSON format"
}

export interface OverallScores {
  pronunciation: number;
  grammar: number;
  fluency: number;
  emotion: number;
}

interface ApiResponse {
  data: {
    data: {
      body: string; // This contains the JSON string of FeedbackData
      overall_scores: OverallScores;
    };
    status: string;
  };
  status: string;
}

interface ScoringState {
  data: {
    feedbackData: FeedbackData | null;
    overallScores: OverallScores | null;
  };
  loading: boolean;
  error: string | null;
}

const initialState: ScoringState = {
  data: {
    feedbackData: null,
    overallScores: null
  },
  loading: false,
  error: null,
};








// export const fetchOverallScoring = createAsyncThunk(
//   "assistant/fetchOverallScoring",
//   async (essay_id: string, { rejectWithValue }) => {
//     try {
//       const pollApi = async (): Promise<any> => {
//         const maxAttempts = 30;
//         const pollInterval = 5000;
        
//         for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//           try {
//             console.log(`Polling attempt ${attempt}...`);
            
//             const response = await axios.get(
//               `https://llm.edusmartai.com/api/overall-scoring-by-id-speech-module?essay_id=${essay_id}`
//             );

//             console.log("API Response:ddsfds", response.data);

//             // Check if we got a successful status code
//             if (response.data.data.status_code === 200) {
//               console.log("Received status_code: 200 - Processing data...");
              
//               // Store the complete API response in a variable
//               const completeApiResponse = response.data;
              
//               // Extract the body data (first level parsing)
//               const bodyDataString = response.data.data.body;
              
//               // Parse the main body
//               let parsedBody;
//               try {
//                 parsedBody = JSON.parse(bodyDataString);
//               } catch (parseError) {
//                 console.error("Failed to parse body data:", parseError);
//                 throw new Error("Invalid JSON response from server");
//               }

//               console.log("parsed body data:",parsedBody)
              
//               // // Store parsedBody in a variable
//               // const mainBodyData = parsedBody;
//               // console.log("--------1111111--------", mainBodyData);
              
//               // // Extract overall_scores from the main body - STORE IN VARIABLE
//               // const overallScoresFromBody = parsedBody.overall_scores;
//               // console.log("_---------------------------1111", overallScoresFromBody);
              
//               // // Extract raw_feedback from overall_scoring - STORE IN VARIABLE
//               // const rowoverallScoringString = parsedBody.overall_scoring;
//               // console.log("-------------------222222222222222222222", rowoverallScoringString);

//               // // Parse the overall_scoring JSON string (second level parsing)
//               // let feedbackData;
//               // try {
//               //   feedbackData = JSON.parse(rowoverallScoringString);
//               // } catch (parseError) {
//               //   console.error("Failed to parse overall_scoring:", parseError);
//               //   feedbackData = rowoverallScoringString;
//               // }
              
//               // // Extract overall_scores from feedbackData if available - STORE IN VARIABLE
//               // const overallScoresFromFeedback = feedbackData.overall_scores;
             
//               // // Store raw_feedback separately since it contains the actual feedback structure
//               // const rawFeedbackString = feedbackData.raw_feedback;
              
//               // // Parse the raw_feedback JSON string (third level parsing)
//               // let detailedFeedback;
//               // try {
//               //   // Clean the raw_feedback string first (remove comments, fix escapes)
//               //   const cleanedRawFeedback = rawFeedbackString
//               //     .replace(/\/\/.*$/gm, '') // Remove comments
//               //     .replace(/\\\"/g, '"')    // Fix escaped quotes
//               //     .replace(/\\n/g, '')      // Remove escaped newlines
//               //     .replace(/\\/g, '');      // Remove other escapes
                
//               //   detailedFeedback = JSON.parse(cleanedRawFeedback);
//               // } catch (parseError) {
//               //   console.error("Failed to parse raw_feedback:", parseError);
//               //   detailedFeedback = rawFeedbackString;
//               // }
              
//               // // Extract overall_scores from detailedFeedback if available - STORE IN VARIABLE
//               // const overallScoresFromDetailed = detailedFeedback.overall_scores;
              
//               // // Determine which overall_scores to use (priority: body > feedback > detailed)
//               // const finalOverallScores = overallScoresFromBody || overallScoresFromFeedback || overallScoresFromDetailed;
              
//               // // Store all extracted data in variables including the ones you want to pass
//               // const extractedData = {
//               //   completeApiResponse,        // The entire API response
//               //   mainBodyData,              // Parsed body data
//               //   feedbackData,              // Parsed overall_scoring
//               //   detailedFeedback,          // Parsed raw_feedback
//               //   overallScoresFromBody,     // overall_scores from main body
//               //   overallScoresFromFeedback, // overall_scores from feedback level
//               //   overallScoresFromDetailed, // overall_scores from detailed level
//               //   finalOverallScores,        // The final selected overall_scores
//               //   rowoverallScoringString,   // The raw feedback string you want to pass
//               //   rawBodyScores: overallScoresFromBody // Renamed for clarity
//               // };
              
//               // console.log("Complete extracted data:", extractedData);
//               // console.log("Final overall scores:", finalOverallScores);
//               // console.log("Raw overall scoring string:", rowoverallScoringString);
//               // console.log("Body scores:", overallScoresFromBody);
              
//               // return extractedData;
//             }
            
//             // If status_code is not 200, wait and try again
//             if (attempt < maxAttempts) {
//               console.log(`Status code not 200 (got ${response.data.data.status_code}). Waiting ${pollInterval/1000}s before next attempt...`);
//               await new Promise(resolve => setTimeout(resolve, pollInterval));
//             }
            
//           } catch (error: any) {
//             console.error(`Error in polling attempt ${attempt}:`, error);
            
//             if (attempt < maxAttempts) {
//               await new Promise(resolve => setTimeout(resolve, pollInterval));
//               continue;
//             }
            
//             throw error;
//           }
//         }
        
//         throw new Error("Max polling attempts reached without receiving status_code: 200");
//       };

//       return await pollApi();
      
//     } catch (error: any) {
//       console.log("Results API Error:", error);
//       return rejectWithValue(error.response?.data?.error || error.message);
//     }
//   }
// );


export const fetchOverallScoring = createAsyncThunk(
  "assistant/fetchOverallScoring",
  async (essay_id: string, { rejectWithValue }) => {
    try {
      const pollApi = async (): Promise<any> => {
        const maxAttempts = 30;
        const pollInterval = 5000;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {

            const response = await axios.get(
              `https://llm.edusmartai.com/api/overall-scoring-by-id-speech-module?essay_id=${essay_id}`
            );

           
            if (response.data.data.status_code === 200) {

              const bodyDataString = response.data.data.body;
              let parsedBody;

              try {
                parsedBody = JSON.parse(bodyDataString);
              } catch (parseError) {
                console.error("Failed to parse body data:", parseError);
                throw new Error("Invalid JSON response from server");
              }

              const rawText = parsedBody?.overall_scoring?.raw_feedback;
              if (rawText) {
                const match = rawText.match(/\{[\s\S]*\}/);
                if (match) {
                  try {
                    const parsedJson = JSON.parse(match[0]);
                    parsedBody.overall_scoring.raw_feedback = parsedJson;
                  } catch (error) {
                    console.error("❌ Failed to parse raw_feedback JSON:", error);
                  }
                }
              }

              // ✅ Return parsed body and stop polling
              return parsedBody;
            }

            // If status_code is not 200, wait and retry
            if (attempt < maxAttempts) {
              console.log(
                `Status code not 200 (got ${response.data.data.status_code}). Waiting ${
                  pollInterval / 1000
                }s before next attempt...`
              );
              await new Promise((resolve) => setTimeout(resolve, pollInterval));
            }
          } catch (error: any) {
            console.error(`Error in polling attempt ${attempt}:`, error);

            if (attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, pollInterval));
              continue;
            }

            throw error;
          }
        }

        throw new Error(
          "Max polling attempts reached without receiving status_code: 200"
        );
      };

      return await pollApi();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);



const assistantSlice = createSlice({
  name: "assistant",
  initialState,
  reducers: {
    clearResults: (state) => {
      state.data = {
        feedbackData: null,
        overallScores: null
      };
      state.error = null;
    }
  },
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

export const { clearResults } = assistantSlice.actions;
export default assistantSlice.reducer;