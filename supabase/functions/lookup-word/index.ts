import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function incrementUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string | null,
  ip: string,
  today: string,
) {
  if (userId) {
    const { data: usage } = await supabase
      .from("daily_usage")
      .select("search_count")
      .eq("user_id", userId)
      .eq("search_date", today)
      .maybeSingle();

    if (usage) {
      await supabase
        .from("daily_usage")
        .update({ search_count: usage.search_count + 1 })
        .eq("user_id", userId)
        .eq("search_date", today);
    } else {
      await supabase
        .from("daily_usage")
        .insert({ user_id: userId, search_date: today, search_count: 1 });
    }
  } else {
    const { data: usage } = await supabase
      .from("daily_usage")
      .select("search_count")
      .eq("user_ip", ip)
      .eq("search_date", today)
      .is("user_id", null)
      .maybeSingle();

    if (usage) {
      await supabase
        .from("daily_usage")
        .update({ search_count: usage.search_count + 1 })
        .eq("user_ip", ip)
        .eq("search_date", today)
        .is("user_id", null);
    } else {
      await supabase
        .from("daily_usage")
        .insert({ user_ip: ip, search_date: today, search_count: 1 });
    }
  }
}

async function getUsageCount(
  supabase: ReturnType<typeof createClient>,
  userId: string | null,
  ip: string,
  today: string,
): Promise<number> {
  if (userId) {
    const { data: usage } = await supabase
      .from("daily_usage")
      .select("search_count")
      .eq("user_id", userId)
      .eq("search_date", today)
      .maybeSingle();
    return usage?.search_count ?? 0;
  } else {
    const { data: usage } = await supabase
      .from("daily_usage")
      .select("search_count")
      .eq("user_ip", ip)
      .eq("search_date", today)
      .is("user_id", null)
      .maybeSingle();
    return usage?.search_count ?? 0;
  }
}

function buildPromptJa(trimmedWord: string): string {
  return `You are a Korean language dictionary for Japanese-speaking learners. The user entered "${trimmedWord}".

STEP 1 – Detect input language and find the Korean word:
- If the input is Korean (Hangul), use it directly as the target Korean word.
- If the input is Japanese, English, or any other language, identify the most appropriate Korean (한국어) equivalent word and use that as the target.

STEP 2 – Generate a complete Korean word dictionary entry. ALL of the following rules are MANDATORY:
- "basic.word" = the target Korean word in Hangul (NEVER Japanese/English/other)
- "basic.meaning" = meaning written in 日本語（複数あればカンマ区切り）
- "basic.pronunciation" = katakana reading of the Korean word (e.g. トゥギョプタ). ALWAYS provide this.
- "basic.romanization" = romanized Korean pronunciation
- "basic.partOfSpeech" = written in 日本語（名詞/動詞/形容詞/副詞/etc）
- All conjugation values = Korean conjugation forms in Hangul
- "grammar[].pattern" and "grammar[].example" = Korean
- "grammar[].exampleRomanization" = romanized Korean reading of the example sentence (e.g. tteugeowoyo)
- "grammar[].explanation" and "grammar[].translation" = 日本語
- "phrases[].phrase" = Korean
- "phrases[].phraseRomanization" = romanized Korean reading of the phrase (e.g. tteugeowoyo)
- "phrases[].translation" and "phrases[].scene" = 日本語
- "culture.note" = 日本語 (about 200 chars, 文化的な背景やニュアンスの概要)
- "culture.nativeExpressions" = array of 3 objects: ネイティブがよく使うリアルな表現・スラング。各オブジェクトは { "expression": "韓国語表現", "meaning": "日本語の意味", "usage": "日本語でどんな場面で使うか" }
- "culture.commonMistakes" = array of 2 objects: 日本人が間違いやすいポイント。各オブジェクトは { "mistake": "日本人がよくする間違い（日本語）", "correction": "正しい表現や使い方（日本語）", "explanation": "なぜ間違いやすいかの解説（日本語）" }
- "culture.conversations" = array of 2-3 objects: 実際の会話例。各オブジェクトは { "situation": "場面説明（日本語）", "lines": ["韓国語のセリフ1", "韓国語のセリフ2", ...], "translation": ["日本語訳1", "日本語訳2", ...] }
- "culture.pronunciationTips" = array of 2 strings: 発音のコツ（日本語で記述）
- "related[].word" = Korean (Hangul)
- "related[].meaning" and "related[].relation" = 日本語（関係性：類義語/対義語/関連語）

Return this JSON:
{
  "basic": {
    "word": "한국어 단어 (한글)",
    "meaning": "日本語の意味（複数あればカンマ区切り）",
    "pronunciation": "カタカナ読み",
    "romanization": "ローマ字表記",
    "partOfSpeech": "品詞（名詞/動詞/形容詞/副詞/etc）",
    "level": "TOPIK級（1-6、推定）"
  },
  "conjugation": {
    "haeyoForm": "해요体",
    "habnidaForm": "합니다体",
    "panmalForm": "반말",
    "negativeHaeyo": "부정형(해요体)",
    "negativeHabnida": "부정형(합니다体)",
    "pastHaeyo": "과거형(해요体)",
    "pastHabnida": "과거형(합니다体)"
  },
  "grammar": [
    {
      "pattern": "韓国語の文法パターン",
      "explanation": "日本語の説明",
      "example": "韓国語の例文",
      "exampleRomanization": "romanized Korean reading",
      "translation": "日本語の訳"
    }
  ],
  "phrases": [
    {
      "phrase": "韓国語フレーズ",
      "phraseRomanization": "romanized Korean reading",
      "translation": "日本語の訳",
      "scene": "日本語での場面説明"
    }
  ],
  "culture": {
    "note": "日本語で200文字程度の文化・ニュアンス説明",
    "nativeExpressions": [
      { "expression": "韓国語のリアル表現", "meaning": "日本語の意味", "usage": "使用場面（日本語）" }
    ],
    "commonMistakes": [
      { "mistake": "よくある間違い", "correction": "正しい表現", "explanation": "解説" }
    ],
    "conversations": [
      { "situation": "場面（日本語）", "lines": ["韓国語セリフ1", "韓国語セリフ2"], "translation": ["日本語訳1", "日本語訳2"] }
    ],
    "pronunciationTips": ["発音のコツ1（日本語）", "発音のコツ2（日本語）"]
  },
  "related": [
    {
      "word": "関連韓国語単語（ハングル）",
      "meaning": "日本語の意味",
      "relation": "関係性（類義語/対義語/関連語）"
    }
  ]
}

Return ONLY valid JSON. No markdown, no explanation. Provide 3 grammar patterns, 4 phrases, and 5 related words.`;
}

