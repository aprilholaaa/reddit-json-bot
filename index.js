const express = require("express");

const app = express();

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

app.get("/", (req, res) => {
  res.send("Reddit Status API Running");
});



// POST CHECK
app.get("/check", async (req, res) => {

  try {

    let link = req.query.link;

    if (!link) {

      return res.json({
        status: "INVALID"
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

    if (
      oembedResponse.status === 404 ||
      oembedResponse.status === 403
    ) {

      return res.json({
        status: "INVALID"
      });
    }

    const jsonUrl = link + ".json";

    const jsonResponse = await fetch(jsonUrl, {
      headers: {
        "User-Agent": USER_AGENT
      }
    });

    if (jsonResponse.status !== 200) {

      return res.json({
        status: "LIVE"
      });
    }

    const data = await jsonResponse.json();

    if (
      !Array.isArray(data) ||
      !data[0] ||
      !data[0].data ||
      !data[0].data.children ||
      data[0].data.children.length === 0
    ) {

      return res.json({
        status: "INVALID"
      });
    }

    const post =
      data[0].data.children[0].data;

    if (
      post.author === "[deleted]" ||
      post.selftext === "[deleted]"
    ) {

      return res.json({
        status: "USER_DELETED"
      });
    }

    if (
      post.removed_by_category === "moderator"
    ) {

      return res.json({
        status: "MOD_REMOVED"
      });
    }

    if (
      post.removed_by_category === "reddit" ||
      post.removed_by_category === "automod_filtered" ||
      post.banned_by ||
      post.removed ||
      post.removal_reason ||
      post.mod_reason_by
    ) {

      return res.json({
        status: "REDDIT_FILTER"
      });
    }

    if (
      typeof post.selftext === "string" &&
      (
        post.selftext.includes("[removed]") ||
        post.selftext.includes("removed by reddit")
      )
    ) {

      return res.json({
        status: "REDDIT_FILTER"
      });
    }

    return res.json({
      status: "LIVE"
    });

  } catch(err) {

    return res.json({
      status: "INVALID"
    });
  }
});



// RECURSIVE COMMENT FINDER
function findComment(comments, commentId) {

  for (const item of comments) {

    if (
      item.kind === "t1" &&
      item.data
    ) {

      // FOUND COMMENT
      if (
        item.data.id === commentId
      ) {

        return item.data;
      }

      // SEARCH REPLIES
      if (
        item.data.replies &&
        item.data.replies.data &&
        item.data.replies.data.children
      ) {

        const found =
          findComment(
            item.data.replies.data.children,
            commentId
          );

        if (found) {
          return found;
        }
      }
    }
  }

  return null;
}



// COMMENT CHECK
app.get("/comment-check", async (req, res) => {

  try {

    let link = req.query.link;

    if (!link) {

      return res.json({
        status: "INVALID"
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

    // extract comment id
    const parts = link.split("/");

    let commentId = null;

    for (let i = 0; i < parts.length; i++) {

      if (
        parts[i] === "comments"
      ) {

        // /comments/postid/comment/commentid/

        if (
          parts[i + 2] === "comment" &&
          parts[i + 3]
        ) {

          commentId = parts[i + 3];
          break;
        }

        // /comments/postid/title/commentid/

        if (
          parts[i + 4]
        ) {

          commentId = parts[i + 4];
          break;
        }
      }
    }

    if (!commentId) {

      return res.json({
        status: "INVALID"
      });
    }

    // json url
    const jsonUrl = link + ".json";

    const response = await fetch(jsonUrl, {
      headers: {
        "User-Agent": USER_AGENT
      }
    });

    if (response.status !== 200) {

      return res.json({
        status: "REDDIT_FILTER"
      });
    }

    const data = await response.json();

    if (
      !data[1] ||
      !data[1].data ||
      !data[1].data.children
    ) {

      return res.json({
        status: "INVALID"
      });
    }

    // RECURSIVE SEARCH
    const foundComment =
      findComment(
        data[1].data.children,
        commentId
      );

    if (!foundComment) {

      return res.json({
        status: "INVALID"
      });
    }

    // USER DELETED
    if (
      foundComment.author === "[deleted]" ||
      foundComment.body === "[deleted]"
    ) {

      return res.json({
        status: "USER_DELETED"
      });
    }

    // MOD REMOVED
    if (
      foundComment.body === "[removed]"
    ) {

      return res.json({
        status: "MOD_REMOVED"
      });
    }

    // LIVE
    return res.json({
      status: "LIVE"
    });

  } catch(err) {

    return res.json({
      status: "INVALID"
    });
  }
});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
