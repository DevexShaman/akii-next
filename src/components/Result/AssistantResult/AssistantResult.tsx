"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Smile, Frown, Meh } from "react-feather";
import { Info } from "react-feather";

import { useAppDispatch, useAppSelector } from "@/store";
import { fetchOverallScoring } from "@/store/slices/assistant/assistantSlice";
import axios from "axios";

// Emotion icon component
const EmotionIcon = ({ emotion }: { emotion: string }) => {
  const size = 20;
  switch (emotion.toLowerCase()) {
    case "happy":
      return <Smile className="text-green-500" size={size} />;
    case "sad":
      return <Frown className="text-blue-500" size={size} />;
    case "angry":
      return <Frown className="text-red-500" size={size} />;
    default:
      return <Meh className="text-gray-500" size={size} />;
  }
};

// Score Meter component
const ScoreMeter = ({ value, max = 10 }: { value: number; max?: number }) => {
  const percentage = (value / max) * 100;
  let colorClass = "";

  if (percentage >= 80) colorClass = "bg-green-500";
  else if (percentage >= 60) colorClass = "bg-yellow-500";
  else colorClass = "bg-red-500";

  return (
    <div className="flex items-center space-x-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${colorClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="text-sm font-medium text-gray-700">
        {value.toFixed(1)}
      </span>
    </div>
  );
};

function extractPureJSON(input) {
  try {
    // Match everything between the first `{` and last `}`
    const jsonMatch = input.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found");

    // Parse JSON
    const jsonData = JSON.parse(jsonMatch[0]);
    return jsonData;
  } catch (error) {
    console.error("Error extracting JSON:", error.message);
    return null;
  }
}

// API polling function
// const pollOverallScoring = async (essay_id: string) => {
//   const maxAttempts = 30;
//   const pollInterval = 5000;

//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       console.log(`Polling attempt ${attempt}...`);

//       const response = await axios.get(
//         `https://llm.edusmartai.com/api/overall-scoring-by-id-speech-module?essay_id=${essay_id}`
//       );

//       console.log("API Response:", response.data);

//       // Check if we got a successful status code
//       if (response.data.data.status_code === 200) {
//         console.log("Received status_code: 200 - Processing data...");

//         // Store the complete API response in a variable
//         const completeApiResponse = response.data;

//         // Extract the body data (first level parsing)
//         const bodyDataString = response.data.data.body;

//         // Parse the main body
//         let parsedBody;
//         try {
//           parsedBody = JSON.parse(bodyDataString);
//         } catch (parseError) {
//           console.error("Failed to parse body data:", parseError);
//           throw new Error("Invalid JSON response from server");
//         }

//         console.log("Parsed body",parsedBody)

//         // parsing raw_feedback

//           // ✅ Step 1: Extract JSON substring from raw_feedback
//           const rawText =parsedBody&& parsedBody.overall_scoring&& parsedBody.overall_scoring.raw_feedback;

//           // console.log("Raw text:", rawText.substring(0,200))
//          const match = rawText.match(/\{[\s\S]*\}/); // Get everything from first { to last }

//           // console.log("[match]:",match)
//           if (match) {
//               const jsonString = match[0];

//               console.log("jsonString", jsonString)
//               try {
//                   const parsedJson = JSON.parse(jsonString);
//                   console.log("✅ Pure JSON object:", parsedJson);

//                   parsedBody.overall_scoring.raw_feedback = parsedJson
//               } catch (error) {
//                   console.error("❌ Failed to parse JSON:", error);
//               }
//           } else {
//               console.error("❌ No JSON found in raw_feedback");
//           }

//           return parsedBody


//       }

//       // If status_code is not 200, wait and try again
//       if (attempt < maxAttempts) {
//         console.log(`Status code not 200 (got ${response.data.data.status_code}). Waiting ${pollInterval/1000}s before next attempt...`);
//         await new Promise(resolve => setTimeout(resolve, pollInterval));
//       }

//     } catch (error: any) {
//       console.error(`Error in polling attempt ${attempt}:`, error);

//       if (attempt < maxAttempts) {
//         await new Promise(resolve => setTimeout(resolve, pollInterval));
//         continue;
//       }

//       throw error;
//     }
//   }

//   throw new Error("Max polling attempts reached without receiving status_code: 200");
// };


