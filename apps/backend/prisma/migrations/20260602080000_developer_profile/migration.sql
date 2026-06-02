CREATE TABLE "DeveloperProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Kafeero Proferious',
    "title" TEXT NOT NULL DEFAULT 'Developer & Creator',
    "bio" TEXT NOT NULL DEFAULT 'Full-stack developer specialising in WhatsApp automation, AI integrations, and SaaS platforms.',
    "email" TEXT NOT NULL DEFAULT 'profy256@gmail.com',
    "phone" TEXT NOT NULL DEFAULT '+256740686937',
    "whatsapp" TEXT NOT NULL DEFAULT '256740686937',
    "location" TEXT NOT NULL DEFAULT 'Uganda, East Africa',
    "avatarUrl" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "services" JSONB NOT NULL DEFAULT '[]',
    "projects" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeveloperProfile_pkey" PRIMARY KEY ("id")
);

-- Seed the single default profile row
INSERT INTO "DeveloperProfile" ("id", "skills", "services", "projects")
VALUES (
  gen_random_uuid(),
  '["Node.js","Go","Java","Python","TypeScript","React","Next.js","PostgreSQL","Prisma","WhatsApp Automation","AI Integration","REST APIs","Docker","Tailwind CSS"]',
  '[{"icon":"🤖","title":"Custom AI Chatbot","desc":"Tailored AI assistant trained on your specific business data, products, and tone."},{"icon":"📦","title":"White-Label Setup","desc":"Deploy this platform under your own brand with your domain and company name."},{"icon":"🔗","title":"API & Integration","desc":"Connect WhatsApp automation to your existing CRM, e-commerce, or custom systems."},{"icon":"📊","title":"Analytics Dashboard","desc":"Custom reporting and analytics for your WhatsApp communication data."},{"icon":"🏢","title":"Enterprise Plan","desc":"Multi-account management, priority support, and custom features for large teams."}]',
  '[{"name":"KP WhatsApp Automation","desc":"Full-stack WhatsApp automation platform with AI-powered replies, keyword rules, multi-provider AI support, and real-time session management.","tech":["Next.js","Node.js","PostgreSQL","Baileys","OpenAI","Anthropic"],"link":"/"}]'
);
