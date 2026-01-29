import "dotenv/config";  // Loads env file
import express from "express"; //imports express webframwork for Node.js
import fetch from "node-fetch";

const app = express(); //Creates express server instance

const port = process.env.PORT || 5000; //Works locally on 5000 port

// Middleware
app.set("view engine", "ejs"); // Tells express that i am using ejs templates
app.use(express.urlencoded({ extended: true })); //parses from data. Converts request body into req.body

// Home page
app.get("/", (req, res) => {
  res.render("index", {
    corrected: "",
    originalText: "",
  });
}); //Loads page initially send empty value to ejs of corrected and original text

// Correct text route
app.post("/correct", async (req, res) => {
  let originalText = "";
  let corrected = ""; //It calls the correct route. asynch is needed for API call


  try {
    // Safe input handling
    originalText = (req.body.text || "").trim(); //prevent crashes, handles empty input safely

    if (!originalText) {
      corrected = "Please enter some text to correct.";
      return res.render("index", { corrected, originalText }); 
    }//if not original text. It is needed to avoid unnecessary API calls

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
    ); //logic for calling the API key

    if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI error:", errText);
      throw new Error("OpenAI API failed");
    } //Handles API failure

    const data = await response.json(); 
    corrected = data.choices[0].message.content; //API may return multiple responses you have to take first one

  } catch (error) {
    console.error(error);
    corrected = "Something went wrong. Please try again.";
  }

  // SINGLE RESPONSE — ALWAYS
  return res.render("index", { corrected, originalText });
}); //Express allows only one response per request

// Start server
app.listen(port, () => {
  console.log(` Server started on port ${port}`);
});
