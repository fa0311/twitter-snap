/* eslint-disable @next/next/no-img-element */
import React from "react";
import { StyleComponent } from "./../core/twitterSnap";

const Normal: StyleComponent = ({ data }) => {
  const icon = data.user.legacy.profileImageUrlHttps;
  const name = data.user.legacy.name;
  const id = data.user.legacy.screenName;

  const isNote = !!data.tweet.noteTweet;

  const text =
    data.tweet.noteTweet?.noteTweetResults.result.text ??
    data.tweet.legacy!.fullText;

  const lang = data.tweet.legacy!.lang;

  const indices: {
    start: number;
    end: number;
    fn: () => React.ReactElement;
  }[] = [];

  // const indices: {
  //   color: string;
  //   italic: boolean;
  //   bold: boolean;
  // }[] = [];

  if (isNote) {
    data.tweet.legacy!.entities.media?.forEach((m) =>
      indices.push({
        start: m.indices[0],
        end: m.indices[0] + 1,
        /*
        start: Array.from(text).length,
        end: Array.from(text).length + 1,
        */
        fn: () => (
          <img
            key={m.indices[0]}
            alt="img"
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "1px solid #e6e6e6",
            }}
            src={m.mediaUrlHttps}
          />
        ),
      })
    );
  } else {
    data.tweet.legacy!.entities.media?.forEach((m) =>
      indices.push({
        start: m.indices[0],
        end: m.indices[1],
        fn: () => (
          <img
            key={m.indices[0]}
            alt="img"
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "1px solid #e6e6e6",
            }}
            src={m.mediaUrlHttps}
          />
        ),
      })
    );
  }

  console.log(indices);
  // 1721006592303251551

  const textSplit = Array.from(text).map((acc, i) => {
    const link = [
      ...(data.tweet.legacy!.entities.hashtags ?? []),
      ...(data.tweet.legacy!.entities.urls ?? []),
    ].some(({ indices: [start, end] }) => start <= i && i < end);

    return {
      char: acc,
      color: link ? "#1d9bf0" : undefined,
    };
  }, [] as { char: string; color?: string }[]);

  const textFlat = textSplit.reduce((acc, cur, i) => {
    const isStart =
      indices.some(({ start }) => start === i) ||
      indices.some(({ end }) => end === i - 1);

    if (isStart || i === 0) {
      return [
        ...acc,
        {
          start: i,
          end: i + 1,
          data: [cur],
        },
      ];
    } else {
      const last = acc.pop()!;
      return [
        ...acc,
        { start: last.start, end: i + 1, data: [...last.data, cur] },
      ];
    }
  }, [] as { start: number; end: number; data: { char: string; color?: string }[] }[]);

  console.log(textFlat);

  const textElement = textFlat.map((t, i) => {
    const contains = indices.filter(
      ({ start, end }) => start <= t.start && end <= t.end
    );
    if (contains.length) {
      return contains[0].fn();
    } else {
      return (
        <p
          key={i}
          style={{
            fontSize: "17px",
            margin: "0px",
            marginTop: "12px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {t.data.map(({ char, color }, i) => (
            <span
              key={i}
              style={{
                color: color ?? undefined,
              }}
            >
              {char}
            </span>
          ))}
        </p>
      );
    }
  });

  return (
    <div
      lang={lang}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        padding: "20px",
        background:
          "linear-gradient(-45deg, #0077F2ee 0%, #1DA1F2ee 50%,#4CFFE2ee 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          background: "white",
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          padding: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
          }}
        >
          <img
            alt="icon"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              marginRight: "12px",
            }}
            src={icon}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <p
              style={{
                fontSize: "15px",
                fontWeight: "bold",
                margin: "0px",
              }}
            >
              {name}
            </p>
            <p
              style={{
                fontSize: "15px",
                margin: "0px",
                color: "#536471",
              }}
            >
              @{id}
            </p>
          </div>
        </div>
        {textElement}
      </div>
    </div>
  );
};

export default Normal;
