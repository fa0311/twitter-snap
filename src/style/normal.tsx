import { StyleComponent } from "./../core/twitterSnap";

const Normal: StyleComponent = ({ data }) => {
  const icon = data.user.legacy.profileImageUrlHttps;
  const name = data.user.legacy.name;
  const id = data.user.legacy.screenName;
  const text = data.tweet.legacy!.fullText;

  const indices: {
    start: number;
    end: number;
    span: boolean;
    fn: (text: string) => React.ReactElement;
  }[] = [];

  data.tweet.legacy!.entities.media?.forEach((m) =>
    indices.push({
      start: m.indices[0],
      end: m.indices[1],
      span: false,
      fn: (text) => (
        <img
          key={m.indices[0]}
          alt="img"
          style={{
            width: "100%",
            borderRadius: "10px",
          }}
          src={m.mediaUrlHttps}
        />
      ),
    })
  );

  [
    ...(data.tweet.legacy!.entities.hashtags ?? []),
    ...(data.tweet.legacy!.entities.urls ?? []),
  ].forEach((m) =>
    indices.push({
      start: m.indices[0],
      end: m.indices[1],
      span: true,
      fn: (text) => (
        <span
          key={m.indices[0]}
          style={{
            color: "#1d9bf0",
          }}
        >
          {text}
        </span>
      ),
    })
  );

  const textSplit = Array.from(text).reduce((acc, cur, i) => {
    const isStart = indices.some(({ start }) => start === i);
    const isEnd = indices.some(({ end }) => end === i);
    if (isStart) {
      const indice = indices.find(({ start }) => start === i)!;
      acc.push({ text: "", span: indice.span, fn: indice.fn });
    }
    if (isEnd || (i === 0 && !isStart)) {
      acc.push({
        text: cur,
        span: true,
        fn: (text) => <span key={i}>{text}</span>,
      });
    }
    const last = acc.pop()!;
    last.text += cur;
    return [...acc, last];
  }, [] as { text: string; span: boolean; fn: (text: string) => React.ReactElement }[]);

  const textFlat = textSplit.reduce((acc, cur, i) => {
    const prev = textSplit[i - 1]?.span ?? false;
    if (cur.span || i === 0) {
      if (prev) {
        const last = acc.pop()!;
        return [...acc, [...last, cur]];
      } else {
        return [...acc, [cur]];
      }
    } else {
      return [...acc, [cur]];
    }
  }, [] as { text: string; span: boolean; fn: (text: string) => React.ReactElement }[][]);

  const textElement = textFlat.map((t, i) => {
    const span = t[0].span;
    if (span) {
      return (
        <p
          key={i}
          style={{
            fontSize: "17px",
            margin: "0px",
            marginTop: "12px",
          }}
        >
          {t.map((t) => t.fn(t.text))}
        </p>
      );
    } else {
      return t[0].fn(t[0].text);
    }
  });

  return (
    <div
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
