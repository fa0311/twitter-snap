import { StyleComponent } from "./../core/twitterSnap";

const Normal: StyleComponent = ({ name, id, icon, text }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(-45deg, #0077F2ee 0%, #1DA1F2ee 50%,#4CFFE2ee 100%)",
      }}
    >
      <div
        style={{
          width: "550px",
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
              {id}
            </p>
          </div>
        </div>
        {text.split("\n").map((t, key) => (
          <p
            key={key}
            style={{
              fontSize: "17px",
              margin: "0px",
              marginTop: "12px",
            }}
          >
            {t}
          </p>
        ))}
      </div>
    </div>
  );
};

export default Normal;
