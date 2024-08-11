import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
    updateUser(state, action) {
      const updatedUser = action.payload;
    
      // Convert lastLogin to ISO string if it exists and is a Timestamp
      if (updatedUser.lastLogin && updatedUser.lastLogin.toDate) {
        updatedUser.lastLogin = updatedUser.lastLogin.toDate().toISOString();
      }
    
      if (state.user) {
        state.user = {
          ...state.user,
          ...updatedUser, // Merge the updated data with the existing user data
        };
      }
    }
  },
});

export const { setUser, clearUser,updateUser } = userSlice.actions;
export default userSlice.reducer;
