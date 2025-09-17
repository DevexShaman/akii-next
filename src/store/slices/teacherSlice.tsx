// @ts-nocheck
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiPost } from "@/components/services/api";



interface UploadState {
  class: string | null;
  subject: string | null;
  curriculum: string | null;
  isLoading: boolean;
  error: string | null;
  ocrResults: { [fileName: string]: string };
  progress: number;
  uploadResults: {
    [fileName: string]: {
      status: string;
      message: string;
      data?: any;
      filename?: string;
      chunk_count?: number;
      namespace?: string;
      existing_id?: string;
    };
  };
  folders: string[];
  foldersLoading: boolean;
  foldersError: string | null;
  filePath: FilePathResponse | null; 
  filePathLoading: boolean; 
  filePathError: string | null; 
}

const initialState: UploadState = {
  class: null,
  subject: null,
  curriculum: null,
  isLoading: false,
  error: null,
  ocrResults: {},
  progress: 0,
  uploadResults: {},
  folders: [],
  foldersLoading: false,
  foldersError: null,

};








export const processFiles = createAsyncThunk(
  "teacher/processFiles",
  async (files: File[], { getState, rejectWithValue, dispatch }) => {
    // Accept files as argument
    try {
      const state = getState() as { teacher: UploadState };
      const { class: className, subject, curriculum } = state.teacher;
      let username = "";
      if (typeof window !== "undefined") {
        username = localStorage.getItem("username") || "";
      }

      const results: { [fileName: string]: string } = {};
      const uploadResults: UploadState["uploadResults"] = {};

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();

        formData.append("file", file);
        formData.append("student_class", className || "");
        formData.append("subject", subject || "");
        formData.append("curriculum", curriculum || "");
        formData.append("username", username);

        const progress = Math.floor(((i + 1) / files.length) * 100);
        dispatch(setProgress(progress));

        const controller = new AbortController();
        const timeout = 300000; // 5 minutes timeout
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await apiPost("/upload/", formData, {
            timeout: 600000, // 10 minutes
          });

          results[file.name] = response.data?.extracted_text || "No text";
          uploadResults[file.name] = {
            status: response.status || "unknown",
            message: response.message || "No message",
            data: response.namespace,
          };
        } catch (error: any) {

          if (error.status === 504) {
            results[file.name] = "Processing in background due to timeout";
            uploadResults[file.name] = {
              status: "success",
              message: "File uploaded successfully and is being processed.",
            };
          } else {
            throw error;
          }
        } finally {
          const progress = Math.floor(((i + 1) / files.length) * 100);
          dispatch(setProgress(progress));
        }
      }

      return { results, uploadResults };
    } catch (error: unknown) {
      console.error("Upload error:", error);
      let errorMessage = "Processing failed";
      if (error.response) {
        errorMessage =
          error.response.data?.detail ||
          error.response.statusText ||
          `Server error: ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);












export const getFilePath = createAsyncThunk(
  "teacher/getFilePath",
  async (
    { username, filename }: { username: string; filename: string },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("filename", filename);

      const response = await apiPost("/get-file-path/", formData);
      return response;
    } catch (error: unknown) {
      console.error("Get file path error:", error);
      let errorMessage = "Failed to get file path";
      if (error.response) {
        errorMessage =
          error.response.data?.detail ||
          error.response.statusText ||
          `Server error: ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);































export const listFolders = createAsyncThunk(
  "teacher/listFolders",
  async (_, { rejectWithValue }) => {
    try {
      let username = localStorage.getItem("username");
      if (typeof window !== "undefined") {
        username = localStorage.getItem("username");
      }

      const formData = new FormData();
      formData.append("username", username);

      const response = await apiPost(`/list-folders/`, formData);

      return response.folders || [];
    } catch (error: unknown) {
      console.error("List folders error:", error);
      let errorMessage = "Failed to fetch folders";
      if (error.response) {
        errorMessage =
          error.response.data?.detail ||
          error.response.statusText ||
          `Server error: ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);





















const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {
    setClass: (state, action: PayloadAction<string>) => {
      state.class = action.payload;
    },
    setSubject: (state, action: PayloadAction<string>) => {
      state.subject = action.payload;
    },
    setCurriculum: (state, action: PayloadAction<string>) => {
      state.curriculum = action.payload;
    },
    resetUpload: () => initialState,
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    clearUploadResults: (state) => {
      state.uploadResults = {};
    },

    setFolders: (state, action: PayloadAction<string[]>) => {
      state.folders = action.payload;
       console.log("payload", action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(processFiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.progress = 0;
        state.uploadResults = {};
      })
      .addCase(processFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ocrResults = action.payload.results;
        state.uploadResults = action.payload.uploadResults;
        state.progress = 100;
      })
      .addCase(processFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.progress = 0;
      })
  
      .addCase(listFolders.pending, (state) => {
        state.foldersLoading = true;
        state.foldersError = null;
      })
    .addCase(listFolders.fulfilled, (state, action) => {
      state.foldersLoading = false;
      state.folders = action.payload;
      })
    .addCase(listFolders.rejected, (state, action) => {
      state.foldersLoading = false;
      state.foldersError = action.payload as string;
    })

    .addCase(getFilePath.pending, (state) => {
        state.filePathLoading = true;
        state.filePathError = null;
        state.filePath = null;
      })
      .addCase(getFilePath.fulfilled, (state, action) => {
        state.filePathLoading = false;
        state.filePath = action.payload;
        console.log("-------------------",action.payload)
      })
      .addCase(getFilePath.rejected, (state, action) => {
        state.filePathLoading = false;
        state.filePathError = action.payload as string;
        state.filePath = null;
      });
},
  
});

export const {
  setClass,
  setSubject,
  setCurriculum,
  resetUpload,
  setProgress,
  clearUploadResults,
  setFolders,
   setFilePath,   
  clearFilePath,
} = teacherSlice.actions;

export default teacherSlice.reducer;

