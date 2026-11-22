# Deutschly Technical Documentation

Deutschly is a German learning web application built from the Arabic school textbook
"منهج اللغة الألمانية للصف الثالث الثانوي" (152 pages). Learners review the lesson
vocabulary, read the grammar, then work through the exercises with hints, review lists
and progress tracking.

Live at **https://deutschly.houssammoallem.com**

---

## 1. Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Framework | Next.js (App Router) | 14.2.18 |
| Language | TypeScript | 5.6.3 |
| UI | React | 18.3.1 |
| Styling | Tailwind CSS | 3.4.15 |
| ORM | Prisma | 5.22.0 |
| Database | SQLite | file, `code/prisma/dev.db` |
| Auth | JSON Web Token + bcryptjs | 9.0.2 / 2.4.3 |
| Icons | lucide-react | 0.460 |
| Runtime | Node.js | 20.20.2 |
| Word lookup | Python 3 + simplemma | 2.0.0 |

Node was installed system wide from NodeSource. Do not run the app on the Node bundled
with Hermes at `~/.hermes/node`, because a Hermes update would change the runtime under
the app.

---

## 2. Repository layout

```
/var/www/deutschly            repo root (GitHub hsmoallem/Deutschly, branch main)
  start.sh                    manual start helper, not used in production
  app.log                     runtime log
  docs/                       this documentation
  code/                       the Next.js application
    prisma/schema.prisma      data model
    prisma/dev.db             SQLite database
    scripts/seed.js           seeds book, lessons, exercises, questions
    scripts/enrich_database.py  authoritative content enrichment
    scripts/lookup_word.py    dictionary lookup helper
    scripts/requirements.txt  Python dependencies
    scripts/audit-against-pdf.js  content audit against the source PDF
    src/app/                  pages and API routes
    .env                      DATABASE_URL, JWT_SECRET, mode 600
```

---

## 3. Runtime

- systemd unit `deutschly.service`, enabled, `Restart=always`, `RestartSec=3`
- Working directory `/var/www/deutschly/code`, runs as user `houssam`
- Listens on `127.0.0.1:3100`. Port 3000 is Umami, 3001 is uptime-kuma
- nginx site `/etc/nginx/sites-available/deutschly.houssammoallem.com`
- DNS: Cloudflare proxied A record `deutschly` to the origin `13.140.134.57`
- TLS: wildcard Cloudflare Origin certificate at the origin, Cloudflare edge certificate
  in front. Certbot cannot be used because the firewall only admits Cloudflare IPs on
  80 and 443, so HTTP-01 validation against the origin cannot complete
- Logs: `/var/www/deutschly/app.log` and the journal identifier `deutschly`

Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are
set in the nginx site. The systemd unit sets `NoNewPrivileges`, `PrivateTmp` and
`ProtectSystem=full`.

---

## 4. Data model

Sixteen Prisma models. Content models:

| Model | Rows | Purpose |
| --- | --- | --- |
| `Book` | 1 | the source textbook |
| `Lesson` | 7 | 5 lessons plus a dictionary section and a student notes section |
| `Exercise` | 112 | groups of questions, typed `grammar_drill`, `reading` or `situations` |
| `Question` | 1,578 | question text, number, PDF page reference |
| `Choice` | 6,214 | answer options a to d |
| `VocabularyItem` | 1,840 | German word, article, plural, Arabic meaning, example |

Learner models: `User` (2 rows, `student` and `admin`), `UserSettings`, `Attempt`,
`UserQuestionState`, `ReviewItem`, `UserVocabulary`, `UserNote`, `AudioCache`,
`AnswerAuditLog`, `AiHint`.

Lessons and their page ranges:

| Lesson | Title | PDF pages |
| --- | --- | --- |
| Lektion 10 | Gesundheit, Krankheit & Befinden | 1 to 24 |
| Lektion 11 | In der Stadt unterwegs | 25 to 53 |
| Lektion 12 | Der Kunde ist König | 54 to 78 |
| Lektion 13 | Kleidung / Im Kaufhaus | 79 to 112 |
| Lektion 14 | Die Feste & Einladungen | 113 to 138 |
| قاموس الكلمات | General German Arabic Dictionary | 139 to 147 |
| ملاحظات الطالب | Student Practice and Notes | 148 to 152 |

`Exercise` has `onDelete: Cascade` from `Question`. **Never delete an exercise row to
tidy up**, because its questions are destroyed with it. Seed and enrichment scripts
update rows in place for this reason.

---

## 5. Content pipeline

Content is loaded in two mandatory steps. Skipping the second is the most common cause
of empty lesson sections.

```bash
cd /var/www/deutschly/code

# 1. schema, client and base seed
npx prisma generate
npx prisma db push --skip-generate
npm run db:seed

# 2. authoritative enrichment
python3 -c "import sys,types; sys.modules['fitz']=types.ModuleType('fitz'); exec(open('scripts/enrich_database.py').read())"
```

