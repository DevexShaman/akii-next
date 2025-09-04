// app/result/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaArrowLeft,
  FaSpinner,
  FaChartLine,
  FaRegSmile,
  FaCommentAlt, 
  FaQuoteLeft,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { FeedbackData } from "./resultpageTypes";


const ResultPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const essayId = searchParams.get("essayId");
  const [resultData, setResultData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const maxRetries = 10;
  const retryDelay = 3000;
  const maxDuration = 30000;


  function safeDeepParse(str: string) {
    try {
      let parsed = str;
      let depth = 0;
      while (typeof parsed === "string" && depth < 5) {
        parsed = JSON.parse(parsed);
        depth++;
      }
      return parsed;
    } catch (err) {
      console.error("Failed to parse nested JSON:", err);
      return null;
    }
  }

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to clear timeout
  const clearCurrentTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (durationTimeoutRef.current) {
      clearTimeout(durationTimeoutRef.current);
      durationTimeoutRef.current = null;
    }
  }, []);

  // Helper function to get auth token
  const getAuthToken = useCallback(() => {
    return (
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token") ||
      ""
    );
  }, []);

  const fetchResults = useCallback(async () => {
    if (!essayId) {
      setError("Missing essay ID");
      setLoading(false);
      return;
    }

    // Check if 30 seconds have passed since we started
    if (startTimeRef.current && Date.now() - startTimeRef.current >= maxDuration) {
      clearCurrentTimeout();
      setError("Analysis timeout after 30 seconds. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const token = getAuthToken();

      if (!token) {
        setError("Authentication token not found. Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/overall-scoring-by-id?essay_id=${essayId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Handle different HTTP status codes
      if (response.status === 401) {
        setError("Authentication failed. Please login again.");
        setLoading(false);
        return;
      }

      if (response.status === 404) {
        setError("Essay not found. Please check the essay ID.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Check the nested status_code in the response data
      if (data.data && data.data.status_code === 200) {
        const parsedRes = JSON.parse(data.data.body)
        clearCurrentTimeout();
        setResultData(parsedRes.overall_scoring);
        setLoading(false);
        return;
      }

      // If status_code is not 200, continue retrying (but check time limit)
      if (startTimeRef.current && Date.now() - startTimeRef.current >= maxDuration) {
        clearCurrentTimeout();
        setError("Analysis timeout after 30 seconds. Please try again.");
        setLoading(false);
        return;
      }

      if (retryCount < maxRetries) {
        const delay = retryDelay * Math.pow(1.2, retryCount);
        timeoutRef.current = setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          fetchResults();
        }, delay);
      } else {
        clearCurrentTimeout();
        setError("Analysis is taking too long. Please try again later.");
        setLoading(false);
      }

    } catch (err) {
      // Clear timeout on error
      clearCurrentTimeout();

      // Handle different error types
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("Network error. Please check your internet connection.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }

      setLoading(false);
    }
  }, [essayId, retryCount, maxRetries, maxDuration, getAuthToken, clearCurrentTimeout]);


  useEffect(() => {
    if (essayId) {
      fetchResults();
    } else {
      setError("Missing essay ID");
      setLoading(false);
    }

    // Cleanup timeout on component unmount or essayId change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [essayId, fetchResults]);

  const parseScore = (value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const calculateOverallScore = () => {
    if (!resultData) return 0;

    const validScores = [
      parseScore(resultData.overall_scores.grammar),
      parseScore(resultData.overall_scores.pronunciation),
      parseScore(resultData.overall_scores.fluency),
    ].filter((score) => score > 0);

    if (validScores.length === 0) return 0;
    return (
      validScores.reduce((a, b) => a + b, 0) / validScores.length
    ).toFixed(1);
  };

  const result = resultData
    ? {
      overallScore: calculateOverallScore(),
      pronunciation: parseScore(resultData.overall_scores.pronunciation),
      fluency: parseScore(resultData.overall_scores.fluency),
      grammar: parseScore(resultData.overall_scores.grammar),
      emotion: resultData.overall_scores.emotion,
      understanding: resultData.content_analysis.understanding_depth.score,
      // topicGrip: resultData.content_analysis.topic_grip,
      // suggestions: resultData.overall_scores. || [],
    }
    : {
      overallScore: 0,
      pronunciation: 0,
      fluency: 0,
      grammar: 0,
      emotion: "",
      understanding: "",
      // topicGrip: "",
      // suggestions: [],
    };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <FaSpinner className="animate-spin text-indigo-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-700 text-lg">
            Analyzing your performance...{" "}
            {retryCount > 0 && "(This may take a moment)"}
          </p>
          {retryCount > 3 && (
            <p className="text-gray-500 mt-2">
              Still processing... {maxRetries - retryCount} attempts remaining
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Results
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const pronunciationScore = parseScore(resultData.overall_scores.pronunciation);
  const fluencyScore = parseScore(resultData.overall_scores.fluency);
  const grammarScore = parseScore(resultData.overall_scores.grammar);
  const overallScore = calculateOverallScore();



  const emotionEmojiMap: Record<string, string> = {
    surprised: "😲",
    happy: "😊",
    neutral: "😐",
    sad: "😔",
    angry: "😠",
    fearful: "😨",
    disgusted: "🤢",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Your Speaking Results
          </h1>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>


        
        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Overall Score</h2>
                <p className="opacity-80">Based on your recording</p>
              </div>
              <div className="relative">
                <div className="w-28 h-28 rounded-full border-4 border-white/30 flex items-center justify-center">
                  <span className="text-4xl font-bold">{overallScore}</span>
                  <span className="text-lg">/10</span>
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin-slow"></div>
              </div>
            </div>
          </div>
        </motion.div>
        {/* <h1>dfcscfdsf{parsedRes.content_analysis.coverage_metrics.original_word_count}</h1> */}
        {/* Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaChartLine className="text-indigo-500 mr-2" />
              Score Breakdown
            </h3>
            <div className="space-y-4">
              {[
                { label: "Pronunciation", score: pronunciationScore },
                { label: "Fluency", score: fluencyScore },
                { label: "Grammar", score: grammarScore },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1 text-black">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-semibold">{item.score}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${item.score * 10}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emotion & Suggestions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaRegSmile className="text-indigo-500 mr-2" />
                Emotion
              </h3>
              <div className="flex items-center">
                <span className="inline-block bg-indigo-100 text-indigo-800 text-lg px-4 py-2 rounded-full">
                  {emotionEmojiMap[resultData.overall_scores.emotion] || "☺"}
                  <span className="ml-2 capitalize">{resultData.overall_scores.emotion}</span>
                </span>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Detailed Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1  gap-6 mb-8"
        >
          <div className="bg-white p-6 rounded-2xl shadow-lg text-black">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaQuoteLeft className="text-green-500 mr-2" />
              Content Analysis
            </h3>
            <h4><strong>Coverage metrics</strong></h4>
            <p><strong>Original word count : </strong>{resultData.content_analysis.coverage_metrics.original_word_count}</p>
            <p><strong>Response word count : </strong>{resultData.content_analysis.coverage_metrics.response_word_count}</p>
            <p><strong>Coverage percentage : </strong>{resultData.content_analysis.coverage_metrics.coverage_percentage}</p>
            {/* <p>{resultData.content_analysis.coverage_metrics.main_themes_captured}</p> */}
            <div>
              {resultData.content_analysis.coverage_metrics.main_themes_captured.map((theme: string, index: number) => (
                <p key={index}><strong>{theme}</strong></p>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaQuoteLeft className="text-green-500 mr-2" />
              Understanding Depth
            </h3>
            <h4><strong>Coverage metrics</strong></h4>
            <p><strong>Score : </strong>{resultData.content_analysis.understanding_depth.score}</p>
            <p><strong>Explanation : </strong>{resultData.content_analysis.understanding_depth.explanation}</p>
            <p><strong>Semantic accuracy : </strong>{resultData.content_analysis.understanding_depth.semantic_accuracy}</p>
            <p><strong>Conceptual gaps : </strong>{resultData.content_analysis.understanding_depth.conceptual_gaps}</p>


            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaQuoteLeft className="text-green-500 mr-2" />
              Detail Retention
            </h3>
            <h4><strong>Coverage metrics</strong></h4>
            <p><strong>Score : </strong>{resultData.content_analysis.detail_retention.score}</p>
            <p><strong>Explanation : </strong>{resultData.content_analysis.detail_retention.explanation}</p>
            {/* <p><strong>Semantic accuracy : </strong>{resultData.content_analysis.detail_retention.key_details_captured}</p> */}

            <div>
              <strong>key details Captured : </strong>
              {resultData.content_analysis.detail_retention.key_details_captured.map((detail: string, index: number) => (
                <p key={index}>{detail}</p>
              ))}
            </div>
            <div>
              <strong>important details missed: </strong>
              {resultData.content_analysis.detail_retention.important_details_missed.map((detail: string, index: number) => (
                <p key={index}>{detail}</p>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg text-black">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaQuoteLeft className="text-green-500 mr-2" />
              Linguistic Performance
            </h3>
            <h4><strong>Fluency Assessment</strong></h4>
            <p><strong>Score : </strong>{resultData.linguistic_performance.fluency_assessment.score}</p>
            <p><strong>Detailed Analysis : </strong>{resultData.linguistic_performance.fluency_assessment.detailed_analysis}</p>
            <p><strong>Pace Appropriateness : </strong>{resultData.linguistic_performance.fluency_assessment.pace_appropriateness}</p>
            {/* <p>{resultData.content_analysis.coverage_metrics.main_themes_captured}</p> */}
            <div>
              <strong>Main Themes Captured:</strong>
              {resultData.content_analysis.coverage_metrics.main_themes_captured.map((theme: string, index: number) => (
                <p key={index}>{theme}</p>
              ))}
            </div>
            <h4><strong>Pronounciation Assessment</strong></h4>
            <p><strong>Score : </strong>{resultData.linguistic_performance.pronunciation_assessment.score}</p>
            <p><strong>impact_onlarity : </strong>{resultData.linguistic_performance.pronunciation_assessment.impact_on_clarity}</p>

            <div>
              <strong>Semantic accuracy: </strong>
              {resultData.linguistic_performance.pronunciation_assessment.strengths.map((item: string, index: number) => (
                <p key={index}>{item}</p>
              ))}
            </div>
            <h4><strong>Coverage metrics</strong></h4>
            <p><strong>Score : </strong>{resultData.linguistic_performance.grammar_assessment.score}</p>
            <p><strong>Complexity level : </strong>{resultData.linguistic_performance.grammar_assessment.complexity_level}</p>
            <p><strong>Error patterns : </strong>{resultData.linguistic_performance.grammar_assessment.error_patterns}</p>
            <p><strong>Accuracy analysis : </strong>{resultData.linguistic_performance.grammar_assessment.accuracy_analysis}</p>

           
            <h4><strong>Coverage metrics</strong></h4>
            <p><strong>Score : </strong>{resultData.linguistic_performance.vocabulary_usage.appropriateness}</p>
            <p><strong>Explanation : </strong>{resultData.linguistic_performance.vocabulary_usage.precision}</p>
            <p><strong>Semantic accuracy : </strong>{resultData.linguistic_performance.vocabulary_usage.synonym_usage}</p>

          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg text-black">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaQuoteLeft className="text-green-500 mr-2" />
              Technical delivery
            </h3>
            <h4><strong>Fluency Assessment</strong></h4>
            <p><strong>Score : </strong>{resultData.technical_delivery.clarity_coherence}</p>
            <p><strong>Detailed Analysis : </strong>{resultData.technical_delivery.comprehensibility_score}</p>
            <p><strong>Pace Appropriateness : </strong>{resultData.technical_delivery.emotion_appropriateness}</p>
            <div>
              <strong>Main Themes Captured:</strong>
              {resultData.content_analysis.coverage_metrics.main_themes_captured.map((theme: string, index: number) => (
                <p key={index}>{theme}</p>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg text-black">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaQuoteLeft className="text-green-500 mr-2" />
              Content Analysis
            </h3>
            <h4><strong>Coverage metrics</strong></h4>
            <p><strong>Original word count : </strong>{resultData.content_analysis.coverage_metrics.original_word_count}</p>
            <p><strong>Response word count : </strong>{resultData.content_analysis.coverage_metrics.response_word_count}</p>
            <p><strong>Coverage percentage : </strong>{resultData.content_analysis.coverage_metrics.coverage_percentage}</p>
            <div className="flex gap-2"> <strong>Main themes captured : </strong>
              {resultData.content_analysis.coverage_metrics.main_themes_captured.map((theme: string, index: number) => (
                <p key={index}><strong>{theme}</strong></p>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg text-black">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaQuoteLeft className="text-green-500 mr-2" />
              Improvement strategy
            </h3>
            <h4><strong>Fluency Assessment</strong></h4>
            <p><strong>Score : </strong>{resultData.improvement_strategy.immediate_priority}</p>
            <div>
              <strong>Detailed Analysis: </strong>
              {resultData.improvement_strategy.content_handling_tips.map((tip: string, index: number) => (
                <p key={index}>{tip}</p>
              ))}
            </div>

            <div>
              <strong>Pace Appropriateness: </strong>
              {resultData.improvement_strategy.practice_recommendations.map((rec: string, index: number) => (
                <p key={index}>{rec}</p>
              ))}
            </div>
          </div>

               <div className="bg-white p-6 rounded-2xl shadow-lg text-black">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaQuoteLeft className="text-green-500 mr-2" />
              Improvement strategy
            </h3>
            
            <p><strong>Overall comprehension : </strong>{resultData.adaptive_scoring.content_adjusted_scores.overall_comprehension}</p>
            <p><strong>Retention score : </strong>{resultData.adaptive_scoring.content_adjusted_scores.retention_score}</p>
            <p><strong>Understanding score : </strong>{resultData.adaptive_scoring.content_adjusted_scores.understanding_score}</p>
            <p><strong>Scoring rationale : </strong>{resultData.adaptive_scoring.scoring_rationale}</p>

          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg text-black">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaQuoteLeft className="text-green-500 mr-2" />
              Encouragement message
            </h3>

            <p><strong>Encouragement message : </strong>{resultData.encouragement_message}</p>

          </div>

        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-lg mb-8"
        >
          <div className="flex items-center mb-4">
            <FaCommentAlt className="text-indigo-500 mr-2 text-xl" />
            <h3 className="text-xl font-semibold text-gray-800">
              Detailed Feedback
            </h3>
          </div>

          <div className="space-y-4">

            <div className="p-4 rounded-xl bg-blue-50 border-l-4 border-l-blue-500">
              <h4 className="font-semibold text-gray-800 mb-2">
                Understanding
              </h4>
              <p className="text-gray-700">{resultData.content_analysis.understanding_depth.explanation}</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
