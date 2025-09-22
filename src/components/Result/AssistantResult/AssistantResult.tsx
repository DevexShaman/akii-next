"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Smile, Frown, Meh } from "react-feather";
import { Info } from "react-feather";

// const pollOverallScoring = async (essay_id) => {
//   const maxAttempts = 1; // Max retry attempts
//   const pollInterval = 5000; // 5 seconds delay

//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       console.log(`🔄 Polling attempt ${attempt}/${maxAttempts} for essay_id: ${essay_id}`);
      
//       const response = await fetch(
//         `https://llm.edusmartai.com/api/overall-scoring-by-id-speech-module?essay_id=${essay_id}`
//       );
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const responseData = await response.json();

      
//       console.log(`📊 Received response:`, responseData?.status);
      
//       // ✅ SUCCESS: Stop polling and return data when status is "success"
//       if (responseData?.status === "success") {
//         console.log("✅ Success! Status 'success' received - stopping polling");
        

      
       
//       }
      
//       // ⏳ Still processing - continue polling
//       console.log(`⏳ Still processing (status: ${status}), retrying in ${pollInterval/1000} seconds...`);
      
//       // Only wait if we're not on the last attempt
//       if (attempt < maxAttempts) {
//         await new Promise((resolve) => setTimeout(resolve, pollInterval));
//       }
      
//     } catch (error) {
//       console.error(`❌ Error on attempt ${attempt}:`, error);
      
//       // Only retry if we haven't reached max attempts
//       if (attempt < maxAttempts) {
//         console.log(`🔄 Retrying in ${pollInterval/1000} seconds...`);
//         await new Promise((resolve) => setTimeout(resolve, pollInterval));
//       } else {
//         throw new Error("Polling failed after max attempts");
//       }
//     }
//   }

//   throw new Error("Max attempts reached without receiving status: 'success'");
// };




