/* eslint-disable @next/next/no-img-element */
import React from "react";
import { StyleComponent } from "./../core/twitterSnap";
import { NoteTweetResultRichTextTagRichtextTypesEnum as RichtextTypesEnum } from "twitter-openapi-typescript-generated";
import split from "graphemesplit";

const TweetConverter: StyleComponent = ({ data }) => {
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

  const inlineMedia = note?.media?.inlineMedia ?? [];
  const media = entities.media ?? [];
  const richtextTags = note?.richtext?.richtextTags ?? [];

  const normalizeMap: {
    array: number;
    str: number;
  }[] = [{ array: 0, str: 0 }];

  const trueSplit = split(text).map((char, index) => ({ char, index }));

  trueSplit.forEach(({ char }) => {
    const last = normalizeMap[normalizeMap.length - 1];
    normalizeMap.push({
      array: Array.from(char).length + last.array,
      str: char.length + last.str,
    });
  });

  const normalizeRichtextTags = richtextTags.map(
    ({ fromIndex, toIndex, richtextTypes }) => ({
      start: normalizeMap.findIndex(({ str }) => str === fromIndex),
      end: normalizeMap.findIndex(({ str }) => str === toIndex),
      type: richtextTypes,
    })
  );

  const normalizeInlineMedia = inlineMedia.map(({ index, mediaId }) => ({
    index: normalizeMap.findIndex(({ str }) => str === index),
    mediaId,
  }));

  const normalizeHashtags = entities.hashtags.map(({ indices, tag }) => ({
    start: normalizeMap.findIndex(({ array }) => array === indices[0]),
    end: normalizeMap.findIndex(({ array }) => array === indices[1]),
    tag,
  }));

  const normalizeMedia = entities.media.map(
    ({ indices, idStr, mediaUrlHttps }) => ({
      start: normalizeMap.findIndex(({ array }) => array === indices[0]),
      end: normalizeMap.findIndex(({ array }) => array === indices[1]),
      idStr,
      mediaUrlHttps,
    })
  );

  const normalizeUrls = entities.urls.map(({ indices, displayUrl }) => ({
    start: normalizeMap.findIndex(({ array }) => array === indices[0]),
    end: normalizeMap.findIndex(({ array }) => array === indices[1]),
    displayUrl,
  }));

  const normalizeUserMentions = entities.userMentions.map(
    ({ indices, screenName }) => ({
      start: normalizeMap.findIndex(({ array }) => array === indices[0]),
      end: normalizeMap.findIndex(({ array }) => array === indices[1]),
      screenName,
    })
  );

  const charIndices: {
    start: number;
    end: number;
    chars: string[];
  }[] = [];

  const insert: {
    index: number;
    fn: () => React.ReactElement;
  }[] = [];

  normalizeMedia.forEach((m) => {
    const find = normalizeInlineMedia.find(
      ({ mediaId }) => mediaId === m.idStr
    );
    if (find) {
      insert.push({
        index: find.index,
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
      charIndices.push({
        start: m.start,
        end: m.end,
        chars: [],
      });

      insert.push({
        index: m.start,
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
  normalizeUrls.forEach(({ start, end, displayUrl }) => {
    charIndices.push({
      start: start,
      end: end,
      chars: split(displayUrl),
    });
  });

  const replacedSplit: typeof trueSplit = [];
  trueSplit.forEach(({ char, index }) => {
    const ignore = charIndices.some(
      ({ start, end }) => start <= index && index < end
    );
    if (ignore) {
      const start = charIndices.find(({ start }) => start === index);
      start?.chars.forEach((c) => replacedSplit.push({ char: c, index }));
    } else {
      replacedSplit.push({ char, index });
    }
  });

  const charDataList = replacedSplit.map(({ char, index }) => {
    const link = [...normalizeHashtags, ...normalizeUrls].some(
      ({ start, end }) => start <= index && index < end
    );
    const bold = normalizeRichtextTags.some(
      ({ start, end, type }) =>
        start <= index && index < end && type.includes(RichtextTypesEnum.Bold)
    );
    const italic = normalizeRichtextTags.some(
      ({ start, end, type }) =>
        start <= index && index < end && type.includes(RichtextTypesEnum.Italic)
    );

    return {
      char: char,
      index: index,
      properties: {
        ...(link ? { color: "#1d9bf0" } : {}),
        ...(bold ? { fontWeight: "bold" } : {}),
        ...(italic ? { italic: "italic" } : {}),
      },
    };
  }, [] as { char: string; properties: React.CSSProperties }[]);

  const textDataList: {
    start: number;
    end: number;
    data: { char: string; properties: React.CSSProperties }[];
  }[] = [];

  charDataList.forEach((data) => {
    const index = data.index;
    const split = insert.some((i) => i.index === index);

    if (split || index === 0) {
      textDataList.push({
        start: index,
        end: index + 1,
        data: [data],
      });
    } else {
      const last = textDataList.pop()!;
      textDataList.push({
        start: last.start,
        end: index,
        data: [...last.data, data],
      });
    }
  });

  const textElement: React.ReactElement[] = [];

  textDataList.forEach((t, i) => {
    textElement.push(
      <p
        key={i}
        style={{
          fontSize: "17px",
          margin: "0px",
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {t.data.map(({ char, properties }, i) => (
          <span
            key={i}
            style={{
              ...properties,
              ...(char == "\n" ? { width: "100%" } : {}),
              ...(char == " " ? { width: "0.25em" } : {}),
              ...(char == "\n" && t.data[i - 1]?.char == "\n"
                ? { height: "1em" }
                : {}),
            }}
          >
            {char}
          </span>
        ))}
      </p>
    );

    insert
      .filter(({ index }) => index - 1 === t.end)
      .forEach(({ fn }) => textElement.push(fn()));
  });
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "12px",
      }}
    >
      {textElement}
    </div>
  );
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
        <TweetConverter data={data} />
      </div>
    </div>
  );
};

export default Normal;
