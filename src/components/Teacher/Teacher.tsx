"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/index";
import {
  setClass,
  setSubject,
  setCurriculum,
  processFiles,
  resetUpload,
} from "@/store/slices/teacherSlice";
import Button from "@/components/UI/Button";
import Progress from "@/components/UI/Progress";
import {
  FileText,
  X,
  UploadCloud,
  ChevronDown,
  BookOpen,
  Bookmark,
  GraduationCap,
  LayoutGrid,
} from "lucide-react";

const Teacher = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    class: className,
    subject,
    curriculum,
    isLoading,
    error,
    progress,
    ocrResults,
  } = useSelector((state: RootState) => state.teacher);

  const [showResults, setShowResults] = useState(false);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setLocalFiles((prev: File[]) => [...prev, ...acceptedFiles]);
  }, []);

  const handleRemoveFile = (fileName: string) => {
    setLocalFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg"],
      "application/pdf": [".pdf"],
      "application/vnd.ms-powerpoint": [".ppt", ".pptx"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleSubmit = async () => {
    if (!className || !subject || !curriculum) {
      alert("Please select class, subject, and curriculum");
      return;
    }

    if (localFiles.length === 0) {
      alert("Please upload at least one file");
      return;
    }

    try {
      setIsProcessing(true);
      await dispatch(processFiles(localFiles));
    } catch (error) {
      console.error("Processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setLocalFiles([]);
    dispatch(resetUpload());
  };

  const classOptions = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];
  const subjectOptions = ["Math", "Science", "History", "English", "Art"];
  const curriculumOptions = ["CBSE", "ICSE", "State Board", "IGCSE"];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upload Teaching Materials</h1>

      {/* Context Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Class</label>
          <select
            value={className || ""}
            onChange={(e) => dispatch(setClass(e.target.value))}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Class</option>
            {classOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Subject</label>
          <select
            value={subject || ""}
            onChange={(e) => dispatch(setSubject(e.target.value))}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Subject</option>
            {subjectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Curriculum</label>
          <select
            value={curriculum || ""}
            onChange={(e) => dispatch(setCurriculum(e.target.value))}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Curriculum</option>
            {curriculumOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* File Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 cursor-pointer
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2">
          {isDragActive
            ? "Drop files here"
            : "Drag & drop files here, or click to select"}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Supports PDF, PPT, JPG, PNG (max 10MB each)
        </p>
      </div>

      {/* Uploaded Files Preview */}
      {localFiles.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Selected Files</h2>
          <div className="space-y-2">
            {localFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center">
                  <FileText className="text-gray-500 mr-3" />
                  <span className="truncate max-w-xs">{file.name}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({(file.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFile(file.name)}
                  className={""}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Progress and Results */}
      {isLoading && (
        <div className="mb-6">
          <p className="mb-2">Processing files with Google Vision OCR...</p>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {Object.keys(ocrResults).length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">OCR Results</h2>
            <Button
              variant="outline"
              onClick={() => setShowResults(!showResults)}
              className={""}
            >
              {showResults ? "Hide Results" : "Show Results"}
            </Button>
          </div>

          {showResults && (
            <div className="space-y-4">
              {Object.entries(ocrResults).map(([fileName, text]) => (
                <div key={fileName} className="p-4 bg-gray-50 rounded">
                  <h3 className="font-medium mb-2">{fileName}</h3>
                  <div className="p-3 bg-white border rounded max-h-60 overflow-y-auto">
                    {text || "No text detected"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isProcessing || localFiles.length === 0}
          className={""}
        >
          {isProcessing ? "Processing..." : "Upload & Process"}
        </Button>

        <Button variant="outline" onClick={handleReset} className={""}>
          Reset
        </Button>
      </div>
    </div>
  );
};

export default Teacher;
