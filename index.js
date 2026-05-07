function onEdit(e) {

  const sheet = e.source.getActiveSheet();

  const row = e.range.getRow();
  const col = e.range.getColumn();

  if (col !== 4) return;

  const redditLink = sheet.getRange(row, 4).getValue();

  if (!redditLink) return;

  try {

    const apiUrl =
      "https://exciting-nourishment-production-2133.up.railway.app/convert?link="
      + encodeURIComponent(redditLink);

    const response = UrlFetchApp.fetch(apiUrl);

    const data = JSON.parse(response.getContentText());

    sheet.getRange(row, 5).setValue(data.jsonUrl);

    sheet.getRange(row, 6).setValue("DONE");

  } catch(err) {

    sheet.getRange(row, 6).setValue(err.toString());

  }
}
