const express = require("express");

const app = express();

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

app.get("/", (req, res) => {
  res.send("Reddit Status API Running");
});

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
        redirect: "follow",
        headers: {
          "User-Agent": USER_AGENT
        }
      });

      link = redirectResponse.url;
    }

    // cleanup
    link = link.split("?")[0];

    if (link.endsWith("/")) {
      link = link.slice(0, -1);
    }

    // OEMBED CHECK
    const oembedUrl =
      "https://www.reddit.com/oembed?url="
      + encodeURIComponent(link);

    const oembedResponse = await fetch(oembedUrl, {
      headers: {
        "User-Agent": USER_AGENT
      }
    });

    // obvious dead
    if (
      oembedResponse.status === 404 ||
      oembedResponse.status === 403
    ) {

      return res.json({
        status: "ERROR",
        reason: "POST_UNAVAILABLE"
      });
    }

    // JSON CHECK
    const jsonUrl = link + ".json";

    const jsonResponse = await fetch(jsonUrl, {
      headers: {
        "User-Agent": USER_AGENT
      }
    });

    // if reddit blocks json but oembed works
    if (jsonResponse.status !== 200) {

      return res.json({
        status: "LIVE",
        reason: "OEMBED_ONLY"
      });
    }

    const data = await jsonResponse.json();

    // invalid payload
    if (
      !Array.isArray(data) ||
      !data[0] ||
      !data[0].data ||
      !data[0].data.children ||
      data[0].data.children.length === 0
    ) {

      return res.json({
        status: "ERROR",
        reason: "INVALID_POST"
      });
    }

    const post =
      data[0].data.children[0].data;

    // REMOVED / FILTERED / DELETED
    if (
      post.removed_by_category ||
      post.removed ||
      post.banned_by ||
      post.author === "[deleted]" ||
      post.selftext === "[deleted]"
    ) {

      return res.json({
        status: "ERROR",
        reason: "REMOVED_OR_DELETED"
      });
    }

    // LIVE
    return res.json({
      status: "LIVE",
      reason: "POST_EXISTS"
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
