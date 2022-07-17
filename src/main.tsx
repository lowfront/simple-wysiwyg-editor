// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )

// const wysiwygEditor = new WysiwygEditor(document.getElementById("root")!);

import WysiwygEditor from "./WysiwygEditor";
import "./index.css";

WysiwygEditor.create(document.getElementById("root")!);
