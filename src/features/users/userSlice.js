import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

// ✅ Thunks with pagination support
export const fetchUsers = createAsyncThunk(
  "user/fetchAll",
  async (
    {
      page = 1,
      limit = 10,
      search = "",
      roleId = "",
      departmentId = "",
      isActive = "",
    } = {},
    thunkAPI,
  ) => {
    try {
      // ✅ Build query params
      const params = new URLSearchParams();
      if (page) params.append("page", page);
      if (limit) params.append("limit", limit);
      if (search) params.append("search", search);
      if (roleId) params.append("roleId", roleId);
      if (departmentId) params.append("departmentId", departmentId);
      if (isActive !== "") params.append("isActive", isActive);

      const res = await axiosInstance.get(`/users/all?${params.toString()}`);
      return res.data; // { users: [], pagination: {} }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch users",
      );
    }
  },
);

export const createUser = createAsyncThunk(
  "user/create",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/users/create", data);
      return res.data.user;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "User creation failed",
      );
    }
  },
);

export const updateUser = createAsyncThunk(
  "user/update",
  async (formData, thunkAPI) => {
    try {
      const { id, ...updatedData } = formData;
      const res = await axiosInstance.put(`/users/update/${id}`, updatedData);
      return res.data.user;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "User update failed",
      );
    }
  },
);

export const deleteUser = createAsyncThunk(
  "user/delete",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.delete(`/users/delete/${id}`);
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "User deletion failed",
      );
    }
  },
);

export const getUserById = createAsyncThunk(
  "user/getById",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/users/get/${id}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch user",
      );
    }
  },
);

const userSlice = createSlice({
  name: "users",
  initialState: {
    userList: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalUsers: 0,
      limit: 10,
    }, // ✅ Pagination metadata
    selectedUser: null,
    loading: false,
    error: null,
    createSuccess: false,
    updateSuccess: false,
  },
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    resetUserStatus: (state) => {
      state.createSuccess = false;
      state.updateSuccess = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.userList = action.payload.users; // ✅ Backend returns { users, pagination }
        state.pagination = action.payload.pagination; // ✅ Store pagination metadata
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.createSuccess = false;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.createSuccess = true;
        state.userList.unshift(action.payload); // ✅ Add to top
        state.pagination.totalUsers += 1; // ✅ Increment count
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.createSuccess = false;
        state.error = action.payload || "Failed to create user";
      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.updateSuccess = false;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.updateSuccess = true;
        const idx = state.userList.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) {
          state.userList[idx] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.userList = state.userList.filter((u) => u.id !== action.payload);
        state.pagination.totalUsers -= 1; // ✅ Decrement count
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(getUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { clearSelectedUser, resetUserStatus } = userSlice.actions;
export default userSlice.reducer;
