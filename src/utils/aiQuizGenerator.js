const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

if (!GROQ_API_KEY) {
  console.error("VITE_GROQ_API_KEY is not set in environment variables");
}

export const generateQuiz = async (title, description, difficulty, numQuestions) => {
  try {
    const prompt = `Generate a quiz with exactly ${numQuestions} multiple-choice questions based on the following:

Title: ${title}
Description: ${description}
Difficulty Level: ${difficulty}

Requirements:
- Generate exactly ${numQuestions} questions
- Each question must have exactly 4 options
- Difficulty should be ${difficulty} level
- Questions should be relevant to the title and description
- Return ONLY a valid JSON array, no other text

Format each question as:
{
  "question": "The question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": 0
}

Where correctAnswer is the index (0-3) of the correct option.

Return the questions as a JSON array in this exact format:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctAnswer": 0
  },
  ...
]`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "You are a quiz generator. Always return valid JSON arrays only, no markdown, no code blocks, just pure JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error("No response from AI");
    }

    // Remove markdown code blocks if present
    let jsonContent = content;
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/```\n?/g, "");
    }

    // Parse JSON
    let questions;
    try {
      questions = JSON.parse(jsonContent);
    } catch (parseError) {
      // Try to extract JSON from the response
      const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    // Validate questions format
    if (!Array.isArray(questions)) {
      throw new Error("AI response is not an array");
    }

    // Validate and normalize each question
    const validatedQuestions = questions.map((q, index) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Invalid question format at index ${index}`);
      }

      // Ensure correctAnswer is a valid index
      let correctAnswer = parseInt(q.correctAnswer);
      if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) {
        // If invalid, default to 0
        correctAnswer = 0;
      }

      return {
        question: q.question.trim(),
        options: q.options.map(opt => String(opt).trim()),
        correctAnswer: correctAnswer
      };
    });

    // Ensure we have the exact number of questions requested
    if (validatedQuestions.length < numQuestions) {
      throw new Error(`Only received ${validatedQuestions.length} questions, expected ${numQuestions}`);
    }

    // Return exactly the requested number
    return validatedQuestions.slice(0, numQuestions);

  } catch (error) {
    console.error("Error generating quiz with AI:", error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
};
