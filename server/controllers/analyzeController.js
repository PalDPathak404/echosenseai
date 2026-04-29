import Groq from "groq-sdk";
import fs from "fs";
import os from "os";
import path from "path";

export const analyzeFeedback = async (req, res) => {
  try {
    let { text, audioBase64 } = req.body;
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured in the .env file.");
    }

    const groq = new Groq({ apiKey });

    // Overwrite browser speech-to-text with actual backend Whisper processing if audio is provided
    if (audioBase64) {
      try {
        // Parse prefixed extension: "mp4|base64string..."
        const parts = audioBase64.split('|');
        let ext = 'webm';
        let pureBase64 = audioBase64;
        
        if (parts.length > 1) {
          ext = parts[0];
          pureBase64 = parts[1];
        }

        // Decode the base64 string
        const buffer = Buffer.from(pureBase64, 'base64');
        // Temporarily write the audio to the filesystem for Groq to read as a Filestream stream
        const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.${ext}`);
        fs.writeFileSync(tempFilePath, buffer);
        
        const transcription = await groq.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: "whisper-large-v3-turbo",
        });
        
        text = transcription.text;
        console.log("Whisper transcribed audio:", text);
        
        fs.unlinkSync(tempFilePath); // Cleanup
      } catch (whisperError) {
        console.error("Whisper Audio Transcription Error:", whisperError);
        // If whisper fails, safely fallback to whatever the browser gave us
      }
    }

    if (!text || text.trim() === 'No clear audio transcribed.') {
       return res.json({
          text: "No clear audio transcribed.",
          sentiment: "neutral",
          emotion: "neutral",
          score: 20,
          topics: []
       });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert customer experience analyzer. Extract the exact required fields based on the raw spoken text provided by the customer. Be objective and precise.\n\nCRITICAL AI RULES:\n1. IF the text is a short test, ambiguous, just a greeting (e.g. \"test\", \"hello\", \"testing microphone\"), or lacks strong negative words, YOU MUST classify sentiment and emotion as \"neutral\". Do NOT assume negative intent.\n2. You must respond ONLY with a strict JSON object matching this exact structure:\n{\n  \"sentiment\": \"positive|neutral|negative\",\n  \"emotion\": \"happy|frustrated|angry|neutral\",\n  \"score\": <number from 0 to 100>,\n  \"topics\": [\"topic1\", \"topic2\"]\n}"
        },
        {
          role: "user",
          content: `Feedback text: "${text}"`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const rawJson = completion.choices[0]?.message?.content || "{}";
    let parsed = { sentiment: "neutral", emotion: "neutral", score: 50, topics: [] };
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      console.error("JSON parse error:", e);
    }

    const validSentiments = ['positive', 'neutral', 'negative'];
    const validEmotions = ['happy', 'frustrated', 'angry', 'neutral'];

    const finalSentiment = String(parsed.sentiment || 'neutral').toLowerCase();
    const finalEmotion = String(parsed.emotion || 'neutral').toLowerCase();

    const finalPayload = {
      text: String(text).slice(0, 1999), 
      sentiment: validSentiments.includes(finalSentiment) ? finalSentiment : 'neutral',
      emotion: validEmotions.includes(finalEmotion) ? finalEmotion : 'neutral',
      score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
      topics: Array.isArray(parsed.topics) ? parsed.topics.map(t => String(t).slice(0, 50)).slice(0, 10) : []
    };

    console.log("SERVER OUTPUTTING JSON TO FRONTEND:", JSON.stringify(finalPayload, null, 2));

    res.json(finalPayload);
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze feedback" });
  }
};
