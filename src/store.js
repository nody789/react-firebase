import {configureStore} from "@reduxjs/toolkit";
import messageReducer from "./Silce/messageSlice";
import userReducer from "./Silce/userSlice"
export const store = configureStore({
    reducer:{
        message:messageReducer,
        user: userReducer,

    }
});
