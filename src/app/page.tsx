"use client";
import React from "react";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const id = "1518623997054918657";
  const toTweet = (e: string) => `https://twitter.com/elonmusk/status/${e}`;
  const toOg = (e: string) => `/og?text=${e}`;
  const toId = (e: string) => (isNaN(Number(e)) ? e.split("/").pop()! : e);

  const [text, setText] = useState<string>(toTweet(id));
  const [src, setSrc] = useState<string>(toOg(id));

  return (
    <>
      <div style={{ width: "100%", display: "flex" }}>
        <button
          onClick={() => setSrc(toOg(toId(text)))}
          style={{
            width: 100,
            borderRadius: 2,
            padding: 10,
            fontSize: 20,
            border: "1px solid #000",
            background: "black",
            color: "white",
          }}
        >
          Reload
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 600,
            margin: 30,
          }}
        >
          <Image
            src={src}
            width={100}
            height={0}
            layout="responsive"
            alt={src}
          />
        </div>
      </div>
    </>
  );
}
