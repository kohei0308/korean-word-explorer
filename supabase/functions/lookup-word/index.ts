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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { word, clientIp } = await req.json();

    if (!word || typeof word !== "string" || word.trim().length === 0) {
      return jsonResponse({ error: "単語を入力してください" }, 400);
    }

    const trimmedWord = word.trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let isPremium = false;

    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    const ip = clientIp || "unknown";
    const today = new Date().toISOString().split("T")[0];

    const FREE_LIMIT = 3;
    const disableLimit = Deno.env.get("DISABLE_USAGE_LIMIT") === "true";

    if (!isPremium && !disableLimit) {
      const currentCount = await getUsageCount(supabase, userId, ip, today);
      if (currentCount >= FREE_LIMIT) {
        return jsonResponse(
          { error: "本日の無料検索回数（3回）に達しました。有料プランにアップグレードしてください。", usage: { count: currentCount, limit: FREE_LIMIT } },
          429,
        );
      }
    }

    const { data: cached } = await supabase
      .from("word_cache")
      .select("result")
      .eq("word", trimmedWord)
      .maybeSingle();

    if (cached) {
      await supabase
        .rpc("increment_search_count", { target_word: trimmedWord })
        .catch(() => {});

      if (!isPremium) {
        await incrementUsage(supabase, userId, ip, today);
        const newCount = await getUsageCount(supabase, userId, ip, today);
        return jsonResponse({ data: cached.result, cached: true, isPremium, usage: { count: newCount, limit: FREE_LIMIT } });
      }

      return jsonResponse({ data: cached.result, cached: true, isPremium });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return jsonResponse(
        { error: "API設定エラー。管理者にお問い合わせください。" },
        500,
      );
    }

    const prompt = `You are a Korean language expert helping Japanese learners. Given the Korean word "${trimmedWord}", return a JSON object with these exact keys (all text in Japanese except Korean examples):

{
  "basic": {
    "word": "${trimmedWord}",
    "meaning": "日本語の意味（複数あればカンマ区切り）",
    "pronunciation": "カタカナ読み",
    "romanization": "ローマ字表記",
    "partOfSpeech": "品詞（名詞/動詞/形容詞/副詞/etc）",
    "level": "TOPIK級（1-6、推定）"
  },
  "conjugation": {
    "haeyoForm": "해요体",
    "habnidaForm": "합니다体",
    "panmalForm": "パンマル（반말）",
    "negativeHaeyo": "否定形（해요体）",
    "negativeHabnida": "否定形（합니다体）",
    "pastHaeyo": "過去形（해요体）",
    "pastHabnida": "過去形（합니다体）"
  },
  "grammar": [
    {
      "pattern": "文法パターン（韓国語）",
      "explanation": "パターンの説明（日本語）",
      "example": "韓国語の例文",
      "translation": "日本語訳"
    }
  ],
  "phrases": [
    {
      "phrase": "実践フレーズ（韓国語）",
      "translation": "日本語訳",
      "scene": "使う場面の説明"
    }
  ],
  "culture": {
    "note": "この単語に関連する韓国文化・ニュアンスの説明（日本語で200文字程度）"
  },
  "related": [
    {
      "word": "関連する韓国語単語",
      "meaning": "日本語の意味",
      "relation": "関係性（類義語/対義語/関連語）"
    }
  ]
}

Return ONLY valid JSON. No markdown, no explanation. Provide 3 grammar patterns, 4 phrases, and 5 related words.`;

    const requestBody = JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const requestHeaders = {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    };

    let response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: requestHeaders,
      body: requestBody,
    });

    if (response.status === 529) {
      await new Promise((r) => setTimeout(r, 2000));
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: requestHeaders,
        body: requestBody,
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error status:", response.status);
      console.error("Anthropic API error body:", errText);
      return jsonResponse(
        {
          error:
            "AI応答エラーが発生しました。しばらくしてからお試しください。",
          debug: {
            status: response.status,
            statusText: response.statusText,
            body: errText,
          },
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
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return jsonResponse({ error: "AI応答の解析に失敗しました。" }, 500);
      }
    }

    await supabase
      .from("word_cache")
      .upsert(
        {
          word: trimmedWord,
          result: parsed,
          search_count: 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "word" },
      );

    if (!isPremium) {
      await incrementUsage(supabase, userId, ip, today);
      const newCount = await getUsageCount(supabase, userId, ip, today);
      return jsonResponse({ data: parsed, cached: false, isPremium, usage: { count: newCount, limit: FREE_LIMIT } });
    }

    return jsonResponse({ data: parsed, cached: false, isPremium });
  } catch (err) {
    console.error("Edge function error:", err);
    return jsonResponse({ error: "サーバーエラーが発生しました。" }, 500);
  }
});
