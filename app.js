import "dotenv/config";
import express from "express";
import fetch from "node-fetch";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Home page
app.get("/", (req, res) => {
  res.render("index", {
    corrected: "",
    originalText: "",
  });
});

// Correct text route
app.post("/correct", async (req, res) => {
  let originalText = "";
  let corrected = "";

  try {
    // ✅ Safe input handling
    originalText = (req.body.text || "").trim();

    if (!originalText) {
      corrected = "Please enter some text to correct.";
      return res.render("index", { corrected, originalText });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful assistant" },
            {
              role: "user",
              content: `Correct the following text:\n\n${originalText}`,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI error:", errText);
      throw new Error("OpenAI API failed");
    }

    const data = await response.json();
    corrected = data.choices[0].message.content;

  } catch (error) {
    console.error(error);
    corrected = "Something went wrong. Please try again.";
  }

  // ✅ SINGLE RESPONSE — ALWAYS
  return res.render("index", { corrected, originalText });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server started on port ${port}`);
});
