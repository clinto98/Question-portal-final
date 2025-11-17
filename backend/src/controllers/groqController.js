import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateExplanationWithGroq = async (req, res) => {
  try {
    const { question, options, correctAnswer } = req.body;

    if (!question && !req.files) {
      return res.status(400).json({
        success: false,
        message: "Question text or an image is required.",
      });
    }
    if (!options || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: "Options and correct answer are required.",
      });
    }

    const textPrompt = `
    You are an expert educator. Your task is to provide 3 different concise explanations for a multiple-choice question, along with keywords and the topic. The question and/or options may include images, which are provided before this text.

    The response should be **only a JSON file** and nothing else, adhering to the specified schema.

    The JSON file must be well-structured and contain the keys: "explanation1", "explanation2", "explanation3", "keywords", and "topic".
    All explanations must be **concise and precise, approximately 3-5 sentences long.**

    - **explanation1**: A formal rationale (3-4 sentences max 50 words). Clearly state the correct answer, explain why it is correct, and briefly state why the other options are incorrect.
    - **explanation2**: A direct explanation (3-4 sentences max 50 words). State the correct answer and provide a high-level summary of the core reason it is correct and the others are flawed.
    - **explanation3**: A "How to Solve" guide (3-4 sentences max 50 words). Describe the direct logical process to find the answer. For math/science, list the key calculation or formula steps. For conceptual or knowledge questions, explain the process of elimination or the key logical deduction that separates the correct answer from the incorrect ones.
    - **keywords**: A comma-separated string of the major keywords related to the question and answer.
    - **topic**: A string identifying the main topic the question is related to.

    Generate the JSON output based on the following inputs:

    Question: "${question || '(See image for question)'}"
    Options:
    - ${Array.isArray(options) ? options.join("\n- ") : options}
    Correct Answer: "${correctAnswer}"

    The response MUST follow this exact JSON schema:
    {
      "explanation1": "string",
      "explanation2": "string",
      "explanation3": "string",
      "keywords": "string",
      "topic": "string"
    }
`;

    const messages = [
      {
        role: "user",
        content: [],
      },
    ];

    // Add question image if it exists
    if (req.files && req.files.questionImage) {
      const questionImageFile = req.files.questionImage[0];
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: `data:${questionImageFile.mimetype};base64,${questionImageFile.buffer.toString("base64")}`,
        }
      });
    }

    // Add the main text prompt
    messages[0].content.push({
      type: "text",
      text: textPrompt,
    });

    // Add choice images if they exist
    if (req.files && req.files.choiceImages) {
      req.files.choiceImages.forEach(file => {
        messages[0].content.push({
          type: "image_url",
          image_url: {
            url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          }
        });
      });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
    });

    const explanation = chatCompletion.choices[0]?.message?.content || "";
    const cleanedData = explanation
      .replace(/```json/g, '')   // remove opening ```json
      .replace(/```/g, '')       // remove closing ```
      .trim();
    const jsonData = JSON.parse(cleanedData);

    res.status(200).json({ success: true, data: jsonData });
  } catch (error) {
    console.error("Error generating explanation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate explanation.",
      error: error.message,
    });
  }
};

export { generateExplanationWithGroq };
