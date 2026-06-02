import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../prisma';

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
    sendMessageCb: (text: string, source: string) => Promise<void>
  ) {
    const config = await prisma.aiConfig.findFirst({ where: { businessId } });
    if (!config) return;

    // 1. Send greeting for brand-new contacts
    if (isNewContact && config.greetingEnabled && config.greetingMessage) {
      await sendMessageCb(config.greetingMessage, 'RULE');
      return;
    }

    if (!config.isActive) return;

    // 2. Check keyword rules first
    if (config.rules) {
      const rules = config.rules as Array<{ keyword: string; reply: string }>;
      for (const rule of rules) {
        if (messageText.toLowerCase().includes(rule.keyword.toLowerCase())) {
          await sendMessageCb(rule.reply, 'RULE');
          return;
        }
      }
    }

    // 3. Fall back to platform AI config (admin-managed)
    if (config.prompt) {
      const platformConfig = await prisma.platformConfig.findFirst({
        where: { isActive: true, isDefault: true },
      }) ?? await prisma.platformConfig.findFirst({ where: { isActive: true } });

      if (!platformConfig) return;

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
    }
  }
}
