export default async function handler(req, res) {
  // 1. Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { content } = req.body;

  try {
    // 2. Gọi API của DeepSeek
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}` // Nó sẽ tự lấy Key bạn vừa nhập trên web
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an English exam creator. Extract/Generate a reading comprehension task from the user's input. Return ONLY a JSON object with this structure: { \"title\": \"...\", \"passage\": \"...\", \"questions\": [ { \"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"answer\": 0 } ] }. 'answer' must be the index (0-3) of the correct option. Do not include markdown formatting or explanations."
          },
          { role: "user", content: content }
        ],
        // Ép DeepSeek trả về định dạng JSON
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    
    // 3. Lấy nội dung JSON từ AI và gửi về cho Giao diện
    const result = JSON.parse(data.choices[0].message.content);
    res.status(200).json(result);
    
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI processing failed" });
  }
}