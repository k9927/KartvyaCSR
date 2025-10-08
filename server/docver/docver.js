import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import axios from "axios";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/submit-document", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Step 1: OCR extraction
    const { data: { text } } = await Tesseract.recognize(filePath, "eng");

    // Step 2: Extract CIN (India) and Company Name
    const cinRegex = /[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}/;
    const cinMatch = text.match(cinRegex);
    const cin = cinMatch ? cinMatch[0] : null;

    // Basic Company Name extraction (adjust regex to your certificate format)
    const nameRegex = /Company Name[:\s]*(.*)/i;
    const nameMatch = text.match(nameRegex);
    const companyName = nameMatch ? nameMatch[1].trim() : null;

    if (!cin || !companyName) {
      return res.json({ verified: false, message: "CIN or Company Name not found in document" });
    }

    // Step 3: Verify with OpenCorporates API
    const apiUrl = `https://api.opencorporates.com/companies/in/${cin}`;
    const apiResponse = await axios.get(apiUrl);
    const companyData = apiResponse.data.company;

    if (!companyData) {
      return res.json({ verified: false, message: "Company not found in OpenCorporates" });
    }

    // Step 4: Compare extracted company name with API data
    const nameMatchScore = companyData.name.toLowerCase().includes(companyName.toLowerCase());
    const verified = nameMatchScore;

    // Step 5: Return result
    res.json({
      verified,
      extracted: { cin, companyName },
      officialData: companyData
    });
  } catch (err) {
    res.status(500).json({ verified: false, error: err.message });
  }
});

export default router;
