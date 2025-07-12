"use client";

import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAppDispatch, useAppSelector } from "../../store";
import { generateParagraph } from "../../store/slices/paragraphSlice";
import { FaSpinner, FaVolumeUp } from "react-icons/fa";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";



const Dashboard = () => {
  const dispatch = useAppDispatch();
 const router = useRouter();
  const { generatedParagraph, isLoading } = useAppSelector(
    (state) => state.paragraph
  );

  console.log("generatedParagraph", generatedParagraph)
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Options for dropdowns
  const classOptions = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];

  const accentOptions = [
    "American",
    "British",
    "Australian",
    "Indian",
    "Canadian",
    "Irish",
  ];

  const moodOptions = [
    "Happy",
    "Excited",
    "Calm",
    "Serious",
    "Playful",
    "Confident",
  ];

  const difficultyOptions = ["Easy", "Medium", "Strong"];

  const initialValues = {
    class: "",
    accent: "",
    topic: "",
    mood: "",
    difficulty: "",
  };

  const validationSchema = Yup.object({
    class: Yup.string().required("Class is required"),
    accent: Yup.string().required("Accent is required"),
    topic: Yup.string()
      .required("Topic is required")
      .min(3, "Topic must be at least 3 characters"),
    mood: Yup.string().required("Mood is required"),
    difficulty: Yup.string().required("Difficulty is required"),
  });

  const handleSubmit = (values) => {
    dispatch(generateParagraph(values))
      .unwrap()
      .catch((error) => {
        toast.error(error || "Failed to generate paragraph");
      });
  };

const speakParagraph = (accent) => {
  if ("speechSynthesis" in window && generatedParagraph) {
    const utterance = new SpeechSynthesisUtterance(generatedParagraph);
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find((voice) =>
      voice.name.toLowerCase().includes(accent.toLowerCase())
    );
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  } else {
    toast.warn("Text-to-speech not supported in this browser");
  }
};


const handlePractice = () => {
  if (!generatedParagraph) {
    toast.error("No paragraph generated to practice");
    return;
  }

  // Encode and pass paragraph via URL
  const encodedParagraph = encodeURIComponent(generatedParagraph);
  router.push(`/practice?paragraph=${encodedParagraph}`);
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-white shadow-xl rounded-xl overflow-hidden"
      >
        <div className="bg-indigo-600 py-4 px-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Create Your English Practice
          </h2>
        </div>

        <div className="p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isValid, dirty }) => (
              <Form>
                <div className="grid gap-6 mb-6 md:grid-cols-2">
                  {/* Class Dropdown */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="class"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                    >
                      <option value="">Select class</option>
                      {classOptions.map((option) => (
                        <option key={option} value={option}>
                          Grade {option}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="class"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Accent Dropdown */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Accent <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="accent"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                    >
                      <option value="">Select accent</option>
                      {accentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="accent"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Topic Input */}
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Topic <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="text"
                      name="topic"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                      placeholder="What do you want to talk about?"
                    />
                    <ErrorMessage
                      name="topic"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Mood Dropdown */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Mood <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="mood"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                    >
                      <option value="">Select mood</option>
                      {moodOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="mood"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Difficulty Dropdown */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Difficulty Level <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="difficulty"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                    >
                      <option value="">Select difficulty</option>
                      {difficultyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="difficulty"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-8">
                  <button
                    type="submit"
                    disabled={isLoading || !(isValid && dirty)}
                    className={`px-6 py-3 rounded-full font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isLoading || !(isValid && dirty)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <FaSpinner className="animate-spin mr-2" />
                        Generating...
                      </span>
                    ) : (
                      "Generate Paragraph"
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          {/* Generated Paragraph Section */}
          {generatedParagraph && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4">
                  Generated Paragraph
                </h3>
                <button
                  onClick={() => speakParagraph(/* accent */ values.accent)}

                  disabled={isSpeaking}
                  className={`p-3 rounded-full ${
                    isSpeaking
                      ? "bg-indigo-200 text-indigo-600"
                      : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                  } transition-colors`}
                  aria-label="Listen to paragraph"
                >
                  <FaVolumeUp className="text-xl" />
                </button>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-inner">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {generatedParagraph}
                </p>
              </div>

              <div className="mt-4 flex justify-end">
                {/* <button
                  onClick={() => dispatch(resetParagraphState())}
                  className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Generate New
                </button> */}
                <button
                  onClick={handlePractice}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Practice now
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
