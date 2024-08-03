import {configureStore} from "@reduxjs/toolkit";
import messageReducer from "./Silce/messageSlice";
export const store = configureStore({
    reducer:{
        message:messageReducer,
    }
});
