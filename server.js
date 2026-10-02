const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// =====================================================
// CONFIGURATION
// =====================================================

const PORT = process.env.PORT || 5000;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-20b";

// =====================================================
// STARTUP CHECK
// =====================================================

console.log("");

if (GROQ_API_KEY) {
  console.log("Groq API Key: Configured");
} else {
  console.log("WARNING: GROQ_API_KEY is missing.");
  console.log("Make sure your .env file is in the same folder as server.js.");
}

console.log("");

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

// Serve frontend files from public folder
app.use(express.static(
  path.join(__dirname, "public")
));

// =====================================================
// GROQ FUNCTION
// =====================================================

async function askGroq(prompt) {

  if (!GROQ_API_KEY) {

    throw new Error(
      "GROQ_API_KEY is missing from your .env file."
    );

  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        "Authorization":
          `Bearer ${GROQ_API_KEY}`
      },

      body: JSON.stringify({

        model: GROQ_MODEL,

        messages: [

          {
            role: "system",

            content:
              "You are a helpful coding quiz assistant."
          },

          {
            role: "user",

            content: prompt
          }

        ],

        temperature: 0.7

      })
    }
  );

  const data = await response.json();

  if (!response.ok) {

    console.error(
      "Groq API Error:",
      data
    );

    throw new Error(
      data?.error?.message ||
      "Groq API request failed."
    );

  }

  const content =
    data?.choices?.[0]?.message?.content;

  if (!content) {

    throw new Error(
      "Groq returned an empty response."
    );

  }

  return content;
}


// =====================================================
// GENERATE QUIZ
// =====================================================

app.post(
  "/api/generate-quiz",
  async (req, res) => {

    try {

      const category =
        req.body.category || "HTML";

      const numberOfQuestions =
        Number(
          req.body.numberOfQuestions
        ) || 5;

      console.log(
        `Generating ${category} quiz...`
      );

      const prompt = `

Create a coding quiz about ${category}.

Generate exactly ${numberOfQuestions}
multiple-choice questions.

Return ONLY valid JSON.

Do NOT use Markdown.
Do NOT use code fences.
Do NOT add text before or after the JSON.

Use exactly this structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",

        "Option B",

        "Option C",
        
        "Option D"
      ],
      "correctAnswer": "The exact correct option text"
    }
  ]
}

Rules:

Generate exactly ${numberOfQuestions} questions.

Every question must be about ${category}.

Every question must have exactly 4 options.

There must be exactly one correct answer.

correctAnswer must exactly match one option.

Every option must have space.

Do not repeat questions.

Keep the questions suitable for a coding learner.

Return JSON only.

`;

      const aiResponse =
        await askGroq(prompt);

      console.log(
        "Groq response received."
      );

      // ================================================
      // CLEAN GROQ RESPONSE
      // ================================================

      let cleanedResponse =
        aiResponse.trim();

      cleanedResponse =
        cleanedResponse
          .replace(/^```json/i, "")
          .replace(/^```/i, "")
          .replace(/```$/i, "")
          .trim();

      // ================================================
      // PARSE JSON
      // ================================================

      let quizData;

      try {

        quizData =
          JSON.parse(cleanedResponse);

      } catch (jsonError) {

        console.error(
          "Invalid JSON returned by Groq."
        );

        console.error(
          cleanedResponse
        );

        return res.status(500).json({

          success: false,

          error:
            "Groq returned invalid quiz JSON."

        });

      }

      // ================================================
      // VALIDATE QUESTIONS
      // ================================================

      if (
        !quizData.questions ||
        !Array.isArray(
          quizData.questions
        )
      ) {

        return res.status(500).json({

          success: false,

          error:
            "No valid questions were returned."

        });

      }

      if (
        quizData.questions.length === 0
      ) {

        return res.status(500).json({

          success: false,

          error:
            "Quiz contains no questions."

        });

      }

      console.log(
        `Quiz generated: ${quizData.questions.length} questions`
      );

      // ================================================
      // SEND QUIZ TO FRONTEND
      // ================================================

      return res.json({

        success: true,

        category: category,

        questions:
          quizData.questions

      });

    } catch (error) {

      console.error("");

      console.error(
        "GENERATE QUIZ ERROR:"
      );

      console.error(
        error.message
      );

      console.error("");

      return res.status(500).json({

        success: false,

        error:
          error.message ||
          "Failed to generate quiz."

      });

    }

  }
);


// =====================================================
// AI ASSISTANT
// =====================================================

app.post(
  "/api/ask-ai",
  async (req, res) => {

    try {

      const message =
        req.body.message;

      if (!message) {

        return res.status(400).json({

          success: false,

          error:
            "Please enter a message."

        });

      }

      const prompt = `

You are a helpful coding assistant.

Answer the user's coding question clearly.

Explain concepts in simple language when possible.

User question:

${message}

`;

      const reply =
        await askGroq(prompt);

      return res.json({

        success: true,

        reply: reply

      });

    } catch (error) {

      console.error(
        "AI ASSISTANT ERROR:",
        error.message
      );

      return res.status(500).json({

        success: false,

        error:
          error.message ||
          "AI request failed."

      });

    }

  }
);


// =====================================================
// API TEST
// =====================================================

app.get(
  "/api/test",
  (req, res) => {

    res.json({

      success: true,

      message:
        "Coding Quiz API is working."

    });

  }
);


// =====================================================
// FRONTEND FALLBACK
// =====================================================

// This must stay AFTER the API routes.

app.use(
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );

  }
);


// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {

    console.log(
      "======================================"
    );

    console.log(
      "       CODING QUIZ SERVER"
    );

    console.log(
      "======================================"
    );

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `Quiz:   http://localhost:${PORT}/api/generate-quiz`
    );

    console.log(
      `AI:     http://localhost:${PORT}/api/ask-ai`
    );

    console.log(
      `Test:   http://localhost:${PORT}/api/test`
    );

    console.log(
      "======================================"
    );

    console.log("");

  }
);

