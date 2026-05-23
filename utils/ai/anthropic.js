const Anthropic = require('@anthropic-ai/sdk');

let client = null;
const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
};

const MODEL = process.env.AI_MODEL || 'claude-opus-4-7';

/**
 * Run a single Claude completion. Uses adaptive thinking for higher quality
 * on generative tasks. Returns plain text content joined across all text blocks.
 *
 * Falls back to a 503-style error if ANTHROPIC_API_KEY is not configured.
 */
exports.generate = async ({
  system,
  user,
  maxTokens = 4096,
  effort = 'medium',
  json = false,
}) => {
  const c = getClient();
  if (!c) {
    const err = new Error('AI provider not configured');
    err.statusCode = 503;
    throw err;
  }

  const message = await c.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: 'adaptive' },
    output_config: {
      effort,
      ...(json
        ? {
            format: {
              type: 'json_schema',
              schema: json,
            },
          }
        : {}),
    },
    system,
    messages: [{ role: 'user', content: user }],
  });

  const text = (message.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  return {
    text,
    usage: message.usage,
    parsed: json ? safeParse(text) : null,
  };
};

const safeParse = (txt) => {
  try {
    const match = txt.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : txt);
  } catch (e) {
    return null;
  }
};

exports.isConfigured = () => !!process.env.ANTHROPIC_API_KEY;
exports.model = MODEL;
