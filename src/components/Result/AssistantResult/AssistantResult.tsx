"use client";
import { fetchOverallScoring } from "@/store/slices/assistant/assistantSlice";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { CheckCircle, AlertCircle, Smile, Frown, Meh } from "react-feather";
import { Info } from "react-feather";

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

export default function ResultsPage() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.assistant);
  const searchParams = useSearchParams();
  const essayId = searchParams.get("essay_id");
  console.log(
    "Data Assistant results: ", data
  )

  const raw_feedback = data&&data.raw_feedback&&extractPureJSON(data.raw_feedback?data.raw_feedback:"")
  
  useEffect(() => {
    console.log("Caling effect:")
    if (essayId) {
      console.log("Caling effect: in essay id")

      dispatch(fetchOverallScoring(essayId));
    }
  }, [essayId, dispatch]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Speaking Assessment Results
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Detailed analysis of your speaking performance with personalized
            feedback
          </p>
        </div>

        {data && raw_feedback ?
          (
            <div className="space-y-8">
              {/* Overall Feedback */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Overall Feedback
                </h2>

                <div className="flex items-start mb-6">
                  <CheckCircle className="h-6 w-6 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-3 text-gray-600">{raw_feedback.feedback?.content_understanding}</p>
                </div>

                {/* Score Meters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="border border-gray-100 rounded-lg p-4 shadow-sm">
                    <h3 className="text-gray-700 font-medium mb-3">Pronunciation</h3>
                    <ScoreMeter value={raw_feedback.overall_scores?.pronunciation || 0} />
                  </div>
                  <div className="border border-gray-100 rounded-lg p-4 shadow-sm">
                    <h3 className="text-gray-700 font-medium mb-3">Grammar</h3>
                    <ScoreMeter value={raw_feedback.overall_scores?.grammar || 0} />
                  </div>
                  <div className="border border-gray-100 rounded-lg p-4 shadow-sm">
                    <h3 className="text-gray-700 font-medium mb-3">Fluency</h3>
                    <ScoreMeter value={raw_feedback.overall_scores?.fluency || 0} />
                  </div>
                </div>

                {/* Emotion */}
                <div className="flex items-center space-x-2 bg-indigo-50 rounded-lg p-4">
                  <div className="flex-shrink-0">
                    <EmotionIcon emotion={raw_feedback.overall_scores?.emotion} />
                  </div>
                  <p className="text-gray-700">
                    Detected emotion:{" "}
                    <span className="capitalize font-medium">{raw_feedback.overall_scores?.emotion}</span>
                  </p>
                </div>
              </div>

              {/* Feedback Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Understanding */}
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Content Understanding</h2>
                  <p className="text-gray-600">{raw_feedback.feedback?.content_understanding}</p>
                </div>

                {/* Detail Retention */}
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Detail Retention</h2>
                  <p className="text-gray-600">{raw_feedback.feedback?.detail_retention}</p>
                </div>
              </div>

              {/* Key Points & Missed Points */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Key Points & Missed Points
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Key Points Covered:</h3>
                    <ul className="list-disc pl-5 text-gray-600">
                      {raw_feedback.feedback?.key_points_covered?.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Missed Points:</h3>
                    <ul className="list-disc pl-5 text-gray-600">
                      {raw_feedback.feedback?.missed_points?.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Speaking Performance */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Speaking Performance
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>Fluency:</strong> {raw_feedback.speaking_performance?.fluency_assessment}</p>
                  <p><strong>Pronunciation:</strong> {raw_feedback.speaking_performance?.pronunciation_assessment}</p>
                  <p><strong>Grammar:</strong> {raw_feedback.speaking_performance?.grammar_assessment}</p>
                  <p><strong>Vocabulary Usage:</strong> {raw_feedback.speaking_performance?.vocabulary_usage}</p>
                  <p><strong>Speaking Clarity:</strong> {raw_feedback.speaking_performance?.speaking_clarity}</p>
                </div>
              </div>

              {/* Technical Metrics */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Technical Metrics
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>Speaking Rate:</strong> {raw_feedback.technical_metrics?.speaking_rate_analysis}</p>
                  <p><strong>Pauses:</strong> {raw_feedback.technical_metrics?.pause_analysis}</p>
                  <p><strong>Filler Words:</strong> {raw_feedback.technical_metrics?.filler_word_usage}</p>
                  <p><strong>Prosody:</strong> {raw_feedback.technical_metrics?.prosody_evaluation}</p>
                </div>
              </div>

              {/* Suggestions */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Suggestions for Improvement
                </h2>
                <div className="space-y-6">
                  {raw_feedback.detailed_suggestions?.map((suggestion, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-700 font-medium">{suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Strengths
                </h2>
                <ul className="list-disc pl-5 text-gray-700 space-y-2">
                  {raw_feedback.strengths?.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>

              {/* Practice Recommendations */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Practice Recommendations
                </h2>
                <ul className="list-disc pl-5 text-gray-700 space-y-2">
                  {raw_feedback.practice_recommendations?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Improvement Priority */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Improvement Priority</h2>
                <p className="text-gray-700">{raw_feedback.improvement_priority}</p>
              </div>

              {/* Encouragement */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Encouragement</h2>
                <p className="text-gray-700">{raw_feedback.encouragement}</p>
              </div>
            </div>

          )
          : (
            <div className="text-center py-12">
              <p className="text-gray-500">No results found</p>
            </div>
          )}
      </div>
    </div>
  );
}
