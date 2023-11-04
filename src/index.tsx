import React from "react";
import ReactDOM from "react-dom/client";
import Normal from "./style/normal";
import example from "./utils/example";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <div style={{ width: "100svw", height: "100vh" }}>
      <Normal {...example} />
    </div>
  </React.StrictMode>
);