function buildPromptKo(trimmedWord: string): string {
  return `You are a Japanese language dictionary for Korean-speaking learners. The user entered "${trimmedWord}".

STEP 1 – Detect input language and find the Japanese word:
- If the input is Japanese (hiragana/katakana/kanji), use it directly as the target Japanese word.
- If the input is Korean, English, or any other language, identify the most appropriate Japanese (日本語) equivalent word and use that as the target.

STEP 2 – Generate a complete Japanese word dictionary entry. ALL of the following rules are MANDATORY:
- "basic.word" = the target Japanese word (kanji with furigana or hiragana). NEVER Korean/English/other.
- "basic.meaning" = meaning written in 한국어 (여러 개면 쉼표로 구분)
- "basic.pronunciation" = hiragana reading of the Japanese word (e.g. たべる). ALWAYS provide this.
- "basic.romanization" = romanized Japanese pronunciation (e.g. taberu)
- "basic.partOfSpeech" = written in 한국어 (명사/동사/い형용사/な형용사/부사/etc)
- "basic.level" = JLPT level estimate (N5-N1)
- All conjugation values = Japanese conjugation forms
- "grammar[].pattern" = 한국어로 문법 패턴 이름을 작성 (예: "명사 + を + 동사", "~てから + 동사"). 일본어 조사·활용은 그대로 두되 설명 부분은 한국어로.
- "grammar[].example" = Japanese example sentence
- "grammar[].exampleReading" = full hiragana reading of the example sentence (e.g. あたらしいです)
- "grammar[].exampleRomanization" = romanized Japanese reading of the example sentence (e.g. atarashii desu)
- "grammar[].explanation" and "grammar[].translation" = 한국어
- "phrases[].phrase" = Japanese
- "phrases[].phraseReading" = full hiragana reading of the phrase (e.g. あたらしいです)
- "phrases[].phraseRomanization" = romanized Japanese reading of the phrase (e.g. atarashii desu)
- "phrases[].translation" and "phrases[].scene" = 한국어
- "culture.note" = 한국어 (약 200자의 문화·뉘앙스 설명)
- "culture.nativeExpressions" = array of 3 objects: 원어민이 자주 쓰는 리얼한 표현·슬랭. 각 오브젝트는 { "expression": "일본어 표현", "meaning": "한국어 뜻", "usage": "사용 장면 (한국어)" }
- "culture.commonMistakes" = array of 2 objects: 한국인이 틀리기 쉬운 포인트. 각 오브젝트는 { "mistake": "자주 하는 실수 (한국어)", "correction": "올바른 표현 (한국어)", "explanation": "왜 틀리기 쉬운지 해설 (한국어)" }
- "culture.conversations" = array of 2-3 objects: 실제 회화 예시. 각 오브젝트는 { "situation": "장면 설명 (한국어)", "lines": ["일본어 대사1", "일본어 대사2", ...], "translation": ["한국어 번역1", "한국어 번역2", ...] }
- "culture.pronunciationTips" = array of 2 strings: 발음 팁 (한국어로 기술)
- "related[].word" = Japanese (kanji/hiragana)
- "related[].meaning" and "related[].relation" = 한국어 (관계: 유의어/반의어/관련어)

Return this JSON:
{
  "basic": {
    "word": "日本語の単語（漢字・ひらがな）",
    "meaning": "한국어 뜻 (쉼표로 구분)",
    "pronunciation": "ひらがな読み",
    "romanization": "ローマ字表記",
    "partOfSpeech": "품사 (한국어)",
    "level": "JLPT N5-N1"
  },
  "conjugation": {
    "masuForm": "ます形",
    "teForm": "て形",
    "dictionaryForm": "辞書形",
    "naiForm": "ない形",
    "taForm": "た形",
    "potentialForm": "可能形",
    "volitionalForm": "意志形"
  },
  "grammar": [
    {
      "pattern": "한국어 문법 패턴명 (예: 명사 + を + 동사)",
      "explanation": "한국어 설명",
      "example": "日本語の例文",
      "exampleReading": "ひらがな読み",
      "exampleRomanization": "romaji reading",
      "translation": "한국어 번역"
    }
  ],
  "phrases": [
    {
      "phrase": "日本語フレーズ",
      "phraseReading": "ひらがな読み",
      "phraseRomanization": "romaji reading",
      "translation": "한국어 번역",
      "scene": "한국어 장면 설명"
    }
  ],
  "culture": {
    "note": "한국어로 200자 정도의 문화·뉘앙스 설명",
    "nativeExpressions": [
      { "expression": "일본어 리얼 표현", "meaning": "한국어 뜻", "usage": "사용 장면 (한국어)" }
    ],
    "commonMistakes": [
      { "mistake": "자주 하는 실수", "correction": "올바른 표현", "explanation": "해설" }
    ],
    "conversations": [
      { "situation": "장면 (한국어)", "lines": ["일본어 대사1", "일본어 대사2"], "translation": ["한국어 번역1", "한국어 번역2"] }
    ],
    "pronunciationTips": ["발음 팁1 (한국어)", "발음 팁2 (한국어)"]
  },
  "related": [
    {
      "word": "관련 일본어 단어",
      "meaning": "한국어 뜻",
      "relation": "관계 (유의어/반의어/관련어)"
    }
  ]
}

Return ONLY valid JSON. No markdown, no explanation. Provide 3 grammar patterns, 4 phrases, and 5 related words.`;
}

