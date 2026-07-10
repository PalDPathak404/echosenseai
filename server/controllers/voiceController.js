import Groq from "groq-sdk";
import fs from "fs";

/**
 * Controller to handle voice feedback analysis
 * Receive Audio -> Speech-to-Text (Groq Whisper) -> AI Analysis (Groq Llama) -> Return JSON
 */
export const analyzeVoiceFeedback = async (req, res) => {
  let tempFilePath = null;
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured in the server's environment." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required in 'audio' field." });
    }

    tempFilePath = req.file.path;
    const groq = new Groq({ apiKey });

    // 1. Speech-to-Text (STT) using Whisper
    console.log("Transcribing audio file:", tempFilePath);
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });

    const transcript = transcription.text || "";
    const rawLanguage = transcription.language || "english";
    const language = rawLanguage.charAt(0).toUpperCase() + rawLanguage.slice(1);

    // Compute confidence score from segment probabilities
    let confidence = 0.95; // default fallback
    if (transcription.segments && transcription.segments.length > 0) {
      let totalProb = 0;
      transcription.segments.forEach((seg) => {
        const logprob = seg.avg_logprob || 0;
        const prob = Math.min(1, Math.max(0, Math.exp(logprob)));
        totalProb += prob;
      });
      confidence = parseFloat((totalProb / transcription.segments.length).toFixed(2));
    }

    console.log(`Transcription: "${transcript}" (Lang: ${language}, Conf: ${confidence})`);

    // Clean up file immediately after transcription is done
    try {
      fs.unlinkSync(tempFilePath);
      tempFilePath = null;
    } catch (cleanupErr) {
      console.error("Temporary file cleanup error:", cleanupErr);
    }

    if (!transcript.trim()) {
      return res.status(422).json({
        error: "Could not transcribe audio. Please speak clearly.",
        transcript: "",
        language,
        confidence: 0
      });
    }

    // 2. AI Analysis of Transcribed text (specifically supporting Hinglish and Indian colloquial meanings)
    const systemPrompt = `You are an expert customer feedback analyzer for Indian businesses. You are analyzing customer voice feedback that has been transcribed.
Customers often use Indian conversational language, Hinglish (code-mixed Hindi and English), or pure English/Hindi.
Analyze the feedback text and return a strict JSON response.

URGENCY RULES:
- Critical: Food poisoning, Fire, Medical Emergency, Harassment, Violence
- High: Dirty Washroom, Bad Food, Rude Staff, Payment Issue
- Medium: Slow Service, Late Delivery, Billing Mistake
- Low: Suggestions, Compliments, General Feedback

Assign urgency based on these rules. Infer the meaning of mixed-language speech (Hinglish/Hindi/English) instead of relying only on exact keywords.
Example Hinglish meanings to infer:
- "Food toh accha tha but service bahut slow thi" -> Medium urgency (Slow Service), mixed sentiment.
- "Waiter ignore kar raha tha" -> High urgency (Rude Staff), negative sentiment.
- "Mujhe food fresh nahi laga" -> High urgency (Bad Food), negative sentiment.
- "Bill galat bana diya" -> Medium urgency (Billing Mistake), negative sentiment.
- "Taste mast tha" -> Low urgency (Compliments), positive sentiment.
- "Washroom bahut dirty tha" -> High urgency (Dirty Washroom), negative sentiment.
- "Staff polite tha" -> Low urgency (Compliments), positive sentiment.
- "Overall experience badhiya tha" -> Low urgency (General Feedback/Compliments), positive sentiment.

The JSON response must strictly match this structure:
{
  "sentiment": "positive | neutral | negative",
  "urgency": "low | medium | high | critical",
  "categories": ["CategoryName1", "CategoryName2"],
  "positive_points": ["point 1", "point 2"],
  "negative_points": ["point 1", "point 2"],
  "summary": "A brief, one-sentence summary of the customer feedback.",
  "manager_action": "A specific recommended action for the business manager.",
  "escalation_required": true | false,
  "escalation_reason": "Reason for escalation (leave empty if escalation_required is false)",
  "keywords": ["keyword1", "keyword2"]
}

Rules for JSON:
1. Return ONLY the JSON object. Do not wrap in markdown codeblocks (no \`\`\`json) or add extra text.
2. The categories should represent the main topics of complaint or praise (e.g., Food Quality, Customer Service, Hygiene, Billing, Staff Behavior, Facilities).
3. If escalation_required is true, provide a clear escalation_reason. Critical and High urgency feedbacks should generally require escalation.
`;

    console.log("Analyzing transcript with Llama...");
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Customer Feedback: "${transcript}"` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const rawAnalysis = completion.choices[0]?.message?.content || "{}";
    let analysis = {};
    try {
      analysis = JSON.parse(rawAnalysis);
    } catch (parseError) {
      console.error("Failed to parse LLM response:", rawAnalysis);
      analysis = {
        sentiment: "neutral",
        urgency: "medium",
        categories: ["General Feedback"],
        positive_points: [],
        negative_points: [],
        summary: transcript,
        manager_action: "Review customer feedback details manually.",
        escalation_required: false,
        escalation_reason: "",
        keywords: []
      };
    }

    // Merge transcription and analysis fields
    const responsePayload = {
      transcript,
      language,
      confidence,
      sentiment: analysis.sentiment || "neutral",
      urgency: analysis.urgency || "medium",
      categories: analysis.categories || [],
      positive_points: analysis.positive_points || [],
      negative_points: analysis.negative_points || [],
      summary: analysis.summary || transcript,
      manager_action: analysis.manager_action || "No action specified.",
      escalation_required: !!analysis.escalation_required,
      escalation_reason: analysis.escalation_reason || "",
      keywords: analysis.keywords || []
    };

    return res.json(responsePayload);
  } catch (error) {
    console.error("Voice Analysis Error:", error);
    // Cleanup files if error occurred before deletion
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error("Failed to clean up file after error:", err);
      }
    }
    return res.status(500).json({ error: error.message || "Failed to analyze voice feedback." });
  }
};
