// // src/redux/store.ts
// import { configureStore } from "@reduxjs/toolkit";
// import productsReducer from "./slices/productsSlice";

// export const store = configureStore({
//   reducer: {
//     products: productsReducer,
//   },
// });

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;


// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "./slices/productsSlice";
import sitesettingsReducer from "./slices/sitesettings"; 
import salesSliceReducer from "./slices/SalesSlice"
import gstReducer from "./slices/gstSlice";

export const store = configureStore({
  reducer: {
    products: productsReducer,
    // IMPORTANT: keep this key as `sitesettings` to match your selectors like
    // useSelector((state) => state.sitesettings)
    sitesettings: sitesettingsReducer,
    sales: salesSliceReducer,
    gst: gstReducer,
  },
  // configureStore already includes redux-thunk and devTools by default
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Optionally expose store to window for quick dev debugging (remove in production)
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.store = store;
}

