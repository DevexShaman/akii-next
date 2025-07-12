import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiPost, apiGet } from "@/components/services/api";

const getInitialAuthState = () => {
  const token = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  return {
    user: null,
    tokens: {
      access: localStorage.getItem("access_token"),
    },
    username: localStorage.getItem("username"),
    isAuthenticated: !!token,
    isLoading: !!token,
    error: null,
  };
};



const initialState = {
  user: null,
  tokens: null,
  username: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};


export const loginUser = createAsyncThunk(
  "/login",
  async (credentials, { rejectWithValue }) => {
    try {
      console.log("Auth slice: Calling API login with:", credentials);
      const response = await apiPost("/login", credentials);
      console.log("Auth slice: API response:", response);
      return response;
    } catch (error) {
      console.error("Auth slice: Login error:", error);
      return rejectWithValue(
        error.response?.data?.detail || error.message || "Login failed"
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  "/register",
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiPost("/register", data);
      console.log("---- response -----", response);
      return response;
    } catch (error) {
      console.log("-------- error --------------", error);
      return rejectWithValue(
        error.response?.data || error.message || "Registration failed"
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "/logout",
  async (_, { rejectWithValue }) => {
    try {
      await apiService.apiPost("/logout");
      return undefined;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Logout failed");
    }
  }
);



export const verifyAuth = createAsyncThunk(
  "/verifyAuth",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token')
      console.log(token)

      return token?true:false;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Logout failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (state, action) => {
      state.tokens = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("access_token", action.payload.access_token);
    },
    clearAuth: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("access_token");
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem("access_token", action.payload.access_token);
        localStorage.setItem("username", action.payload.username);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        localStorage.removeItem("access_token");
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        localStorage.removeItem("access_token");
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("username");
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("username");
      });

     // Logout
    builder
      .addCase(verifyAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyAuth.fulfilled, (state,action) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload;
      })
      .addCase(verifyAuth.rejected, (state, action) => {
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setTokens, clearAuth, setUser } = authSlice.actions;

export default authSlice.reducer;