const pollOverallScoring = async (essay_id: string) => {
  const maxAttempts = 30; // Max retry attempts
  const pollInterval = 5000; // 5 seconds delay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Polling attempt ${attempt}...`);

      const response = await axios.get(
        `https://llm.edusmartai.com/api/overall-scoring-by-id-speech-module?essay_id=${essay_id}`
      );

      const { status_code, body } = response.data.data;
      console.log("API Response:", response.data);

      // ✅ Stop polling when status_code = 200
      if (status_code === 200) {
        console.log("✅ Received status_code: 200 - Parsing data...");

        // Parse body JSON
        let parsedBody;
        try {
          parsedBody = JSON.parse(body);
        } catch (error) {
          throw new Error("Failed to parse body JSON");
        }

        console.log("Parsed Body:", parsedBody);

        // ✅ Parse raw_feedback if it contains embedded JSON
        const rawText = parsedBody?.overall_scoring?.raw_feedback;
        if (rawText) {
          const match = rawText.match(/\{[\s\S]*\}/); // Extract JSON from text
          if (match) {
            try {
              const parsedJson = JSON.parse(match[0]);
              parsedBody.overall_scoring.raw_feedback = parsedJson;
            } catch (error) {
              console.error("❌ Failed to parse raw_feedback JSON:", error);
            }
          }
        }

        // ✅ Return final parsed data and exit
        return parsedBody;
      }

      // If not 200, wait before next attempt
      console.log(
        `Status code is ${status_code}. Retrying in ${pollInterval / 1000}s...`
      );
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error(`Error on attempt ${attempt}:`, error);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } else {
        throw new Error("Polling failed after max attempts");
      }
    }
  }

  throw new Error("Max attempts reached without receiving status_code: 200");
};







