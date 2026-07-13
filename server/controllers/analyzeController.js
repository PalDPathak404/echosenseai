import Groq from "groq-sdk";
import fs from "fs";
import os from "os";
import path from "path";

export const analyzeFeedback = async (req, res) => {
  try {
    let { text, audioBase64, rating, businessType, organizationId, branchId, businessId } = req.body;
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured in the .env file.");
    }

    const groq = new Groq({ apiKey });

    // Whisper Audio Transcription (if provided)
    if (audioBase64) {
      try {
        const parts = audioBase64.split('|');
        let ext = 'webm';
        let pureBase64 = audioBase64;
        
        if (parts.length > 1) {
          ext = parts[0];
          pureBase64 = parts[1];
        }

        const buffer = Buffer.from(pureBase64, 'base64');
        const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.${ext}`);
        fs.writeFileSync(tempFilePath, buffer);
        
        const transcription = await groq.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: "whisper-large-v3-turbo",
        });
        
        text = transcription.text;
        console.log("Whisper transcribed audio:", text);
        fs.unlinkSync(tempFilePath); 
      } catch (whisperError) {
        console.error("Whisper Audio Transcription Error:", whisperError);
      }
    }

    if (!text || text.trim() === 'No clear audio transcribed.') {
       text = "Customer left a rating but did not provide detailed text or voice feedback.";
    }

    const systemPrompt = `You are an expert Operations Consultant and Customer Experience Analyzer for Enterprise SaaS.
You are analyzing feedback for a business of type: "${businessType || 'generic'}". 
The customer gave a star rating of ${rating || 'Unknown'}/5.

Your task is to analyze the provided feedback and generate an executive-level JSON insight card.

CRITICAL RULES:
1. You MUST respond ONLY with a strict JSON object matching this exact structure:
{
  "executiveSummary": "Max 3 lines summarizing the core experience.",
  "emotion": "Emoji followed by emotion (e.g. '😡 Frustrated', '😍 Delighted', '😐 Neutral')",
  "rootCause": "One sentence explaining the primary reason for the rating.",
  "detectedCategories": ["Category1", "Category2"],
  "keywords": ["keyword1", "keyword2"],
  "businessImpact": {
    "level": "Critical|High|Medium|Low",
    "explanation": "Why this matters to the business."
  },
  "urgency": "High|Normal|Low",
  "recommendation": ["Actionable bullet 1", "Actionable bullet 2", "Actionable bullet 3"],
  "confidence": <number 0-100>
}
2. Be objective, precise, and actionable. Do not blame the customer.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Feedback text: "${text}"` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const rawJson = completion.choices[0]?.message?.content || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      console.error("JSON parse error:", e);
      parsed = {
        executiveSummary: "Failed to parse AI insights.",
        emotion: "❓ Unknown",
        rootCause: "Parsing error.",
        detectedCategories: [],
        keywords: [],
        businessImpact: { level: "Low", explanation: "Error" },
        urgency: "Normal",
        recommendation: [],
        confidence: 0
      };
    }

    const finalPayload = {
      text: String(text).slice(0, 1999), 
      executiveSummary: parsed.executiveSummary || "",
      emotion: parsed.emotion || "😐 Neutral",
      rootCause: parsed.rootCause || "",
      detectedCategories: Array.isArray(parsed.detectedCategories) ? parsed.detectedCategories : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      businessImpact: parsed.businessImpact || { level: "Medium", explanation: "" },
      urgency: parsed.urgency || "Normal",
      recommendation: Array.isArray(parsed.recommendation) ? parsed.recommendation : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 80,
      // Keep legacy fields for backward compatibility:
      sentiment: (parsed.emotion || '').includes('Frustrated') || (parsed.emotion || '').includes('😡') ? 'negative' : 'neutral',
      score: rating ? rating * 20 : 50,
      topics: Array.isArray(parsed.detectedCategories) ? parsed.detectedCategories : [],
    };

    res.json({ ...finalPayload, savedDocId: null, serverSaved: false });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze feedback" });
  }
};
