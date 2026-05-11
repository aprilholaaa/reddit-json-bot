const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Reddit JSON API Running");
});

// CHECK REDDIT STATUS
app.get("/check", async (req, res) => {

  try {

    let link = req.query.link;

    if (!link) {

      return res.json({
        status: "ERROR",
        reason: "NO_LINK"
      });
    }

    // resolve short links
    if (
      link.includes("/s/") ||
      link.includes("redd.it")
    ) {

      const redirectResponse = await fetch(link, {
        method: "GET",
        redirect: "follow"
      });

      link = redirectResponse.url;
    }

    // clean url
    link = link.split("?")[0];

    if (link.endsWith("/")) {
      link = link.slice(0, -1);
    }

    // use oembed instead of json
    const apiUrl =
      "https://www.reddit.com/oembed?url="
      + encodeURIComponent(link);

    const response = await fetch(apiUrl);

    // LIVE
    if (response.status === 200) {

      return res.json({
        status: "LIVE"
      });
    }

    // DELETED
    if (
      response.status === 404
    ) {

      return res.json({
        status: "DELETED"
      });
    }

    // OTHER
    return res.json({
      status: "ERROR",
      reason: `HTTP_${response.status}`
    });

  } catch(err) {

    return res.json({
      status: "ERROR",
      reason: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