export default function AssistantResult() {
  const searchParams = useSearchParams();
  const [apiData, setApiData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Changed from boolean to store error message
  const [apiStatus, setApiStatus] = useState(null); // New state to store API status




  const pollOverallScoring = async (essay_id) => {
  const maxAttempts = 10; // Increased attempts for better polling
  const pollInterval = 5000; // 5 seconds delay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Polling attempt ${attempt}/${maxAttempts} for essay_id: ${essay_id}`);
      
      const response = await fetch(
        `https://llm.edusmartai.com/api/overall-scoring-by-id-speech-module?essay_id=${essay_id}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
     
      

      setApiData(responseData?.data?.overall_scoring)
      // ✅ SUCCESS: Stop polling and return data when status is "success"
      if (responseData?.status === "success") {
        console.log("✅ Success! Status 'success' received - stopping polling");
        
        // Return the complete response data
        return responseData;
      }
      
      // ⏳ Still processing - continue polling
      console.log(`⏳ Still processing (status: ${responseData?.status}), retrying in ${pollInterval/1000} seconds...`);
      
      // Only wait if we're not on the last attempt
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
      
    } catch (error) {
      console.error(`❌ Error on attempt ${attempt}:`, error);
      
      // Only retry if we haven't reached max attempts
      if (attempt < maxAttempts) {
        console.log(`🔄 Retrying in ${pollInterval/1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } else {
        throw new Error("Polling failed after max attempts");
      }
    }
  }

  throw new Error("Max attempts reached without receiving status: 'success'");
};

console.log("[[[[[[[[[[[[[[[[[[[[[[object]]]]]]]]]]]]]]]]]]]]]]",apiData)


  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setApiStatus("loading"); // Set initial status
        
        // Get essay_id from URL params or use a default value for testing
        const essay_id = searchParams.get('essay_id') || 'test-essay-id';
        
        // Start polling for the overall scoring data
        const data = await pollOverallScoring(essay_id);
        
        // Store the successful response
        setApiData(data);
        setApiStatus("success"); // Set status to success
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load assessment data');
        setApiStatus("error"); // Set status to error
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  const getEmotionIcon = (emotion) => {
    switch (emotion?.toLowerCase()) {
      case 'happy':
      case 'excited':
        return <Smile className="h-5 w-5 text-green-500" />;
      case 'surprised':
        return <Meh className="h-5 w-5 text-yellow-500" />;
      case 'sad':
      case 'frustrated':
        return <Frown className="h-5 w-5 text-red-500" />;
      default:
        return <Meh className="h-5 w-5 text-gray-500" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment results...</p>
          <p className="text-sm text-gray-500 mt-2">This may take up to 2-3 minutes</p>
          {apiStatus && (
            <p className="text-sm text-blue-500 mt-1">Status: {apiStatus}</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <h2 className="text-lg font-semibold">Error Loading Results</h2>
          </div>
          <p className="text-gray-600">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }


    const data = apiData?.data?.overall_scoring;

  if (!apiData?.data?.overall_scoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No assessment data available</p>
            <p className="text-sm text-gray-500 mt-2">API Status: {apiStatus}</p>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Assessment Results</h1>
          <p className="text-gray-600">Comprehensive analysis of your language learning performance</p>
          {/* Show API status indicator */}
          <div className="mt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              apiStatus === 'success' ? 'bg-green-100 text-green-800' :
              apiStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Status: {apiStatus}
            </span>
          </div>
        </div>

        {/* Overall Scores Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-6">
            <CheckCircle className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Overall Performance Scores</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className={`text-center p-4 rounded-lg ${getScoreBgColor(data.overall_scores.pronunciation)}`}>
              <div className={`text-3xl font-bold mb-2 ${getScoreColor(data.overall_scores.pronunciation)}`}>
                {data.overall_scores.pronunciation}
              </div>
              <div className="text-sm font-medium text-gray-700">Pronunciation</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${data.overall_scores.pronunciation * 10}%` }}
                ></div>
              </div>
            </div>

            <div className={`text-center p-4 rounded-lg ${getScoreBgColor(data.overall_scores.grammar)}`}>
              <div className={`text-3xl font-bold mb-2 ${getScoreColor(data.overall_scores.grammar)}`}>
                {data.overall_scores.grammar.toFixed(1)}
              </div>
              <div className="text-sm font-medium text-gray-700">Grammar</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${data.overall_scores.grammar * 10}%` }}
                ></div>
              </div>
            </div>

            <div className={`text-center p-4 rounded-lg ${getScoreBgColor(data.overall_scores.fluency)}`}>
              <div className={`text-3xl font-bold mb-2 ${getScoreColor(data.overall_scores.fluency)}`}>
                {data.overall_scores.fluency}
              </div>
              <div className="text-sm font-medium text-gray-700">Fluency</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${data.overall_scores.fluency * 10}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center p-4 rounded-lg bg-blue-100">
              <div className="text-3xl font-bold mb-2 text-blue-600">
                {data.overall_scores.consistency_score}
              </div>
              <div className="text-sm font-medium text-gray-700">Consistency</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${parseFloat(data.overall_scores.consistency_score) * 10}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full">
              {getEmotionIcon(data.overall_scores.emotion)}
              <span className="ml-2 font-medium">Current Emotion: {data.overall_scores.emotion}</span>
            </div>
          </div>
        </div>

        {/* Priority Improvement */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Priority Improvement Area</h2>
          </div>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <h3 className="font-bold text-red-800 mb-2">{data.improvement_priority.area}</h3>
            <div className="space-y-2 text-red-700">
              <p><strong>Urgency:</strong> {data.improvement_priority.urgency}</p>
              <p><strong>Reason:</strong> {data.improvement_priority.reason}</p>
              <p><strong>First Steps:</strong> {data.improvement_priority.first_steps}</p>
            </div>
          </div>
        </div>

        {/* Strengths */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Your Strengths</h2>
          </div>
          
          <div className="space-y-4">
            {data.strengths.map((strength, index) => (
              <div key={index} className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-bold text-green-800 mb-2">{strength.strength}</h3>
                <div className="space-y-1 text-green-700">
                  <p><strong>Impact:</strong> {strength.impact}</p>
                  <p><strong>Frequency:</strong> {strength.frequency}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Speaking Performance Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Info className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Speaking Performance</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Fluency Assessment</h4>
                <p className="text-sm text-gray-600 mb-1">
                  Score: {data.speaking_performance.fluency_assessment.score}/10
                </p>
                <p className="text-sm text-gray-700">{data.speaking_performance.fluency_assessment.analysis}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Grammar Assessment</h4>
                <p className="text-sm text-gray-600 mb-1">
                  Score: {data.speaking_performance.grammar_assessment.score.toFixed(1)}/10
                </p>
                <p className="text-sm text-gray-700 mb-2">{data.speaking_performance.grammar_assessment.analysis}</p>
                {data.speaking_performance.grammar_assessment.error_patterns.length > 0 && (
                  <div>
                    <strong className="text-sm">Error Patterns:</strong>
                    <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                      {data.speaking_performance.grammar_assessment.error_patterns.map((pattern, index) => (
                        <li key={index}>{pattern}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Pronunciation Assessment</h4>
                <p className="text-sm text-gray-600 mb-1">
                  Score: {data.speaking_performance.pronunciation_assessment.score}/10
                </p>
                <p className="text-sm text-gray-700">{data.speaking_performance.pronunciation_assessment.analysis}</p>
                {data.speaking_performance.pronunciation_assessment.systematic_errors.length > 0 && (
                  <div className="mt-2">
                    <strong className="text-sm">Systematic Errors:</strong>
                    <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                      {data.speaking_performance.pronunciation_assessment.systematic_errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Info className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Content Understanding</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Content Understanding</h4>
                <p className="text-sm text-gray-600 mb-1">
                  Score: {data.feedback.content_understanding.score}
                </p>
                <p className="text-sm text-gray-700">{data.feedback.content_understanding.explanation}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Detail Retention</h4>
                <p className="text-sm text-gray-600 mb-1">
                  Score: {data.feedback.detail_retention.score}
                </p>
                <p className="text-sm text-gray-700">{data.feedback.detail_retention.explanation}</p>
                {data.feedback.detail_retention.missed_points.length > 0 && (
                  <div className="mt-2">
                    <strong className="text-sm">Missed Points:</strong>
                    <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                      {data.feedback.detail_retention.missed_points.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Practice Recommendations */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Practice Recommendations</h2>
          </div>
          
          <div className="space-y-4">
            {data.practice_recommendations.map((rec, index) => (
              <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-bold text-blue-800 mb-2">{rec.activity}</h3>
                <div className="space-y-1 text-blue-700">
                  <p><strong>Frequency:</strong> {rec.frequency}</p>
                  <p><strong>Priority:</strong> {rec.priority}</p>
                  <p><strong>Expected Outcome:</strong> {rec.expected_outcome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Encouragement */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Smile className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Keep Going!</h2>
          </div>
          
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <h3 className="font-bold text-green-800 mb-2">Progress Highlight</h3>
            <p className="text-green-700 mb-2">{data.encouragement.progress_highlight}</p>
            <p className="text-green-700 font-medium">{data.encouragement.motivational_message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}