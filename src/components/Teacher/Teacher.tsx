
"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch, useAppSelector } from "@/store/index";
import { useRouter } from "next/navigation";
import {
  setClass,
  setSubject,
  setCurriculum,
  resetUpload,
  clearUploadResults,
  listFolders,
  setFilePath,
  clearFilePath,
  getFilePath,
} from "@/store/slices/teacherSlice";
import Button from "@/components/UI/Button";
import Progress from "@/components/UI/Progress";
import { toast } from "react-hot-toast";
import {
  FileText,
  X,
  UploadCloud,
  ChevronDown,
  BookOpen,
  Bookmark,
  GraduationCap,
  LayoutGrid,
  CheckCircle,
  AlertCircle,
  XCircle, ChevronUp, Folder
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { button } from "framer-motion/client";


const Teacher = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();


  const [selectedFileFromHistory, setSelectedFileFromHistory] = useState<File | null>(null);
  const [isFileFromHistory, setIsFileFromHistory] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);


  const [selectedFileNameFromHistory, setSelectedFileNameFromHistory] = useState<string | null>(null);
  const [selectedFileInfo, setSelectedFileInfo] = useState<FilePathResponse | null>(null);
  const [fileInfoLoading, setFileInfoLoading] = useState<string | null>(null);




  const handleDeleteFile = async (folderName: string) => {
    setDeleteLoading(folderName);
    setDeleteError(null);

    try {
      const username = localStorage.getItem("username") || "unknown_user";
      const formData = new FormData();
      formData.append("username", username);
      formData.append("folder_name", folderName);

      const response = await fetch("https://llm.edusmartai.com/api/delete-folder/", {
        method: "DELETE",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete file");
      }

      const result = await response.json();

      // Show success message
      toast.success(`"${folderName}" deleted successfully`);

      // Refresh the folders list
      dispatch(listFolders());


    } catch (error) {
      console.error("Delete error:", error);
      setDeleteError(error.message);
      toast.error(`Failed to delete "${folderName}": ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };
  const handleSelectFileFromHistory = async (fileName: string) => {
    setFileInfoLoading(fileName);
    setSelectedFileInfo(null);

    try {
      const username = localStorage.getItem("username") || "";

      // Dispatch the getFilePath action
      const resultAction = await dispatch(getFilePath({ username, filename: fileName }));

      if (getFilePath.fulfilled.match(resultAction)) {
        const fileInfo = resultAction.payload;
        setSelectedFileInfo(fileInfo);

        // Update Redux state with the file's class, subject, and curriculum
        if (fileInfo.student_class) {
          dispatch(setClass(fileInfo.student_class));
        }
        if (fileInfo.subject) {
          dispatch(setSubject(fileInfo.subject));
        }
        if (fileInfo.curriculum) {
          dispatch(setCurriculum(fileInfo.curriculum));
        }

        // Create a mock file object for the selected file
        const mockFile = new File([], fileName, {
          type: getFileTypeFromName(fileName),
          lastModified: Date.now(),
        });

        setSelectedFileFromHistory(mockFile);
        setLocalFiles([mockFile]);
        setSelectedFileNameFromHistory(fileName);
        setIsFileFromHistory(true);

        toast.success(`"${fileName}" selected from previous files`);
      } else {
        throw new Error("Failed to get file information");
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      toast.error(`Failed to load file information: ${error.message}`);
    } finally {
      setFileInfoLoading(null);
    }
  };

  // Helper function to determine file type
  const getFileTypeFromName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'ppt' || ext === 'pptx') return 'application/vnd.ms-powerpoint';
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return 'image/*';
    return 'application/octet-stream';
  };



  const {
    class: className,
    subject,
    curriculum,
    isLoading,
    error,
    progress,
    uploadResults,
    folders,
    foldersLoading,
    foldersError
  } = useSelector((state: RootState) => state.teacher);
  const [visibleFiles, setVisibleFiles] = useState(3);

  useEffect(() => {
    dispatch(listFolders());
  }, [dispatch]);





  const teacher = useAppSelector(state => state.teacher)

  const selectedClass = teacher.class
  const selectedSubject = teacher.subject;
  const selectedCurriculum = teacher.curriculum;
  const [localFiles, setLocalFiles] = useState<File[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
   const [Isright, setIsright] = useState(false);
  const [tisProcessing, setTIsProcessing] = useState(false);
  const [errors, setErrors] = useState({
    class: false,
    subject: false,
    curriculum: false,
    files: false,
  });

  // Progress update
  // const [progressData, setProgressData] = useState(null);
  const progressData = useRef(null)
  useEffect(() => {
    if (selectedClass) dispatch(setClass(selectedClass));
    if (selectedSubject) dispatch(setSubject(selectedSubject));
    if (selectedCurriculum) dispatch(setCurriculum(selectedCurriculum));
  }, [selectedClass, selectedSubject, selectedCurriculum, dispatch]);


  const [fileErrors, setFileErrors] = useState<
    { fileName: string; error: string }[]
  >([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setIsFileFromHistory(false); // Mark as new upload

      // Check if file already exists in folders
      const fileName = acceptedFiles[0]?.name;
      const fileExists = folders.includes(fileName);

      if (fileExists) {
        toast.error(`"${fileName}" already exists in your Previous Files`);

        setLocalFiles([]);
        setFileErrors([]);
        return;
      }

      setLocalFiles(acceptedFiles.slice(0, 1));
      const newFileErrors = fileRejections.map((rejection) => ({
        fileName: rejection.file.name,
        error: rejection.errors[0].message,
      }));
      setFileErrors(newFileErrors);
    },
    [folders]
  );


  const handleRemoveFile = () => {
    setLocalFiles([]);
    setFileErrors([]);
    setIsFileFromHistory(false); // Reset the flag
    // Also reset selected file name if you have this state
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg"],
      "application/pdf": [".pdf"],
      "application/vnd.ms-powerpoint": [".ppt", ".pptx"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const validateForm = () => {
    const newErrors = {
      class: !className,
      subject: !subject,
      curriculum: !curriculum,
      files: localFiles.length === 0,
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    if (!className || !subject || !curriculum) {
      alert("Please select class, subject, and curriculum");
      return;
    }

    if (localFiles.length === 0) {
      alert("Please upload a file");
      return;
    }

    let socket = null;
    let connectionId = null;
    let keepAliveInterval = null;
    const RECONNECT_LIMIT = 1;
    let reconnectAttempts = 0;

    const connectWebSocket = () => {
      connectionId = crypto.randomUUID();

      socket = new WebSocket(`wss://llm.edusmartai.com/api/ws/upload-progress/${connectionId}`);

      socket.onopen = () => {
        console.log("✅ WebSocket connected", connectionId);

        // Send ping every 25 seconds to keep alive
        keepAliveInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
            console.log("📨 Ping sent to keep connection alive");
          }
        }, 2500);
      };

      socket.onmessage = (event) => {
        try {
          setIsProcessing(true);
          const progressDataRes = JSON.parse(event.data);
          console.log("📩 Progress update:", progressDataRes);


          // You can dispatch this progress update to Redux here
          // dispatch(setUploadProgress(progressData.progress));

          if (progressDataRes.status === "success ") {
            console.log("✅ Vector storage completed, closing WebSocket");
            setIsProcessing(false);
            
            progressData.current = progressData

            console.log("📩 Progress update2222222222222222:", progressData);
            // clearInterval(keepAliveInterval);
            socket.close();
          }
        } catch (error) {
          console.error("Error parsing progress data:", error);
        }
      };

      socket.onerror = (err) => {
        console.error("⚠️ WebSocket error:", err);
        setIsProcessing(true);
      };

      socket.onclose = () => {
        setIsProcessing(false);
        setTIsProcessing(true);
        setIsright(true);
        console.log("❌ WebSocket closed");
        console.log("Progress Data", progressData)
        if (!progressData) {
          clearInterval(keepAliveInterval);
          // setIsProcessing(false);
          // Attempt reconnection if attempts left
          if (reconnectAttempts < RECONNECT_LIMIT) {
            reconnectAttempts++;
            // setIsProcessing(true);
            console.log(`🔄 Reconnecting... attempt ${reconnectAttempts}`);
            setTimeout(connectWebSocket, 3000); // Retry after 3 seconds
          } else {
            console.error("❌ Max reconnection attempts reached");
          }
        };
      }

    };

    try {
      setIsProcessing(true);
      reconnectAttempts = 0;
      connectWebSocket();

      // Wait briefly to ensure connection is open (optional but good practice)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const username = localStorage.getItem("username") || "unknown_user";

      const formData = new FormData();
      formData.append("file", localFiles[0]);
      formData.append("student_class", className);
      formData.append("subject", subject);
      formData.append("curriculum", curriculum);
      formData.append("username", username);
      formData.append("connection_id", connectionId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const uploadResponse = await fetch("https://llm.edusmartai.com/api/upload/", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          'X-Connection-Id': connectionId,
          'X-Timeout': '120000'
        }
      });

      clearTimeout(timeoutId);


      setIsProcessing(true);



      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
        setIsProcessing(true);
      }

      const uploadData = await uploadResponse.json();
      console.log("✅ Upload response:", uploadData);
      if (uploadData.status === "success") {
        setIsProcessing(false);
      }



    } catch (error) {
      console.error("❌ Upload error:", error);
      setIsProcessing(true);

      if (error.name === 'AbortError') {

        console.warn("⚠️ Upload timeout - connection is kept alive for possible retry");
      } else {

        console.error("⚠️ An error occurred:", error.message);
      }
    } finally {
      setIsProcessing(true);

      // Do not forcibly close socket here; let server or completion handle it
    }
  };

  console.log("------------------------------", isProcessing)




  const handleReset = () => {
    setLocalFiles([]);
    dispatch(resetUpload());
    dispatch(clearUploadResults());
  };




  const handleChat = () => {
    const fileNames = localFiles.map(file => file.name);
    const params = new URLSearchParams({
      class: selectedClass,
      subject: selectedSubject,
      curriculum: selectedCurriculum,
      files: fileNames[0],
    });



    // Navigate to chat
    router.push(`/chat?${params.toString()}`);

    // Reset local state
    setLocalFiles([]);
    setFileErrors([]);
    setErrors({
      class: false,
      subject: false,
      curriculum: false,
      files: false,
    });
    setIsProcessing(false);

    // Reset Redux state
    dispatch(resetUpload());
    dispatch(clearUploadResults());
    dispatch(setClass(""));
    dispatch(setSubject(""));
    dispatch(setCurriculum(""));
  };

  const classOptions = [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
  ];
  const subjectOptions = ["Math", "Science", "History", "English", "Art"];
  const curriculumOptions = ["CBSE", "ICSE", "TNSB", "PSNB", "IGCSE"];

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <BookOpen className="text-red-500" />;
    if (["ppt", "pptx"].includes(ext || ""))
      return <LayoutGrid className="text-orange-500" />;
    if (["jpg", "jpeg", "png"].includes(ext || ""))
      return <Bookmark className="text-green-500" />;
    return <FileText className="text-blue-500" />;
  };

  const isChatDisabled =
    !selectedClass ||
    !selectedSubject ||
    !selectedCurriculum ||
    localFiles.length === 0 ||
    Object.keys(uploadResults).length === 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-[18px] sm:text-lg md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2 md:mb-3">
          Teaching Material Upload
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto px-2">
          Upload your teaching materials to extract text content using Google
          Vision OCR. Supported formats: PDF, PPT, JPG, PNG (max 10MB each)
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 border sm:mb-8 border-gray-100"
      >
        <div className="flex items-center mb-3 sm:mb-4">
          <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 mr-2" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            Course Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              label: "Class",
              value: className,
              error: errors.class,
              icon: "📚",
              options: classOptions,
              action: setClass,
              errorKey: "class",
            },
            {
              label: "Subject",
              value: subject,
              error: errors.subject,
              icon: "🧪",
              options: subjectOptions,
              action: setSubject,
              errorKey: "subject",
            },
            {
              label: "Curriculum",
              value: curriculum,
              error: errors.curriculum,
              icon: "🌐",
              options: curriculumOptions,
              action: setCurriculum,
              errorKey: "curriculum",
            },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-gray-700">
                {field.label}{" "}
                {field.error && <span className="text-red-600">*</span>}
              </label>
              <div className="relative">
                <select
                  value={field.value || ""}
                  onChange={(e) => {
                    dispatch(field.action(e.target.value));
                    if (errors[field.errorKey as keyof typeof errors])
                      setErrors({ ...errors, [field.errorKey]: false });
                  }}
                  className={`w-full text-black pl-8 pr-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border ${field.error ? "border-red-500" : "border-gray-200"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none`}
                >
                  <option value="">Select {field.label}</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="text-gray-400">{field.icon}</span>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              {field.error && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">
                  Please select a {field.label.toLowerCase()}
                </p>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mb-6 sm:mb-8"
      >
        <div
          {...getRootProps()}
          className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center cursor-pointer transition-all duration-300
           ${isDragActive
              ? "border-2 border-dashed border-blue-500 bg-blue-50 shadow-lg"
              : `border-2 border-dashed ${errors.files ? "border-red-500" : "border-gray-300"
              } hover:border-blue-400 bg-white hover:bg-blue-50 shadow-sm`
            }`}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={{ scale: isDragActive ? 1.05 : 1 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative mb-3 sm:mb-4 ">
              <div
                className="absolute inset-0 bg-blue-100 rounded-full opacity-70 animate-ping"
                style={{ animationDuration: "1.5s" }}
              ></div>
              <UploadCloud className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-blue-500 relative z-10" />
            </div>
            <p className="text-base sm:text-lg font-medium text-gray-700">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-gray-500 text-sm sm:text-base mt-1">
              or <span className="text-blue-600 font-medium">browse files</span>
              from your device
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-3">
              Supports PDF, PPT, JPG, PNG (max 10MB, single file)
            </p>
          </motion.div>
        </div>
      </motion.div>




      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Folder className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Previous Files</h2>
              <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                {folders.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnimatePresence>
              {folders.slice(0, visibleFiles).map((folder, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer relative"
                >
                  <div
                    className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-gray-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-md"
                    onClick={() => handleSelectFileFromHistory(folder)}
                  >
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the card click
                        handleDeleteFile(folder);
                      }}
                      disabled={deleteLoading === folder}
                      className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full   "
                      title="Delete file"
                    >
                      {deleteLoading === folder ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex items-center justify-center mb-3">
                      <div className="relative">
                        <Folder className="h-10 w-10 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                        <div className="absolute inset-0 bg-indigo-100 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <h3 className="font-medium text-gray-800 text-sm truncate group-hover:text-indigo-800 transition-colors">
                        {folder}
                      </h3>
                    </div>

                    {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-5 rounded-lg transition-opacity"></div> */}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {folders.length > 3 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setVisibleFiles(visibleFiles === 3 ? folders.length : 3)}
                className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                {visibleFiles === 3 ? (
                  <>
                    Show More Files
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show Less
                    <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {fileErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 sm:mb-4 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4"
        >
          <h3 className="font-medium text-red-800 text-sm sm:text-base mb-1 sm:mb-2">
            File Upload Errors
          </h3>
          <ul className="space-y-1">
            {fileErrors.map((error, index) => (
              <li key={index} className="text-xs sm:text-sm text-red-700 flex">
                <span className="font-medium mr-1">{error.fileName}:</span>
                <span>{error.error}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <AnimatePresence>
        {localFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Selected File
              </h2>
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                {localFiles.length}
              </span>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {localFiles.map((file) => {
                const fileError = fileErrors.find(
                  (e) => e.fileName === file.name
                );
                return (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`flex items-center justify-between p-4 bg-white rounded-lg border ${fileError ? "border-red-200 bg-red-50" : "border-gray-100"
                      } shadow-sm hover:shadow transition-shadow`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="p-2 bg-blue-50 rounded-lg  mr-2 sm:mr-3">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-black font-medium truncate text-sm sm:text-base">
                          {file.name}
                        </p>
                        <p className="text-gray-500 text-xs sm:text-sm">
                          {(file.size / 1024 / 1024).toFixed(2)}MB
                        </p>
                        {fileError && (
                          <p className="text-red-500 text-xs mt-1">
                            {fileError.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center mb-3 sm:mb-4">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-blue-500 mr-2 sm:mr-3"></div>
            <h3 className="text-lg font-medium text-gray-800">
              Processing files with Google Vision OCR
            </h3>
          </div>
          <Progress
            value={progress}
            className="h-2.5 rounded-full bg-gray-200"
            indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-600"
          />
          <p className="mt-2 text-right text-sm text-gray-500">{progress}%</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start"
        >
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error Processing Files
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {Object.keys(uploadResults).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">
                Upload Results
              </h2>
            </div>

            <div className="p-6 bg-gray-50">
              <div className="space-y-4">
                {Object.entries(uploadResults).map(([fileName, result]) => (
                  <div
                    key={fileName}
                    className={`p-4 rounded-lg border ${result.status === "success"
                      ? "bg-green-50 border-green-200"
                      : result.status === "duplicate"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-red-50 border-red-200"
                      }`}
                  >
                    <div className="flex items-start">
                      {result.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      ) : result.status === "duplicate" ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-gray-800">
                            {fileName}
                            {/* {progressData.message} */}
                          </h3>
                          <span
                            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${result.status === "success"
                              ? "bg-green-100 text-green-800"
                              : result.status === "duplicate"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                              }`}
                          >
                            {result.status}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-700">{result.message}</p>

                        {result.status === "duplicate" &&
                          result.existing_id && (
                            <div className="mt-2 text-sm">
                              <p className="text-gray-600">
                                Existing ID:
                                <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                                  {result.existing_id}
                                </code>
                              </p>
                            </div>
                          )}

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4 justify-center pt-4 mob-block">
        {isFileFromHistory ? (
          <button className="cursor-not-allowed opacity-70 px-8 py-3 text-base rounded-sm text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-blue-300 transition-all "
          >Upload & Process</button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || localFiles.length === 0}
            className=" px-8 py-3 text-base rounded-sm text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-blue-300 transition-all disabled:opacity-70"
          >
            {isProcessing ? (
              <span className="flex items-center ">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Upload & Process"
            )}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={handleReset}
          className="cursor-pointer px-8 py-3 text-base text-black font-medium border-gray-300 hover:bg-gray-50"
        >
          Reset
        </Button>

        <div className="relative group inline-block">



          {/* {Isright ? (<h1>true</h1>): (<h1>false</h1>)} */}

          {
            tisProcessing ? (
              <Button
                variant="outline"
                onClick={handleChat}
                // disabled={isChatDisabled}

                className="px-8 py-3 text-base rounded-md text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700">
                Chat with us
              </Button>
            ) : (
              <div>

                {isFileFromHistory && selectedFileNameFromHistory ? (
                  <Button
                    variant="outline"
                    onClick={handleChat}
                    // disabled={isChatDisabled}

                    className="px-8 py-3 text-base rounded-md text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 "
                  >
                    Chat with us
                  </Button>
                ) : (<Button
                  variant="outline"
                 

                  className="px-8 cursor-not-allowed py-3 text-base rounded-md text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 "
                >
                  Chat with us
                </Button>)}
              </div>
            )
          }


          {/* {isFileFromHistory && selectedFileNameFromHistory ? (
            <Button
              variant="outline"
              onClick={handleChat}
              // disabled={isChatDisabled}

              className="px-8 py-3 text-base rounded-md text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 "
            >
              Chat with usa
            </Button>
          ) : (<Button
            variant="outline"
            onClick={handleChat}
            // disabled={isChatDisabled}

            className="px-8 py-3 text-base rounded-md text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 "
          >
            Chat with usz
          </Button>)} */}



          {/* Tooltip only shows if disabled */}
          {isChatDisabled && (
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-10 
                   hidden group-hover:block 
                   bg-black text-white text-sm px-3 py-1 rounded-md shadow-lg whitespace-nowrap"
            >
              Please add information and complete the upload process first, then you will be able to chat with us.
            </div>
          )}
        </div>








      </div>
    </div>
  );
};

export default Teacher;
