/* eslint-disable @next/next/no-img-element */
import React from "react";
import { StyleComponent } from "./../core/twitterSnap";
import { NoteTweetResultRichTextTagRichtextTypesEnum as RichtextTypesEnum } from "twitter-openapi-typescript-generated";

const TweetConverter: StyleComponent = ({ data }) => {
  const isNote = !!data.tweet.noteTweet;

  const note = data.tweet.noteTweet?.noteTweetResults.result;
  const legacy = data.tweet.legacy!;

  const text = note?.text ?? legacy.fullText;

  const entitySet = note?.entitySet;
  const legacySet = data.tweet.legacy!.entities;

  const entities = {
    hashtags: [...(entitySet?.hashtags ?? []), ...(legacySet?.hashtags ?? [])],
    media: [...(entitySet?.media ?? []), ...(legacySet?.media ?? [])],
    urls: [...(entitySet?.urls ?? []), ...(legacySet?.urls ?? [])],
    userMentions: [
      ...(entitySet?.userMentions ?? []),
      ...(legacySet?.userMentions ?? []),
    ],
  };

  const inline = note?.media?.inlineMedia ?? [];
  const media = entities.media ?? [];

  const lengthConvert = (length: number) => {
    return Array.from(text.slice(0, length)).length;
  };

  const ConvertedRichtextTags = note?.richtext?.richtextTags.map(
    ({ fromIndex, toIndex, richtextTypes }) => ({
      start: lengthConvert(fromIndex),
      end: lengthConvert(toIndex),
      type: richtextTypes,
    })
  );

  const indices: {
    start: number;
    end: number;
    fn: () => React.ReactElement;
  }[] = [];

  const insert: {
    index: number;
    fn: () => React.ReactElement;
  }[] = [];

  media.forEach((m) => {
    const find = inline.find(({ mediaId }) => mediaId === m.idStr);
    if (isNote) {
      insert.push({
        index: lengthConvert(find!.index),
        fn: () => (
          <img
            key={m.idStr}
            alt="img"
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "1px solid #e6e6e6",
            }}
            src={m.mediaUrlHttps}
          />
        ),
      });
    } else {
      indices.push({
        start: m.indices[0],
        end: m.indices[1],
        fn: () => (
          <img
            key={m.idStr}
            alt="img"
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "1px solid #e6e6e6",
            }}
            src={m.mediaUrlHttps}
          />
        ),
      });
    }
  });

  const charDataList = Array.from(text).map((acc, i) => {
    const link = [...(entities.hashtags ?? []), ...(entities.urls ?? [])].some(
      ({ indices: [start, end] }) => start <= i && i < end
    );
    const bold = ConvertedRichtextTags?.some(
      ({ start, end, type }) =>
        start <= i && i < end && type.includes(RichtextTypesEnum.Bold)
    );
    const italic = ConvertedRichtextTags?.some(
      ({ start, end, type }) =>
        start <= i && i < end && type.includes(RichtextTypesEnum.Italic)
    );

    return {
      char: acc,
      properties: {
        color: link ? "#1d9bf0" : undefined,
        fontWeight: bold ? "bold" : undefined,
        fontStyle: italic ? "italic" : undefined,
      },
    };
  }, [] as { char: string; properties: React.CSSProperties }[]);

  const textDataList: {
    start: number;
    end: number;
    data: { char: string; properties: React.CSSProperties }[];
  }[] = [];

  charDataList.forEach((char, i) => {
    const isStart =
      indices.some(({ start }) => start === i) ||
      indices.some(({ end }) => end === i - 1) ||
      insert.some(({ index }) => index === i);

    if (isStart || i === 0) {
      textDataList.push({
        start: i,
        end: i + 1,
        data: [char],
      });
    } else {
      const last = textDataList.pop()!;
      textDataList.push({
        start: last.start,
        end: i,
        data: [...last.data, char],
      });
    }
  });

  const textElement: React.ReactElement[] = [];

  textDataList.forEach((t, i) => {
    const contains = indices.filter(
      ({ start, end }) => start <= t.start && t.end < end
    );

    if (contains.length) {
      contains.forEach(({ fn }) => textElement.push(fn()));
    } else {
      textElement.push(
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
          {t.data.map(({ char, properties }, i) => (
            <span key={i} style={properties}>
              {char}
            </span>
          ))}
        </p>
      );
    }
    insert
      .filter(({ index }) => index - 1 === t.end)
      .forEach(({ fn }) => textElement.push(fn()));
  });
  return <>{textElement}</>;
};

const Normal: StyleComponent = ({ data }) => {
  const icon = data.user.legacy.profileImageUrlHttps;
  const name = data.user.legacy.name;
  const id = data.user.legacy.screenName;

  const lang = data.tweet.legacy!.lang;

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
        {TweetConverter({ data })}
      </div>
    </div>
  );
};

export default Normal;
