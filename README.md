# QuoteForge

Калкулатор за оферти за български работилници — с регистрация, история на офертите, и запазени клиенти.

## Технологии
- **Next.js 16** (frontend + API routes в едно)
- **Supabase** (база данни PostgreSQL + автентикация)
- **Vercel** (хостинг, безплатен tier)

---

## Стъпка 1 — Създай Supabase проект

1. Отиди на **supabase.com** → Sign in with GitHub
2. New Project → избери име (напр. `quoteforge`), регион (Frankfurt е най-близо до България)
3. Изчакай ~2 минути проектът да се създаде
4. В лявото меню → **SQL Editor** → New Query
5. Отвори файла `supabase_schema.sql` от този проект, копирай **цялото** съдържание, паства го в SQL Editor, натисни **Run**
   - Това създава трите таблици (profiles, clients, quotes) и сигурностните правила
6. Отиди в **Settings → API** (в лявото меню)
   - Копирай **Project URL** → това е `NEXT_PUBLIC_SUPABASE_URL`
   - Копирай **anon public** key → това е `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Стъпка 2 — Качи кода в GitHub

```bash
cd quoteforge-app
git init
git add .
git commit -m "Initial QuoteForge app"
```

Създай нов repo в твоя GitHub профил (github.com/new), после:

```bash
git remote add origin https://github.com/ТВОЕ_ПОТРЕБИТЕЛСКО_ИМЕ/quoteforge.git
git branch -M main
git push -u origin main
```

## Стъпка 3 — Деплой във Vercel

1. Отиди на **vercel.com** → Sign in with GitHub
2. **Add New → Project** → избери repo `quoteforge`
3. В **Environment Variables** секцията добави:
   - `NEXT_PUBLIC_SUPABASE_URL` = (стойността от Стъпка 1)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (стойността от Стъпка 1)
4. Натисни **Deploy**
5. След ~1 минута получаваш истински живия линк (нещо като `quoteforge.vercel.app`)

## Стъпка 4 — Тествай

1. Отвори линка → ще те препрати към `/signup`
2. Регистрирай се с имейл и парола
3. Supabase ще изпрати имейл за потвърждение — провери пощата (включително spam)
4. След потвърждение → влизаш в `/dashboard` → калкулаторът работи на живо, с реална база данни

---

## Локално развитие (по желание)

```bash
npm install
cp .env.local.example .env.local
# попълни истинските си Supabase ключове в .env.local
npm run dev
```

Отваря на `http://localhost:3000`

---

## Структура на проекта

```
src/
  app/
    login/          — страница за вход
    signup/          — страница за регистрация
    auth/callback/   — обработка на имейл потвърждение
    dashboard/       — основният калкулатор (защитен, изисква вход)
    api/
      quotes/        — CRUD за оферти
      clients/       — CRUD за клиенти
      profile/       — име на работилницата
  lib/supabase/      — връзка с базата данни (client + server)
  middleware.ts      — поддържа автентикационната сесия
supabase_schema.sql  — SQL схема за базата данни
```

## Какво следва (не е включено още)
- Плащания (Stripe) — за абонаментен модел
- PDF износ (в момента сваля `.txt` файл вместо PDF — добавимо по-късно)
- Собствен домейн вместо `*.vercel.app`
