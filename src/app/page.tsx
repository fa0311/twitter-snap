"use client";
import React, { use, useEffect } from "react";
import { useState } from "react";
import Normal from "./..//style/normal";
import { TweetApiUtilsData } from "twitter-openapi-typescript";

export default function Home() {
  const toAPi = (e: string) => `/api/twitter?id=${e}`;
  const toId = (e: string) => (isNaN(Number(e)) ? e.split("/").pop()! : e);

  const [state, setState] = useState<TweetApiUtilsData | null>(null);
  const [id, setId] = useState("1518623997054918657");

  useEffect(() => {
    fetch(toAPi(toId(id)))
      .then((e) => e.json())
      .then((e) => setState(e.data));
  }, [id]);

  return (
    <>
      <input value={id} onChange={(e) => setId(e.target.value)} />
      {state && (
        <div
          style={{
            width: "600px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Normal data={state} />
        </div>
      )}
    </>
  );
}
