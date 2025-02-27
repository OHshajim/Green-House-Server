const express = require("express");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
cloudinary.config({
  cloud_name: process.env.CloudName,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_Secret,
});

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(
  fileUpload({
    useTempFiles: true,
  })
);
// Connect to supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Media Hosting API
app.post("/MediaHosting", async (req, res) => {
  try {
    const { media } = req.files;
    const uploadResult = await cloudinary.uploader
      .upload(media.tempFilePath)
      .catch((error) => {
        res.status(500).json({ success: false, message: "Media upload error" });
      });
    res.status(200).json({ success: true, HostingURL: uploadResult.url });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// For testimonials
app.get("/testimonials", async (req, res) => {
  const { data, error } = await supabase.from("Testimonials").select();

  if (error) {
    console.error("Error to get testimonial : ", error);
    return res
      .status(500)
      .json({ success: false, message: "Error to get testimonial" });
  }
  res.status(200).json({ success: true, data });
});
app.post("/testimonial", async (req, res) => {
  try {
    const postData = req.body;
    console.log(postData);

    if (!postData) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("Testimonials")
      .insert(postData);

    if (error) {
      console.error("Error inserting data into Supabase:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error inserting testimonial" });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});
app.put("/testimonial", async (req, res) => {
  const updatedData = req.body;
  const { data, error } = await supabase
    .from("Testimonials")
    .update(updatedData)
    .eq("id", updatedData.id);

  if (error) {
    console.error("Error to update testimonial : ", error);
    return res
      .status(500)
      .json({ success: false, message: "Error to update testimonial" });
  }
  res.status(200).json({ success: true, data });
});

app.get("/", (req, res) => {
  res.send("Supabase Testimonials API is Running...");
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
