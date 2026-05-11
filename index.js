const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Reddit JSON API Running");
});

// CONVERT REDDIT URL TO JSON
app.get("/convert", async (req, res) => {

  try {

    let link = req.query.link;

    if (!link) {
      return res.status(400).json({
        error: "No link provided"
      });
    }

    // resolve short links
    if (
      link.includes("/s/") ||
      link.includes("redd.it")
    ) {

      const response = await fetch(link, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
        }
      });

      link = response.url;
    }

    // remove query params
    link = link.split("?")[0];

    // remove trailing slash
    if (link.endsWith("/")) {
      link = link.slice(0, -1);
    }

    // convert to json
    const jsonUrl = link + ".json";

    return res.json({
      jsonUrl
    });

  } catch(err) {

    return res.status(500).json({
      error: err.message
    });
  }
});

// VERIFY REDDIT STATUS
app.get("/check", async (req, res) => {

  try {

    let link = req.query.link;

    if (!link) {
      return res.status(400).json({
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
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
        }
      });

      link = redirectResponse.url;
    }

    // remove query params
    link = link.split("?")[0];

    // remove trailing slash
    if (link.endsWith("/")) {
      link = link.slice(0, -1);
    }

    const jsonUrl = link + ".json";

    // fetch reddit json
    const redditResponse = await fetch(jsonUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
      }
    });

    // non 200
    if (redditResponse.status !== 200) {

      return res.json({
        status: "ERROR",
        reason: `HTTP_${redditResponse.status}`,
        jsonUrl
      });
    }

    const data = await redditResponse.json();

    // invalid reddit payload
    if (
      !Array.isArray(data) ||
      !data[0] ||
      !data[0].data ||
      !data[0].data.children ||
      data[0].data.children.length === 0
    ) {

      return res.json({
        status: "DELETED",
        reason: "NO_POST_DATA",
        jsonUrl
      });
    }

    const post = data[0].data.children[0].data;

    // removed/deleted
    if (
      post.removed_by_category ||
      post.selftext === "[deleted]" ||
      post.author === "[deleted]"
    ) {

      return res.json({
        status: "DELETED",
        reason: "POST_REMOVED_OR_DELETED",
        jsonUrl
      });
    }

    // live
    return res.json({
      status: "LIVE",
      reason: "POST_EXISTS",
      jsonUrl
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
