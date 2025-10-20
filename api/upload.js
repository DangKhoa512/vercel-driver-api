import { google } from "googleapis";
import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } }; // cho phép nhận file binary

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "POST only" });
  }

  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Parse error" });

    const file = files.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(fs.readFileSync("./service_account.json")),
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });
      const drive = google.drive({ version: "v3", auth });

      const folderId = "19X1Kyve_sNVpu2MSaH3X4E_v3PORTN3R"; // 🔹 Folder Drive ID của bạn
      const fileMetadata = {
        name: file.originalFilename,
        parents: [folderId],
      };

      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.filepath),
      };

      const uploaded = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: "id, webViewLink",
      });

      res.status(200).json({
        status: "success",
        fileId: uploaded.data.id,
        webViewLink: uploaded.data.webViewLink,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });
}
