import React, { useEffect } from "react";
import { useState } from "react";
import ReactDOM from "react-dom/client";
import Normal from "./style/normal";
import example from "./utils/example";
import { TweetApiUtilsData } from "twitter-openapi-typescript";

const App = () => {
  const [state, setState] = useState<TweetApiUtilsData>();

  useEffect(() => {
    example().then(setState);
  }, []);

  return (
    <div style={{ width: "600px" }}>
      {state && (
        <>
          <Normal data={state} />
          <Normal data={state} />
        </>
      )}
    </div>
  );
};
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
