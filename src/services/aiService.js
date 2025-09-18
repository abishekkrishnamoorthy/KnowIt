// Mock data for development - replace with actual AI API integration
const mockQuestions = {
  javascript: [
    {
      question: "What is the correct way to declare a variable in JavaScript?",
      options: ["var x = 5;", "variable x = 5;", "v x = 5;", "declare x = 5;"],
      correctAnswer: "var x = 5;"
    },
    {
      question: "Which method is used to add an element to the end of an array?",
      options: ["push()", "add()", "append()", "insert()"],
      correctAnswer: "push()"
    },
    {
      question: "What does '===' operator do in JavaScript?",
      options: ["Assigns value", "Compares value only", "Compares value and type", "Creates variable"],
      correctAnswer: "Compares value and type"
    },
    {
      question: "Which of the following is NOT a JavaScript data type?",
      options: ["String", "Boolean", "Float", "Number"],
      correctAnswer: "Float"
    },
    {
      question: "What is the output of 'typeof null' in JavaScript?",
      options: ["null", "undefined", "object", "boolean"],
      correctAnswer: "object"
    }
  ],
  react: [
    {
      question: "What is JSX in React?",
      options: ["A JavaScript library", "A syntax extension for JavaScript", "A CSS framework", "A database"],
      correctAnswer: "A syntax extension for JavaScript"
    },
    {
      question: "Which hook is used to manage state in functional components?",
      options: ["useEffect", "useState", "useContext", "useReducer"],
      correctAnswer: "useState"
    },
    {
      question: "What is the purpose of useEffect hook?",
      options: ["To manage state", "To handle side effects", "To create components", "To style components"],
      correctAnswer: "To handle side effects"
    },
    {
      question: "How do you pass data from parent to child component?",
      options: ["Through state", "Through props", "Through context", "Through refs"],
      correctAnswer: "Through props"
    },
    {
      question: "What is the virtual DOM in React?",
      options: ["A real DOM element", "A JavaScript representation of the real DOM", "A CSS framework", "A database"],
      correctAnswer: "A JavaScript representation of the real DOM"
    }
  ],
  python: [
    {
      question: "Which of the following is the correct way to define a function in Python?",
      options: ["function myFunc():", "def myFunc():", "define myFunc():", "func myFunc():"],
      correctAnswer: "def myFunc():"
    },
    {
      question: "What is the output of print(type([]))?",
      options: ["<class 'array'>", "<class 'list'>", "<class 'tuple'>", "<class 'dict'>"],
      correctAnswer: "<class 'list'>"
    },
    {
      question: "Which operator is used for floor division in Python?",
      options: ["/", "//", "%", "**"],
      correctAnswer: "//"
    },
    {
      question: "What does the 'len()' function do?",
      options: ["Returns the length of an object", "Creates a new list", "Sorts a list", "Removes duplicates"],
      correctAnswer: "Returns the length of an object"
    },
    {
      question: "Which of the following is NOT a valid Python data type?",
      options: ["int", "float", "char", "str"],
      correctAnswer: "char"
    }
  ]
};

// Function to generate questions using AI API
export async function generateQuestions(topic, difficulty, numQuestions) {
  try {
    // For now, return mock data
    const topicKey = topic.toLowerCase();
    const availableQuestions = mockQuestions[topicKey] || mockQuestions.javascript;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return requested number of questions
    return availableQuestions.slice(0, numQuestions);
    
    // TODO: Uncomment and configure when ready to use AI API
    /*
    const { OpenAI } = await import('openai');
    
    const client = new OpenAI({
      baseURL: "https://api.aimlapi.com/v1",
      apiKey: "eb3ebf7d3fad4eaca1bc0ebea0a347f2",
      dangerouslyAllowBrowser: true
    });

    const prompt = `Generate ${numQuestions} multiple-choice questions about ${topic} with ${difficulty} difficulty level. 
    Format the response as a JSON array where each question has:
    - question: the question text
    - options: array of 4 possible answers
    - correctAnswer: the correct answer (must match one of the options exactly)
    
    Make sure the questions are educational and appropriate for the ${difficulty} difficulty level.`;

    const response = await client.chat.completions.create({
      model: "meta-llama/Llama-3-70b-chat-hf",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      top_p: 0.7,
      frequency_penalty: 1,
      max_tokens: 1536,
      top_k: 50,
    });

    const content = response.choices[0].message.content;
    const questions = JSON.parse(content);
    return questions;
    */
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate questions. Please try again.');
  }
}