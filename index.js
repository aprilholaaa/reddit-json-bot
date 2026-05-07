const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Reddit JSON API Running");
});

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
        redirect: "follow"
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