`enrich_database.py` holds the hand written grammar topics, the reading passages, the
situation section titles and the Arabic vocabulary corrections. It imports PyMuPDF
(`fitz`) but never calls it, so the stub above avoids installing a 20 MB dependency for
nothing. It must run from `code/` because it opens `prisma/dev.db` by relative path, and
it UPDATEs existing exercise rows by `pdfPageRef` without creating any, so the seed has
to run first.

---

## 6. Routes

Pages: `/`, `/login`, `/lessons`, `/lessons/[id]`, `/dictionary`, `/vocabulary`,
`/difficult`, `/wrong`, `/notes`.

API: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/lessons`,
`/api/lessons/[id]`, `/api/attempts/submit`, `/api/dictionary/search`,
`/api/dictionary/lookup`, `/api/vocabulary`, `/api/stats`, `/api/review-list`,
`/api/notes`, `/api/hints/generate`, `/api/audio`, `/api/admin/questions`.

---

## 7. Lesson page structure

`src/app/lessons/[id]/page.tsx` renders five sections selected by `activeTab`. The
intended study order is the tab order, and the page opens on the vocabulary:

1. `vocabulary`, Lektionswortschatz, the default landing tab
2. `grammar`, from `Lesson.grammarContent`, stored as JSON
3. `exercises`, Übungen & Fragen
4. `reading`, exercises typed `reading` or carrying `passageText`
5. `situations`, exercises typed `situations`

Every seeded exercise starts as `grammar_drill` with no `passageText`. Only
`enrich_database.py` sets the other types, which is why a missing enrichment step shows
zero reading texts and zero situations while the exercises tab looks complete.

---

## 8. Word lookup popup

Double clicking a German word posts to `/api/dictionary/lookup`, which shells out to
`scripts/lookup_word.py`. That script lemmatises with `simplemma` and queries
`VocabularyItem`. If `simplemma` is missing the endpoint returns `Lookup failed` and the
popup silently falls back to placeholder text, so install it for the system Python:

```bash
pip3 install --break-system-packages simplemma
```

---

## 9. Deploy and verify

```bash
cd /var/www/deutschly/code
npm run build
sudo systemctl restart deutschly

curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/
curl -s -o /dev/null -w "%{http_code}\n" https://deutschly.houssammoallem.com/
curl -s "https://deutschly.houssammoallem.com/api/lessons/1" | head -c 200
```

Always verify through the public URL, not only localhost, because Cloudflare and the
nginx layer sit in front of the app.

---

## 10. Source material

The textbook the content comes from is stored at

```
/home/houssam/deutschly-source/source_textbook.pdf
```

It is deliberately kept outside the git tree, because the repository is public and the
book is copyrighted. The content audit and every re-extraction depend on it, so it must be
present before running `scripts/pdf_page_index.py` or `scripts/verify_pdf.py`.

## 11. Backup and recovery

The whole state is the SQLite file plus `.env`.

```bash
cd /var/www/deutschly/code
cp prisma/dev.db "prisma/dev.db.bak-$(date +%Y%m%d-%H%M%S)"
```

`scripts/backup_db.sh` and `scripts/restore_db.sh` exist for this. A backup taken before
the content enrichment is kept at `prisma/dev.db.bak-20261122-234404`.

---

## 12. Git workflow

`main` is the only branch. The clone on the server has an HTTPS remote with no
credentials, so push with the SSH key that has write access:

```bash
cd /var/www/deutschly
git add <files>
git -c user.name="Houssam Moallem" -c user.email="moallem.houssam@gmail.com" commit -m "..."
GIT_SSH_COMMAND="ssh -i /home/houssam/.ssh/id_ed25519_vocab -o IdentitiesOnly=yes" \
  git push git@github.com:hsmoallem/Deutschly.git main
git ls-remote https://github.com/hsmoallem/Deutschly.git main
```

Do not commit `app.log`, `start.sh` or `prisma/dev.db.bak-*`.

---

## 13. Known issues

The content was audited against the source PDF and the defects repaired on 22 November
2026. See `CONTENT_AUDIT.md` for the evidence and the before and after figures.

1. **The book's Arabic grammar explanation is not reproduced.** Each grammar topic carries
   the book's German heading, rules and examples verbatim, plus an Arabic line pointing to
   the page. The book's Arabic cannot be extracted because its font maps glyphs to the wrong
   letters. Showing the grammar pages as page images is the faithful way to add it.
2. **Three vocabulary rows are extraction artefacts, not words**, such as `pp Hausaufgabe`.
   They should be dropped rather than corrected.
3. **A few passage tails carry a short fragment** where the extractor joined a passage to the
   next instruction. Cosmetic, and trimmed by re-running the passage map.
4. **The seeded accounts still use a default password** published in the public repository.
   `admin` is an administrator on a publicly reachable site. This is the most urgent
   outstanding item.
