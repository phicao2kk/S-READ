export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { content } = req.body;

  // Kiểm tra nếu content trống
  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an English exam creator. Extract/Generate a reading comprehension task from the user's input. Return ONLY a JSON object with this structure: { \"title\": \"...\", \"passage\": \"...\", \"questions\": [ { \"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"answer\": 0 } ] }. 'answer' must be the index (0-3) of the correct option."
          },
          { role: "user", content: content }
        ],
        response_format: { type: 'json_object' }
      })
    });

    // --- BẮT ĐẦU KIỂM TRA LỖI KẾT NỐI ---
    if (!response.ok) {
      const errorData = await response.json();
      console.error("DeepSeek API Error:", errorData);
      return res.status(response.status).json({ 
        message: "Lỗi từ DeepSeek API", 
        detail: errorData.error?.message || "Unknown error" 
      });
    }

    const data = await response.json();
    
    // Kiểm tra xem dữ liệu có tồn tại không
    if (!data.choices || data.choices.length === 0) {
      return res.status(500).json({ error: "AI không trả về kết quả" });
    }

    const aiContent = data.choices[0].message.content;
    
    try {
      const result = JSON.parse(aiContent);
      res.status(200).json(result);
    } catch (parseError) {
      console.error("JSON Parse Error:", aiContent);
      res.status(500).json({ error: "AI trả về định dạng JSON không hợp lệ" });
    }
    
  } catch (error) {
    console.error("Network/Runtime Error:", error);
    res.status(500).json({ error: "Không thể kết nối tới server AI. Vui lòng thử lại." });
  }
}
