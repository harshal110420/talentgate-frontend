// features/HR_Slices/hrUsers/hrUserSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../api/axiosInstance";

/* ======================================================
   ✅ Fetch HR Users — for Assigned Recruiter dropdown
====================================================== */
export const fetchHRUsers = createAsyncThunk(
  "hrUsers/fetchHRUsers",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/users/hr-recruiters");
      return res.data.data; // ← backend returns { success: true, data: [...] }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch HR users",
      );
    }
  },
);

const hrUserSlice = createSlice({
  name: "hrUsers",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHRUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHRUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchHRUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default hrUserSlice.reducer;