export default function ResultsPage() {


  const searchParams = useSearchParams();
  const essayId = searchParams.get("essay_id");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!essayId) return;

      console.log("Calling effect: in essay id");
      setLoading(true);
      setError(null);

      try {
        const result = await pollOverallScoring(essayId);
        setData(result);

      } catch (err) {
        console.error("API Error:", err);
        setError(err.message || "An error occurred while fetching results");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [essayId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>

          {/* <p>ihbvghkhkvbhkv{scoringState.data.feedbackData.speaking_performance.fluency_assessment.analysis}</p> */}



          <button
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const rawFeedback = data ? data.overall_scoring : null

  console.log("first", rawFeedback)


  if (!rawFeedback) {
    return <div className="text-gray-500 text-center py-6">No feedback available.</div>;
  }

  return (
    <div className="space-y-8">
      {/* ✅ Overall Scores Section */}
      <section>
        <h2 className="text-2xl text-black font-bold mb-4">Overall Scores</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-black">
          {["pronunciation", "grammar", "fluency"].map((key) => (
            <div key={key} className="border rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold capitalize">{key}</h3>
              <p className="text-xl font-bold text-indigo-600">
                {rawFeedback.overall_scores?.[key] ?? "N/A"}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
          <p className=" text-black font-medium">
            Detected Emotion:{" "}
            <span className="text-indigo-700 font-semibold">
              {rawFeedback.overall_scores?.emotion || "Not detected"}
            </span>
          </p>
        </div>
      </section>

      {/* ✅ Content Understanding & Detail Retention */}
      <section className="grid text-black grid-cols-1 md:grid-cols-2 gap-8">
        {/* Content Understanding */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Content Understanding</h2>
          {/* <p>{rawFeedback.raw_feedback.detailed_suggestions[0]}</p> */}
          <p><strong>Comprehension consistency :</strong>{rawFeedback.raw_feedback.feedback.comprehension_consistency}</p>
          
          <p><strong>Explanation : </strong>{rawFeedback.raw_feedback.feedback.content_understanding.explanation}</p>
          <p><strong>Pattern analysis : </strong>{rawFeedback.raw_feedback.feedback.content_understanding.pattern_analysis}</p>
          <p><strong>Score : </strong>{rawFeedback.raw_feedback.feedback.content_understanding.score}</p>
        </div>





        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Speaking performance</h2>
          
          <p><strong>Score : </strong>{rawFeedback.raw_feedback.speaking_performance.fluency_assessment.score}</p>
          <p><strong>Analysis :</strong>{rawFeedback.raw_feedback.speaking_performance.fluency_assessment.analysis}</p>
          <p><strong>Consistency : </strong>{rawFeedback.raw_feedback.speaking_performance.fluency_assessment.consistency}</p>


        </div>



        {/* Detail Retention */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Pronunciation assessment</h2>
          {/* <p>{rawFeedback.raw_feedback.detailed_suggestions[0]}</p> */}
          <p><strong>Score ; </strong>{rawFeedback.raw_feedback.speaking_performance.pronunciation_assessment.score}</p>
          <p><strong>Analysis : </strong>{rawFeedback.raw_feedback.speaking_performance.pronunciation_assessment.analysis}</p>
          {/* <p><strong>consistency</strong>{rawFeedback.raw_feedback.speaking_performance.pronunciation_assessment.consistent_strengths}</p>
           <p><strong>systematic_errors</strong>{rawFeedback.raw_feedback.speaking_performance.pronunciation_assessment.systematic_errors}</p> */}

        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Speaking clarity</h2>
          {/* <p>{rawFeedback.raw_feedback.detailed_suggestions[0]}</p> */}
          <p><strong>Score : </strong>{rawFeedback.raw_feedback.speaking_performance.speaking_clarity.clarity_trend}</p>
          <p><strong>Analysis : </strong>{rawFeedback.raw_feedback.speaking_performance.speaking_clarity.overall_rating}</p>


        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Vocabulary usage</h2>
          {/* <p>{rawFeedback.raw_feedback.detailed_suggestions[0]}</p> */}
          <p><strong>Score : </strong>{rawFeedback.raw_feedback.speaking_performance.vocabulary_usage.assessment}</p>
          <p><strong>Analysis : </strong>{rawFeedback.raw_feedback.speaking_performance.vocabulary_usage.consistency}</p>

        </div>


        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">technical_metrics</h2>

          <p><strong>Filler word patterns : </strong>{rawFeedback.raw_feedback.technical_metrics.filler_word_patterns}</p>
          <p><strong>Pause patterns : </strong>{rawFeedback.raw_feedback.technical_metrics.pause_patterns}</p>
          <p><strong>Prosody consistency : </strong>{rawFeedback.raw_feedback.technical_metrics.prosody_consistency}</p>
          <p><strong>Speaking rate consistency : </strong>{rawFeedback.raw_feedback.technical_metrics.speaking_rate_consistency}</p>

        </div>




      </section>


      <section className="grid text-black grid-cols-1  gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">Detailed Suggestions</h2>
          {Array.isArray(rawFeedback.raw_feedback.detailed_suggestions) &&
            rawFeedback.raw_feedback.detailed_suggestions.map((item, index) => (
              <div key={index} className="bg-gray-100 p-3 rounded-lg mb-4 shadow-sm">
                <p><strong>Based On : </strong> {item.based_on}</p>
                <p><strong>Expected Impact : </strong> {item.expected_impact}</p>
                <p><strong>Implementation : </strong> {item.implementation}</p>
                <p><strong>Suggestion : </strong> {item.suggestion}</p>
              </div>
            ))}
        </div>




       
        


          <div>
            <h2 className="text-lg font-semibold mb-2">Practice recommendations</h2>
            {Array.isArray(rawFeedback.raw_feedback.practice_recommendations) &&
              rawFeedback.raw_feedback.practice_recommendations.map((item, index) => (
                <div key={index} className="bg-gray-100 p-3 rounded-lg mb-4 shadow-sm">
                  <p><strong>Activity : </strong> {item.activity}</p>
                  <p><strong>Expected outcome : </strong> {item.expected_outcome}</p>
                  <p><strong>Frequency : </strong> {item.frequency}</p>
                  <p><strong>Priority : </strong> {item.priority}</p>
                </div>
              ))}
          </div>
    


  <div>
            <h2 className="text-lg font-semibold mb-2">Strengths</h2>
            {Array.isArray(rawFeedback.raw_feedback.strengths) &&
              rawFeedback.raw_feedback.strengths.map((item, index) => (
                <div key={index} className="bg-gray-100 p-3 rounded-lg mb-4 shadow-sm">
                  <p><strong>Evidence : </strong> {item.evidence}</p>
                  <p><strong>Frequency : </strong> {item.frequency}</p>
                  <p><strong>Impact : </strong> {item.impact}</p>
                  <p><strong>Strength : </strong> {item.strength}</p>
                </div>
              ))}
        </div>
      </section>
    
     
    </div>
  );
}