import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../prisma';
import { aiConfigCache, platformConfigCache, PLATFORM_CONFIG_KEY } from '../cache';

const OPENAI_COMPATIBLE_BASE_URLS: Record<string, string | undefined> = {
  openai: undefined,
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  deepseek: 'https://api.deepseek.com',
  openrouter: 'https://openrouter.ai/api/v1',
};

export class AiService {
  private async callProvider(
    provider: string,
    model: string,
    apiKey: string,
    systemPrompt: string,
    userMessage: string
  ): Promise<string | null> {
    if (provider === 'anthropic') {
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });
      const block = msg.content[0];
      return block.type === 'text' ? block.text : null;
    }

    const baseURL = OPENAI_COMPATIBLE_BASE_URLS[provider];
    const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    return completion.choices[0]?.message?.content ?? null;
  }

  async handleIncomingMessage(
    businessId: string,
    remoteJid: string,
    messageText: string,
    isNewContact: boolean,
    allowAi: boolean,
    sendMessageCb: (text: string, source: string) => Promise<void>
  ) {
    const config = await aiConfigCache.getOrLoad(businessId, () =>
      prisma.aiConfig.findUnique({ where: { businessId } }),
    );
    if (!config) {
      console.log(`No AiConfig for business ${businessId} — nothing to auto-reply with.`);
      return;
    }

    // 1. Send greeting for brand-new contacts
    if (isNewContact && config.greetingEnabled && config.greetingMessage) {
      await sendMessageCb(config.greetingMessage, 'RULE');
      return;
    }

    if (!config.isActive) {
      console.log(`AiConfig for business ${businessId} is inactive — skipping rules/AI reply.`);
      return;
    }

    // 2. Keyword rules take precedence for both packages.
    const rules = Array.isArray(config.rules)
      ? (config.rules as Array<{ keyword: string; reply: string }>)
      : [];
    for (const rule of rules) {
      if (rule.keyword && messageText.toLowerCase().includes(rule.keyword.toLowerCase())) {
        await sendMessageCb(rule.reply, 'RULE');
        return;
      }
    }

    // 3. No keyword matched.
    if (allowAi) {
      // AI packages answer every message with the model.
      if (!config.prompt) return;
      const platformConfig = await platformConfigCache.getOrLoad(
        PLATFORM_CONFIG_KEY,
        async () =>
          (await prisma.platformConfig.findFirst({
            where: { isActive: true, isDefault: true },
          })) ?? (await prisma.platformConfig.findFirst({ where: { isActive: true } })),
      );

      if (!platformConfig) {
        console.log(`No active PlatformConfig — cannot generate AI reply for business ${businessId}.`);
        return;
      }

      try {
        const reply = await this.callProvider(
          platformConfig.provider,
          platformConfig.model,
          platformConfig.apiKey,
          config.prompt,
          messageText
        );
        if (reply) {
          await sendMessageCb(reply, 'AI');
        }
      } catch (error) {
        console.error(`AI error for business ${businessId}:`, error);
      }
      return;
    }

    // WhatsApp-bot package (no AI):
    if (rules.length === 0) {
      // No keywords set up → auto-reply to every message with the default text.
      const fallback =
        config.greetingMessage || 'Thanks for your message! We will get back to you shortly.';
      await sendMessageCb(fallback, 'RULE');
      return;
    }
    // Keywords were configured but none matched → stay silent (follow the keywords).
  }
}