function buildPrompt(trimmedWord: string, lang: string): string {
  return lang === "ko"
    ? buildPromptKo(trimmedWord)
    : buildPromptJa(trimmedWord);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !anonKey) {
      console.error("Missing env vars:", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasAnonKey: !!anonKey,
      });
      return jsonResponse(
        { error: "サーバー設定エラーが発生しました。" },
        500,
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "リクエストの形式が不正です。" }, 400);
    }

    const word = body.word;
    const clientIp = body.clientIp;
    const lang = body.lang === "ko" ? "ko" : "ja";

    if (!word || typeof word !== "string" || word.trim().length === 0) {
      return jsonResponse({ error: "単語を入力してください" }, 400);
    }

    const trimmedWord = word.trim();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let isPremium = false;

    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        if (token !== anonKey) {
          const userClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
          });
          const {
            data: { user },
          } = await userClient.auth.getUser();
          if (user) {
            userId = user.id;
            const { data: sub } = await supabase
              .from("subscriptions")
              .select("status, current_period_end")
              .eq("user_id", userId)
              .eq("status", "active")
              .maybeSingle();
            if (
              sub &&
              sub.current_period_end &&
              new Date(sub.current_period_end) > new Date()
            ) {
              isPremium = true;
            }
          }
        }
      } catch (authErr) {
        console.error("Auth check failed (non-fatal):", authErr);
      }
    }

    const ip = (typeof clientIp === "string" && clientIp) || "unknown";
    const today = new Date().toISOString().split("T")[0];

    const GUEST_LIMIT = 3;
    const FREE_USER_LIMIT = 10;
    const disableLimit = Deno.env.get("DISABLE_USAGE_LIMIT") === "true";
    const tier = isPremium ? "premium" : userId ? "free" : "guest";
    const effectiveLimit = tier === "premium" ? Infinity : tier === "free" ? FREE_USER_LIMIT : GUEST_LIMIT;

    if (tier !== "premium" && !disableLimit) {
      const currentCount = await getUsageCount(supabase, userId, ip, today);
      if (currentCount >= effectiveLimit) {
        const errorMsg =
          tier === "guest"
            ? lang === "ko"
              ? "오늘의 검색 횟수(3회)에 도달했습니다. 로그인하면 하루 10회까지 검색할 수 있습니다."
              : "本日の検索回数（3回）に達しました。ログインすると1日10回まで検索できます。"
            : lang === "ko"
              ? "오늘의 무료 검색 횟수(10회)에 도달했습니다. 유료 플랜으로 무제한 검색하세요."
              : "本日の無料検索回数（10回）に達しました。有料プランで無制限に検索できます。";
        return jsonResponse(
          {
            error: errorMsg,
            tier,
            usage: { count: currentCount, limit: effectiveLimit },
          },
          429,
        );
      }
    }

    const { data: cached, error: cacheErr } = await supabase
      .from("word_cache")
      .select("result")
      .eq("word", trimmedWord)
      .eq("lang", lang)
      .maybeSingle();

    if (cacheErr) {
      console.error("Cache lookup error:", cacheErr);
    }

    if (cached) {
      try {
        await supabase.rpc("increment_search_count", {
          target_word: trimmedWord,
        });
      } catch {
        // non-critical
      }

      if (tier !== "premium") {
        await incrementUsage(supabase, userId, ip, today);
        const newCount = await getUsageCount(supabase, userId, ip, today);
        return jsonResponse({
          data: cached.result,
          cached: true,
          isPremium,
          tier,
          usage: { count: newCount, limit: effectiveLimit },
        });
      }

      return jsonResponse({ data: cached.result, cached: true, isPremium, tier });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      console.error("ANTHROPIC_API_KEY is not set");
      return jsonResponse(
        { error: "API設定エラー。管理者にお問い合わせください。" },
        500,
      );
    }

    const prompt = buildPrompt(trimmedWord, lang);

    const requestBody = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const requestHeaders = {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    };

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: requestHeaders,
        body: requestBody,
      });
    } catch (fetchErr) {
      console.error("Anthropic API fetch failed:", fetchErr);
      return jsonResponse(
        { error: "AI APIへの接続に失敗しました。" },
        502,
      );
    }

    if (response.status === 529) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: requestHeaders,
          body: requestBody,
        });
      } catch (retryErr) {
        console.error("Anthropic API retry failed:", retryErr);
        return jsonResponse(
          { error: "AI APIへの接続に失敗しました。" },
          502,
        );
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error status:", response.status);
      console.error("Anthropic API error body:", errText);
      return jsonResponse(
        {
          error:
            "AI応答エラーが発生しました。しばらくしてからお試しください。",
        },
        502,
      );
    }

    const aiResult = await response.json();
    const textContent = aiResult.content?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(textContent);
    } catch {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          console.error("JSON extraction parse failed:", jsonMatch[0]);
          return jsonResponse(
            { error: "AI応答の解析に失敗しました。" },
            500,
          );
        }
      } else {
        console.error("No JSON found in AI response:", textContent);
        return jsonResponse(
          { error: "AI応答の解析に失敗しました。" },
          500,
        );
      }
    }

    const { error: upsertErr } = await supabase
      .from("word_cache")
      .upsert(
        {
          word: trimmedWord,
          lang,
          result: parsed,
          search_count: 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "word,lang" },
      );

    if (upsertErr) {
      console.error("Cache upsert error:", upsertErr);
    }

    if (tier !== "premium") {
      await incrementUsage(supabase, userId, ip, today);
      const newCount = await getUsageCount(supabase, userId, ip, today);
      return jsonResponse({
        data: parsed,
        cached: false,
        isPremium,
        tier,
        usage: { count: newCount, limit: effectiveLimit },
      });
    }

    return jsonResponse({ data: parsed, cached: false, isPremium, tier });
  } catch (err) {
    console.error("Edge function unhandled error:", err);
    return jsonResponse(
      { error: "サーバーエラーが発生しました。しばらくしてからお試しください。" },
      500,
    );
  }
});
