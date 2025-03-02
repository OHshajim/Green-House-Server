const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CloudName,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_Secret,
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    debug: true,
  })
);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Connect to supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.post("/MediaHosting", async (req, res) => {
  try {
    if (!req.files || !req.files.media) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const mediaFiles = Array.isArray(req.files.media)
      ? req.files.media
      : [req.files.media];
    console.log(mediaFiles);

    const uploadPromises = mediaFiles.map(async (file) => {
      const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
        resource_type: "auto",
      });
      return uploadResult.url;
    });

    const uploadedURLs = await Promise.all(uploadPromises);

    res.status(200).json({ success: true, HostingURLs: uploadedURLs });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// For testimonials

app.get("/TotalTestimonials", async (req, res) => {
  try {
    const { data, error, count } = await supabase
      .from("Testimonials")
      .select("*", { count: "exact" });

    if (error) {
      console.error("Error fetching testimonials count:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error fetching count" });
    }
    res.status(200).json({ success: true, totalTestimonials: count });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Unexpected error occurred" });
  }
});

app.get("/testimonials", async (req, res) => {
  try {
    const {
      destination,
      accommodation,
      vibe,
      date,
      rating,
      minDuration,
      maxDuration,
      sort,
      search,
      page = 1, // Default page number is 1
    } = req.query;

    let query = supabase.from("Testimonials").select();

    // Apply filters
    if (destination) query = query.eq("cities", destination);
    if (accommodation)
      query = query.eq("accommodations", accommodation.toLowerCase());
    if (vibe) query = query.eq("travelTags", vibe);
    if (date) query = query.eq("dateOfTravel", date);
    if (rating) query = query.eq("rating", rating);
    if (minDuration) query = query.gte("duration", minDuration);
    if (maxDuration) query = query.lte("duration", maxDuration);

    // Search by text
    if (search) {
      query = query.ilike("TravelerName", `%${search}%`);
    }

    // Sorting
    if (sort === "asc") {
      query = query.order("created_at", { ascending: true });
    } else if (sort === "desc") {
      query = query.order("created_at", { ascending: false });
    }

    // Pagination
    const limit = 9;
    const offset = (page - 1) * limit;

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching testimonials:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error fetching testimonials" });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Unexpected error:", error);
    res
      .status(500)
      .json({ success: false, message: "Unexpected error occurred" });
  }
});

app.post("/testimonial", async (req, res) => {
  try {
    const postData = req.body;
    if (!postData) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("Testimonials")
      .insert(postData);

    if (error) throw error; // Throwing error for global catch block

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Supabase Error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
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
