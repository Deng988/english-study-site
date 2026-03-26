const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk.toString();
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function cleanSubtitleText(input) {
  const timestampArrowPattern =
    /^(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{3}$/;
  const leadingTimestampPattern =
    /^\s*(?:(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?|\d+(?:\.\d+)?)\s*(?:秒钟?|分钟|小时)?\s*/i;

  const lines = input.replace(/\r/g, "").split("\n");
  const cleanedLines = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (/^\d+$/.test(line)) continue;
    if (timestampArrowPattern.test(line)) continue;

    while (leadingTimestampPattern.test(line)) {
      line = line.replace(leadingTimestampPattern, "").trim();
    }

    line = line.replace(/^\[[^\]]+\]\s*/g, "").trim();
    line = line.replace(/\s+/g, " ").trim();

    if (!line) continue;
    if (/^\[[^\]]+\]$/.test(line)) continue;
    cleanedLines.push(line);
  }

  const merged = [];
  for (const line of cleanedLines) {
    if (merged[merged.length - 1] !== line) {
      merged.push(line);
    }
  }

  return merged.join(" ").replace(/\s+/g, " ").trim();
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function tokenize(text) {
  return text.match(/[A-Za-z][A-Za-z'-]*/g) || [];
}

function simpleMeaningForWord(word) {
  const dictionary = {
    conversation: "对话",
    influential: "有影响力的",
    civilization: "文明",
    powering: "驱动",
    attributed: "归因于",
    brilliant: "杰出的",
    decisions: "决定",
    powerful: "强大的",
    improve: "提高",
    genuinely: "真诚地",
    emotionally: "情绪上地",
    vocabulary: "词汇",
    grammar: "语法",
    authentic: "真实的",
    effective: "有效的",
    opportunity: "机会",
    progress: "进展",
    efforts: "努力",
    democratizing: "普及化",
    proportionally: "按比例地",
    psychologically: "心理上地",
    optimizer: "优化器",
    efficiency: "效率",
    equivalent: "相当的",
    scaling: "扩展",
    deploy: "部署",
    modeling: "建模",
    introduction: "介绍"
  };

  const lower = word.toLowerCase();
  if (dictionary[lower]) return dictionary[lower];
  if (lower.endsWith("tion") || lower.endsWith("sion")) return "某种过程/结果";
  if (lower.endsWith("ment")) return "某种结果/状态";
  if (lower.endsWith("ness")) return "某种性质/状态";
  if (lower.endsWith("ity")) return "某种特性";
  if (lower.endsWith("ing")) return "正在... / ...过程";
  if (lower.endsWith("ed")) return "...了 / 被...的";
  if (lower.endsWith("ly")) return "...地";
  if (lower.endsWith("ous")) return "...的";
  if (lower.endsWith("ive")) return "...性的";
  if (lower.endsWith("able")) return "可以...的";
  return "较复杂词";
}

function isLikelyStudyWord(word) {
  const lower = word.toLowerCase();
  const stopwords = new Set([
    "about",
    "after",
    "again",
    "almost",
    "always",
    "anybody",
    "anyone",
    "anything",
    "because",
    "before",
    "better",
    "cloud",
    "could",
    "different",
    "everyone",
    "everything",
    "example",
    "forward",
    "great",
    "hello",
    "history",
    "important",
    "intelligence",
    "introduction",
    "latest",
    "local",
    "maybe",
    "models",
    "nothing",
    "open",
    "opportunity",
    "people",
    "progress",
    "public",
    "really",
    "servers",
    "should",
    "single",
    "something",
    "thank",
    "there",
    "these",
    "thing",
    "those",
    "through",
    "today",
    "trying",
    "using",
    "video",
    "where",
    "world",
    "would"
  ]);

  if (stopwords.has(lower)) return false;
  if (lower.length < 8) return false;
  if (/^(uh|yeah|okay|gonna|wanna|kinda|sorta)$/i.test(lower)) return false;
  return true;
}

function createFallbackAnalysis(text) {
  const cleanedText = cleanSubtitleText(text);
  const sentences = splitSentences(cleanedText);
  const words = tokenize(cleanedText);
  const seenWords = new Set();
  const candidateVocabulary = [];

  for (const sentence of sentences) {
    const selected = tokenize(sentence)
      .filter((word) => isLikelyStudyWord(word))
      .sort((a, b) => b.length - a.length)[0];

    if (!selected) continue;
    const lower = selected.toLowerCase();
    if (seenWords.has(lower)) continue;

    seenWords.add(lower);
    candidateVocabulary.push({
      word: selected,
      level: selected.length >= 11 ? "C1" : "B2",
      meaning: simpleMeaningForWord(selected),
      sentence
    });
  }

  const longSentences = sentences
    .filter((sentence) => tokenize(sentence).length >= 12)
    .slice(0, 4)
    .map((sentence) => ({
      sentence,
      translation: "这里建议接入模型后生成自然中文翻译。",
      structure: "建议拆分主干、从句、连接词和修饰成分。",
      notes: "这类长句往往包含从句、并列结构或抽象表达，适合逐块理解。"
    }));

  const grammar = [];
  if (/\b(if|unless|provided that)\b/i.test(cleanedText)) {
    grammar.push({
      point: "条件句",
      example: sentences.find((sentence) => /\b(if|unless|provided that)\b/i.test(sentence)) || "",
      explanation: "用来表达条件与结果的关系，学习时重点看条件从句和主句时态的搭配。"
    });
  }
  if (/\b(that|which|who|where|when)\b/i.test(cleanedText)) {
    grammar.push({
      point: "从句结构",
      example: sentences.find((sentence) => /\b(that|which|who|where|when)\b/i.test(sentence)) || "",
      explanation: "字幕里常出现定语从句或宾语从句，拆句时先找到主句，再判断从句作用。"
    });
  }
  if (/\b(has|have|had)\s+\w+(ed|en)\b/i.test(cleanedText)) {
    grammar.push({
      point: "完成时",
      example: sentences.find((sentence) => /\b(has|have|had)\s+\w+(ed|en)\b/i.test(sentence)) || "",
      explanation: "完成时强调动作与当前状态或另一时间点的关联。"
    });
  }
  if (grammar.length === 0) {
    grammar.push({
      point: "句子主干识别",
      example: sentences[0] || "",
      explanation: "第一版先默认建议从主语、谓语、宾语切入，再看修饰成分，适合大多数字幕材料。"
    });
  }

  return {
    mode: "fallback",
    cleanedText,
    sentenceLines: sentences,
    translation: "",
    vocabulary: candidateVocabulary,
    grammar,
    sentenceBreakdown: longSentences,
    summary: `共识别 ${sentences.length} 句、约 ${words.length} 个单词。建议先看全文，再重点学习右侧长词和长句。`
  };
}

async function createOpenAIAnalysis(text) {
  const cleanedText = cleanSubtitleText(text);
  const prompt = `
You are an English learning assistant for Chinese learners.
Analyze the article and return strict JSON only.

Required JSON shape:
{
  "mode": "ai",
  "cleanedText": "string",
  "translation": "string",
  "vocabulary": [
    {
      "word": "string",
      "level": "A1|A2|B1|B2|C1|C2",
      "meaning": "string",
      "explanation": "string"
    }
  ],
  "grammar": [
    {
      "point": "string",
      "example": "string",
      "explanation": "string"
    }
  ],
  "sentenceBreakdown": [
    {
      "sentence": "string",
      "translation": "string",
      "structure": "string",
      "notes": "string"
    }
  ],
  "summary": "string"
}

Rules:
- Respond in Simplified Chinese except for the original English examples.
- Pick relatively advanced vocabulary worth learning.
- Focus on grammar and sentence structures that help learning.
- Keep the explanation concise but useful.
- Use the cleaned text exactly as the cleanedText field.

Article:
${cleanedText}
`.trim();

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const outputText = (data.output_text || "").trim();
  return JSON.parse(outputText);
}

function serveStatic(req, res) {
  const safePath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream"
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (req.url === "/api/health" && req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      port: PORT,
      aiEnabled: Boolean(OPENAI_API_KEY)
    });
    return;
  }

  if (req.url === "/api/analyze" && req.method === "POST") {
    try {
      const rawBody = await readBody(req);
      const body = JSON.parse(rawBody || "{}");
      const text = (body.text || "").trim();

      if (!text) {
        sendJson(res, 400, { error: "请输入字幕或文章内容。" });
        return;
      }

      const result = OPENAI_API_KEY
        ? await createOpenAIAnalysis(text)
        : createFallbackAnalysis(text);

      sendJson(res, 200, result);
      return;
    } catch (error) {
      const fallback = createFallbackAnalysis("");
      sendJson(res, 500, {
        error: error.message || "分析失败",
        fallback: {
          ...fallback,
          summary: "AI 分析失败，已保留本地兜底模式。请检查服务日志或 API 配置。"
        }
      });
      return;
    }
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`English study site is running at http://localhost:${PORT}`);
});
