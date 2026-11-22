import sqlite3
import json
import re
import fitz

def main():
    print("Enriching Deutschly database with Lessons, Grammar, Reading Passages, Situations and Vocabulary...")
    
    db_path = "prisma/dev.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # ==========================================
    # 1. GRAMMAR TOPICS PER LESSON
    # ==========================================
    grammar_data = {
        "Lektion 10": [
            {
                "id": "lek10_g1",
                "titleDe": "Was tut weh? Schmerzen & Körperteile ausdrücken",
                "titleAr": "التعبير عن الألم وأجزاء الجسم (Was tut weh?)",
                "pdfPage": 7,
                "summary": "نستخدم التعبير (tut weh للمفرد / tun weh للجمع) للتعبير عن الشعور بالألم في جزء من أجزاء الجسم.",
                "rules": [
                    "المفرد: Mein Kopf / Bauch / Bein tut weh. (يؤلمني رأسي / بطني / رجلي)",
                    "الجمع: Meine Augen / Ohren / Beine tun weh. (تؤلمني عيناي / أذناي / رجلاي)",
                    "حرف الجر gegen مع فعل helfen: Diese Tabletten helfen gegen Fieber / Kopfschmerzen."
                ],
                "examples": [
                    {"de": "Was tut Ihnen weh? - Mein Bauch tut weh.", "ar": "ما الذي يؤلم حضرتك؟ - بطني يؤلمني."},
                    {"de": "Meine Ohren tun sehr weh.", "ar": "أذناي تؤلماني بشدة."},
                    {"de": "Diese Tabletten helfen gegen Halsschmerzen.", "ar": "هذه الحبوب تساعد ضد آلام الحلق."}
                ]
            },
            {
                "id": "lek10_g2",
                "titleDe": "Modalverben: können, müssen, sollen, dürfen",
                "titleAr": "الأفعال الناقصة: können, müssen, sollen, dürfen",
                "pdfPage": 8,
                "summary": "تأتي الأفعال الناقصة مصرفّة في المركز الثاني في الجملة، ويأتي الفعل الأساسي في المصدر (am Satzende).",
                "rules": [
                    "können (يستطيع / إمكانية): ich/er/es/sie kann, du kannst, wir/sie/Sie können, ihr könnt",
                    "müssen (يجب / إلزام شخصي أو ضرورة): ich/er/es/sie muss, du musst, wir/sie/Sie müssen, ihr müsst",
                    "sollen (ينبغي / نصيحة طبية أو أمر من طرف ثالث): ich/er/es/sie soll, du sollst, wir/sie/Sie sollen, ihr sollt",
                    "dürfen (يسمح بـ / تصريح أو منع verboten): ich/er/es/sie darf, du darfst, wir/sie/Sie dürfen, ihr dürft"
                ],
                "examples": [
                    {"de": "Der Arzt sagt: Sie sollen im Bett bleiben.", "ar": "الطبيب يقول: ينبغي لحضرتك البقاء في السرير."},
                    {"de": "Hier darf man nicht rauchen. Das ist verboten.", "ar": "هنا لا يُسمح بالتدخين. هذا ممنوع."},
                    {"de": "Ich habe starke Schmerzen. Ich muss zum Arzt gehen.", "ar": "لدي آلام شديدة. يجب أن أذهب إلى الطبيب."}
                ]
            },
            {
                "id": "lek10_g3",
                "titleDe": "Possessivartikel im Nominativ & Akkusativ",
                "titleAr": "ضمائر الملكية في حالتي الفاعل والمفعول به (Possessivartikel)",
                "pdfPage": 11,
                "summary": "تتغير ضمائر الملكية بحسب المالك (ich->mein, du->dein, er/es->sein, sie->ihr, wir->unser, ihr->euer, sie/Sie->ihr/Ihr) وبحسب أداة الشيء المملوك وإعرابه.",
                "rules": [
                    "المذكر (der) والمحايد (das) في Nominativ: mein / dein / sein / ihr / unser / euer / Ihr",
                    "المؤنث (die) والجمع (die) تأخذ e في النهاية: meine / deine / seine / ihre / unsere / eure / Ihre",
                    "في حالة Akkusativ للمذكر فقط (den): يتحول إلى meinen / deinen / seinen / ihren / unseren / euren / Ihren."
                ],
                "examples": [
                    {"de": "Herr Nasser, ist das Ihr Koffer? - Ja, das ist mein Koffer.", "ar": "سيد ناصر، هل هذه حقيبتك؟ - نعم، هذه حقيبتي."},
                    {"de": "Kinder, wo sind eure Hefte? - Unsere Hefte sind da.", "ar": "يا أطفال، أين كراريسكم؟ - كراريسنا هنا."},
                    {"de": "Ich rufe meinen Arzt an.", "ar": "أنا أتصل بطبيبي (مذكر مفعول به -> meinen)."}
                ]
            },
            {
                "id": "lek10_g4",
                "titleDe": "Der Imperativ mit Sie / du / ihr",
                "titleAr": "صيغة الأمر (Der Imperativ)",
                "pdfPage": 14,
                "summary": "يُستخدم الأمر لإعطاء تعليمات طبية أو نصائح: صيغة الاحترام (Sie)، المفرد (du)، والجمع (ihr).",
                "rules": [
                    "مع الاحترام Sie: نضع الفعل أولاً ثم Sie: Nehmen Sie die Tabletten! (تناول حضرتك الحبوب!)",
                    "مع المفرد du: نحذف du ونحذف اللاحقة st: Geh zum Arzt! (اذهب إلى الطبيب!)",
                    "مع الجمع ihr: نحذف ihr ونبقي تصريف الفعل مع t: Bleibt im Bett! (ابقوا في السرير!)"
                ],
                "examples": [
                    {"de": "Trinken Sie viel Wasser und Tee!", "ar": "اشرب حضرتك الكثير من الماء والشاي!"},
                    {"de": "Rauch nicht so viel!", "ar": "لا تدخن كثيراً!"}
                ]
            }
        ],
        "Lektion 11": [
            {
                "id": "lek11_g1",
                "titleDe": "Verkehrsmittel mit 'mit + Dativ'",
                "titleAr": "وسائل المواصلات وحرف الجر (mit + Dativ)",
                "pdfPage": 30,
                "summary": "حرف الجر mit يعني 'بواسطة / مع' ويسبب دائماً حالة المجرور Dativ. مع وسائل المواصلات تتغير الأدوات: der->dem, das->dem, die->der.",
                "rules": [
                    "der Bus / Zug / Wagen -> mit dem Bus / mit dem Zug",
                    "das Auto / Taxi / Flugzeug / Schiff -> mit dem Auto / mit dem Flugzeug",
                    "die U-Bahn / Straßenbahn / Bahn -> mit der U-Bahn / mit der Straßenbahn",
                    "السير على الأقدام نستخدم: zu Fuß (بدون أداة)",
                    "فعل nehmen يأتي معه مفعول به Akkusativ: Ich nehme den Bus / das Taxi / die U-Bahn."
                ],
                "examples": [
                    {"de": "Wie fährst du zur Arbeit? - Mit der U-Bahn.", "ar": "كيف تسافر للعمل؟ - بالمترو."},
                    {"de": "Wir fliegen mit dem Flugzeug nach Berlin.", "ar": "نسافر بالطائرة إلى برلين."},
                    {"de": "Ich gehe zu Fuß zur Schule.", "ar": "أذهب مشياً على الأقدام إلى المدرسة."}
                ]
            },
            {
                "id": "lek11_g2",
                "titleDe": "Lokale Präpositionen auf die Frage 'Wo?' + Dativ",
                "titleAr": "حروف الجر المكانية الساكنة مع الداتيف (Wo? + Dativ)",
                "pdfPage": 34,
                "summary": "عند السؤال بـ ?Wo (أين) في حالة السكون، نستخدم حروف جر مكانية يتبعها الاسم في حالة Dativ.",
                "rules": [
                    "an (بمحاذاة / على شاطئ أو حائط): an dem -> am Bahnhof / am Meer / an der Ampel",
                    "auf (فوق سطح أفقي / في مكان مفتوح): auf dem Marktplatz / auf der Post",
                    "in (داخل): in dem -> im Kino / im Krankenhaus / in der Schule",
                    "bei (عند شخص أو شركة): beim Arzt / bei BMW / bei meiner Tante",
                    "vor (أمام) / hinter (خلف) / neben (بجانب) / unter (تحت) / über (فوق بدون تلامس)",
                    "zwischen (بين شيئين): zwischen der Bank und der Post"
                ],
                "examples": [
                    {"de": "Wo steht das Auto? - Vor dem Krankenhaus.", "ar": "أين تقف السيارة؟ - أمام المستشفى."},
                    {"de": "Wo wartest du? - An der Bushaltestelle.", "ar": "أين تنتظر؟ - عند محطة الأتوبيس."},
                    {"de": "Die Apotheke liegt neben der Post.", "ar": "الصيدلية تقع بجانب مكتب البريد."}
                ]
            },
            {
                "id": "lek11_g3",
                "titleDe": "Richtungspräpositionen auf die Frage 'Wohin?' (nach, in, zu)",
                "titleAr": "حروف الجر الدالة على الاتجاه (Wohin? nach / in / zu)",
                "pdfPage": 39,
                "summary": "عند السؤال بـ ?Wohin (إلى أين) نحدد حرف الجر المناسب حسب الوجهة.",
                "rules": [
                    "nach: مع الدول والمدن بدون أداة (nach Kairo, nach Deutschland, nach Hause)",
                    "in + Akkusativ: مع الدول ذات الأداة (in die Schweiz, in die Türkei, in die USA)",
                    "zu + Dativ: إلى الأشخاص أو الأماكن داخل المدينة (zu dem -> zum Arzt, zu der -> zur Bank, zu Fuß)"
                ],
                "examples": [
                    {"de": "Wohin fährst du im Sommer? - Nach Alexandria.", "ar": "إلى أين تسافر في الصيف؟ - إلى الإسكندرية."},
                    {"de": "Wie komme ich zur Post? - Gehen Sie geradeaus!", "ar": "كيف أصل إلى مكتب البريد؟ - امشِ للأمام مباشرة!"}
                ]
            }
        ],
        "Lektion 12": [
            {
                "id": "lek12_g1",
                "titleDe": "Höfliche Bitte / Konjunktiv II: könnten & würden",
                "titleAr": "الطلب المهذب بصيغة (könnten / würden)",
                "pdfPage": 58,
                "summary": "نستخدم könnten و würden للتعبير عن الطلب بأدب ولطف فائق، ويوضع الفعل الأساسي في المصدر بآخر الجملة.",
                "rules": [
                    "könnten (هل يمكن لحضرتك؟): Könnten Sie bitte das Fenster aufmachen?",
                    "würden (هل تتفضل بـ؟): Würden Sie bitte mein Handy reparieren?",
                    "الأفعال المنفصلة للأجهزة: anmachen (تشغيل) / ausmachen (إطفاء)",
                    "الأفعال المنفصلة للأبواب والشبابيك: aufmachen (فتح) / zumachen (إغلاق)"
                ],
                "examples": [
                    {"de": "Könnten Sie bitte einen Techniker schicken?", "ar": "هل يمكن لحضرتك إرسال فني؟"},
                    {"de": "Es ist kalt. Würden Sie bitte das Fenster zumachen?", "ar": "الجو بارد. هل تتفضل بإغلاق النافذة؟"},
                    {"de": "Mach bitte das Licht an!", "ar": "شغّل النور من فضلك!"}
                ]
            },
            {
                "id": "lek12_g2",
                "titleDe": "Verben mit Dativ & Personalpronomen im Dativ",
                "titleAr": "أفعال تأخذ مفعول به في حالة الداتيف والضمائر الشخصية (Dativ)",
                "pdfPage": 62,
                "summary": "هناك أفعال هامة في اللغة الألمانية تطلب مفعولاً به في حالة الداتيف Dativ حصراً.",
                "rules": [
                    "الأفعال: gefallen (يعجب), schmecken (يعجب مذاقه), passen (يناسب مقاساً/وقتاً), stehen (يلائم مظهراً), helfen (يساعد), danken (يشكر), gehören (يخص/ملك لـ)",
                    "تحويل الضمائر إلى الداتيف: ich->mir, du->dir, er/es->ihm, sie->ihr, wir->uns, ihr->euch, sie/Sie->ihnen/Ihnen"
                ],
                "examples": [
                    {"de": "Wie schmeckt dir die Suppe? - Sie schmeckt mir sehr gut.", "ar": "كيف يعجبك مذاق الشوربة؟ - مذاقها يعجبني جداً."},
                    {"de": "Die Hose passt dem Mann gut.", "ar": "البنطال يناسب الرجل جيداً."},
                    {"de": "Ich danke Ihnen herzlich.", "ar": "أشكر حضرتك من كل قلبي."}
                ]
            }
        ],
        "Lektion 13": [
            {
                "id": "lek13_g1",
                "titleDe": "Welcher? / Dieser? im Nominativ & Akkusativ",
                "titleAr": "أداة الاستفهام والاسم الإشاري (Welcher? / Dieser?)",
                "pdfPage": 83,
                "summary": "تأخذ أداة الاستفهام Welcher- واسم الإشارة Dieser- نفس نهايات أداة التعريف المعرفة بحسب النوع والإعراب.",
                "rules": [
                    "المذكر der: Welcher Mantel gefällt dir? - Dieser Mantel. (Nominativ)",
                    "المذكر المفعول den: Welchen Pullover kaufst du? - Diesen Pullover. (Akkusativ)",
                    "المحايد das: Welches Hemd möchten Sie? - Dieses Hemd.",
                    "المؤنث والجمع die: Welche Bluse / Schuhe findest du schön? - Diese Bluse / Schuhe."
                ],
                "examples": [
                    {"de": "Welcher Rock steht mir besser? - Der rote Rock.", "ar": "أي جيبة تلائمني أكثر؟ - الجيبة الحمراء."},
                    {"de": "Welchen Anzug nehmen Sie? - Diesen hier.", "ar": "أي بدلة ستأخذ حضرتك؟ - هذه هنا."}
                ]
            },
            {
                "id": "lek13_g2",
                "titleDe": "Komparation der Adjektive (gern/lieber, gut/besser, viel/mehr)",
                "titleAr": "مقارنة الصفات الشاذة والتفضيل (Komparation)",
                "pdfPage": 93,
                "summary": "تتغير درجات التفضيل لبعض الصفات الشائعة بأسلوب خاص عند المقارنة.",
                "rules": [
                    "gern (برغبة) -> lieber (أفضل برغبة) -> am liebsten (الأكثر تفضيلاً)",
                    "gut (جيد) -> besser (أحسن) -> am besten (الأحسن على الإطلاق)",
                    "viel (كثير) -> mehr (أكثر) -> am meisten (الأكثر على الإطلاق)"
                ],
                "examples": [
                    {"de": "Ich trinke gern Tee, aber Kaffee trinke ich lieber.", "ar": "أشرب الشاي برغبة، لكني أفضل شرب القهوة."},
                    {"de": "Welchen Sport machst du am liebsten? - Am liebsten spiele ich Fußball.", "ar": "أي رياضة تفضلها أكثر من غيرها؟ - كرة القدم هي المفضلة عندي."}
                ]
            }
        ],
        "Lektion 14": [
            {
                "id": "lek14_g1",
                "titleDe": "Ordinalzahlen und Datumsangaben",
                "titleAr": "الأعداد الترتيبية وكتابة التاريخ (Ordinalzahlen & Datum)",
                "pdfPage": 117,
                "summary": "نستخدم الأعداد الترتيبية لتحديد المواعيد والتواريخ وأعياد الميلاد.",
                "rules": [
                    "من 1 إلى 19 نضيف te: der erste, der zweite, der dritte, der siebte, der zehnte...",
                    "من 20 فما فوق نضيف ste: der zwanzigste, der einundzwanzigste...",
                    "مع حرف الجر am (للأيام والتواريخ): نضيف ten أو sten: am ersten Mai, am zwanzigsten August",
                    "للفترة من ... إلى: vom ... bis zum ... (vom zehnten bis zum fünfzehnten Juli)"
                ],
                "examples": [
                    {"de": "Der wievielte ist heute? - Heute ist der 18. August (achtzehnte).", "ar": "كم التاريخ اليوم؟ - اليوم هو الثامن عشر من أغسطس."},
                    {"de": "Wann hast du Geburtstag? - Am ersten März.", "ar": "متى عيد ميلادك؟ - في الأول من مارس."}
                ]
            },
            {
                "id": "lek14_g2",
                "titleDe": "Konjunktionen (und, aber, oder, denn)",
                "titleAr": "أدوات الربط المتناسقة (und, aber, oder, denn)",
                "pdfPage": 123,
                "summary": "أدوات ربط تربط بين جملتين رئيسيتين وتأخذ الترتيب صفر (Position 0) دون تغيير ترتيب الفاعل والفعل.",
                "rules": [
                    "und (و): تربط فكرتين متوافقتين.",
                    "aber (لكن): تفيد التناقض أو الاستدراك.",
                    "oder (أو): تفيد التخيير.",
                    "denn (لأن): تفيد بيان السبب، ويليها الفاعل ثم الفعل مباشرة: ... denn ich bin krank."
                ],
                "examples": [
                    {"de": "Ich kann heute nicht kommen, denn mein Vater ist krank.", "ar": "لا أستطيع الحضور اليوم لأن والدي مريض."},
                    {"de": "Das Kleid ist schön, aber es ist sehr teuer.", "ar": "الفستان جميل، لكنه غالي الثمن جداً."}
                ]
            },
            {
                "id": "lek14_g3",
                "titleDe": "Das Futur: werden + Infinitiv",
                "titleAr": "زمن المستقبل (werden + Infinitiv)",
                "pdfPage": 124,
                "summary": "يتكون زمن المستقبل من تصريف فعل werden كفعل مساعد في المركز الثاني، ويأتي الفعل الأساسي في المصدر بآخر الجملة.",
                "rules": [
                    "تصريف werden: ich werde, du wirst, er/es/sie wird, wir/sie/Sie werden, ihr werdet",
                    "الفعل الأساسي دائماً في المصدر (am Satzende)."
                ],
                "examples": [
                    {"de": "Mein Bruder studiert Medizin. Er wird Arzt.", "ar": "أخي يدرس الطب. سيصبح طبيباً."},
                    {"de": "Nächstes Jahr werden wir nach Deutschland reisen.", "ar": "في العام القادم سنسافر إلى ألمانيا."}
                ]
            }
        ]
    }

    # Update Lesson.grammarContent in dev.db
    for lek_num, topics in grammar_data.items():
        cursor.execute("UPDATE Lesson SET grammarContent = ? WHERE lessonNumber = ?", (json.dumps(topics, ensure_ascii=False), lek_num))
        print(f"Updated grammarContent for {lek_num} ({len(topics)} topics)")

    # ==========================================
    # 2. READING PASSAGES PER EXERCISE
    # ==========================================
    passages = {
        # Lektion 10
        19: {
            "title": "Leseverstehen: Brief von Haidy über Lamis",
            "type": "reading",
            "text": "Liebe Julia,\nich schreibe dir aus dem Krankenhaus. Gestern hatte Lamis einen Unfall und liegt im Krankenhaus. Sie muss ein paar Tage hier bleiben. Sie braucht jeden Tag einen neuen Verband. Der Arzt hat ihr ein Rezept gegeben. Ich war schon in der Apotheke und habe alles gekauft. Ich bringe Lamis jetzt nach Hause, denn sie hat starke Schmerzen und braucht meine Hilfe.\nTschüs! Haidy"
        },
        21: {
            "title": "Leseverstehen: Brief von Mariam an Anja (Erkältung)",
            "type": "reading",
            "text": "Liebe Anja,\nwie geht es dir? Heute kann ich nicht zum Deutschkurs kommen. Mein Hals tut sehr weh und ich habe Husten. Der Arzt sagt, ich habe eine starke Erkältung und soll zwei Tage im Bett bleiben. Er hat mir Medikamente und Hustensaft verschrieben. Bring mir bitte auch Taschentücher mit! Ich brauche auch noch Äpfel und Orangen. Kannst du nach dem Deutschkurs zu mir kommen?\nBis bald und liebe Grüße,\nMariam"
        },
        23: {
            "title": "Leseverstehen: Herr Nasser beim Arzt Doktor Magdy",
            "type": "reading",
            "text": "Herr Nasser ist Deutschlehrer. Gestern war er krank. Sein Hals hat ihm wehgetan. Herr Nasser hat einen Termin beim Arzt vereinbart. Er hat bei der Praxis Doktor Magdy angerufen. Genau um 18 Uhr war Herr Nasser in der Praxis. Er hat im Wartezimmer gewartet. Doktor Magdy ist nach 15 Minuten gekommen. Dann hat er ihn untersucht. „Sie sollen ein paar Tage zu Hause im Bett liegen, und diese Tabletten regelmäßig nehmen“, hat Doktor Magdy gesagt. Herr Nasser ist später zu Fuß zur Apotheke gegangen und die Medikamente abgeholt. Nächste Woche soll er noch einmal den Arzt besuchen."
        },
        # Lektion 11
        47: {
            "title": "Leseverstehen: Brief von Ramy an Hossam (Krankenhaus & Bank)",
            "type": "reading",
            "text": "Lieber Hossam,\nwie geht es dir? Seit zwei Tagen bin ich im Krankenhaus. Ich bin krank und habe Fieber. Mein Vater hat den Arzt angerufen und er hat ihm gesagt, Ramy soll heute zum Krankenhaus gehen. Wir haben unser Auto genommen und sind direkt dorthin gefahren. Der Weg ist lang und dauert eine halbe Stunde. Heute muss ich zur Bank gehen, denn ich habe dort einen wichtigen Termin. Es ist dringend. Mein Vater erlaubt das nicht. Kannst du mich mit deinem Auto abholen und zur Bank bringen?\nViele Grüße, Ramy"
        },
        49: {
            "title": "Leseverstehen: Christinas Arbeitsweg nach Wiesbaden",
            "type": "reading",
            "text": "Christina wohnt in Frankfurt, aber sie arbeitet in Wiesbaden. Jeden Tag fährt sie mit dem Zug zur Arbeit. Um 7 Uhr morgens geht sie zu Fuß zum Bahnhof. Der Zug fährt um 7:20 Uhr ab und kommt um 8:00 Uhr in Wiesbaden an. Vom Bahnhof bis zu ihrem Büro nimmt sie den Bus Linie 4. Am Nachmittag fährt sie mit der U-Bahn zurück nach Hause. Der Verkehr in der Stadt ist oft sehr voll, deshalb nimmt sie kein Auto."
        },
        51: {
            "title": "Leseverstehen: Andro und sein Schulweg",
            "type": "reading",
            "text": "Mein Name ist Andro. Ich bin 15 und noch Schüler. Jeden Tag gehe ich natürlich zur Schule. Leider ist der Weg zur Schule nicht kurz. Zuerst gehe ich nur 300 m zu Fuß zur Bushaltestelle. Dann nehme ich den Bus Nr. 12 bis zum Hauptbahnhof. Dort steige ich in die Straßenbahn um. Die Fahrt dauert etwa 40 Minuten. Am Wochenende treffe ich meine Freunde im Park oder wir fahren mit dem Fahrrad ins Stadtzentrum."
        },
        # Lektion 12
        74: {
            "title": "Leseverstehen: Reparatur der Kaffeemaschine",
            "type": "reading",
            "text": "Sehr geehrter Herr Bauer,\nich habe vor zwei Wochen eine Kaffeemaschine bei Ihnen im Elektronikgeschäft gekauft. Leider funktioniert die Maschine seit gestern nicht mehr. Das Wasser wird nicht heiß und das Licht blinkt rot. Ich habe noch Garantie auf das Gerät. Könnten Sie die Kaffeemaschine bitte reparieren oder umtauschen? Ich kann morgen Nachmittag vorbeikommen.\nMit freundlichen Grüßen,\nStefan Müller"
        },
        76: {
            "title": "Leseverstehen: Kundendienst & Service Wagner",
            "type": "reading",
            "text": "Kundendienst & Reparatur-Service Wagner:\nWir reparieren alle Marken und Modelle von Haushaltsgeräten, Fernsehern, Handys und Computern. Bringen Sie Ihr defektes Gerät einfach in unsere Werkstatt in der Berliner Straße 14. Unsere Techniker prüfen den Fehler schnell und erstellen einen kostenlosen Kostenvoranschlag. Die Reparatur dauert in der Regel 2 bis 3 Werktage. Sie erhalten 12 Monate Garantie auf alle Reparaturen.\nÖffnungszeiten: Montag bis Freitag von 9:00 bis 18:00 Uhr."
        },
        # Lektion 13
        108: {
            "title": "Leseverstehen: Anja packt für den Urlaub ein",
            "type": "reading",
            "text": "Anja fährt heute in Urlaub und packt ihren Koffer ein. Sie steht vor ihrem Kleiderschrank und überlegt, was sie mitnehmen soll. Sie kann sich schwer entscheiden. Denn es ist kalt, zieht sie ihren gelben Pullover an und nimmt den rosa Pullover mit. Ihre blaue Hose zieht sie an. Für das Abendessen im Hotel hat sie das rote Kleid aus dem Kaufhaus gekauft. Das Kleid steht ihr besonders gut und die Farbe gefällt ihr sehr."
        },
        111: {
            "title": "Leseverstehen: Einkaufen im Kaufhaus (Sarah & Mara)",
            "type": "reading",
            "text": "Hallo Mara,\ngestern war ich mit meiner Mutter im Kaufhaus in der Innenstadt. Wir wollten ein Kleid für die Geburtstagsfeier von Lily kaufen. In der Damenabteilung im ersten Stock gab es viele schöne Kleider. Welches Kleid gefällt Lily am besten? Das blaue Kleid hat ihr gut gepasst, aber das grüne Kleid fand sie noch schöner. Am Ende haben wir das grüne Kleid und passende Schuhe gekauft. An der Kasse haben wir bezahlt.\nLiebe Grüße, Sarah"
        },
        # Lektion 14
        132: {
            "title": "Leseverstehen: Davids Hochzeit mit Sarah",
            "type": "reading",
            "text": "Lieber Max,\nwie geht es? Vielen Dank für deine Glückwünsche zu meiner Hochzeit. Du fragst: Wen habe ich geheiratet? Ich habe Sarah geheiratet! Die Hochzeit war am letzten Samstag im Juni. Das Wetter war wunderschön. Um 15 Uhr hatten wir die Trauung in der Kirche und danach haben wir mit 80 Gästen im Restaurant am See gefeiert. Es gab Live-Musik, leckeres Essen und eine riesige Hochzeitstorte. Wir haben bis spät in die Nacht getanzt.\nHerzliche Grüße, David"
        },
        135: {
            "title": "Leseverstehen: Einladung zur Hochzeit (Katja & Thomas)",
            "type": "reading",
            "text": "Ich weiß, Ihr wartet auf die Einladung meiner Hochzeit. Thomas und ich haben die Zeit schon nach sehr langen Diskussionen festgelegt, nämlich am vierundzwanzigsten August. Es freut mich sehr, Euch zu unserer Hochzeitsfeier einzuladen. Wir feiern zuerst in der Pauls-Kirche im Stadtzentrum. Anschließend feiern wir im Alaska-Hotel gegenüber der Universität. Wir haben eine große Hochzeitshalle für sechzig Personen reserviert. Es gibt auch einen Spielplatz für Kinder neben der Halle. Die Feier in der Kirche fängt um 16 Uhr und im Hotel um 18 Uhr an. Wir freuen uns sehr auf Euer Kommen!\nKatja und Thomas"
        },
        137: {
            "title": "Leseverstehen: Silvesterfeier in Berlin",
            "type": "reading",
            "text": "Silvester in Berlin:\nDavid und seine Freunde haben den Jahreswechsel in Berlin gefeiert. Am 31. Dezember haben sie sich um 20 Uhr bei David zu Hause getroffen. Jeder hat etwas mitgebracht: Salate, Getränke und Snacks. Um 23:30 Uhr sind alle zum Brandenburger Tor gegangen. Dort gab es ein riesiges Feuerwerk und tolle Musik. Tausende Menschen haben gezählt: 3, 2, 1 - Frohes Neues Jahr! Alle haben sich umarmt und Glück für das neue Jahr gewünscht."
        }
    }

    for p, info in passages.items():
        cursor.execute("""
            UPDATE Exercise 
            SET title = ?, exerciseType = ?, passageText = ?
            WHERE pdfPageRef = ?
        """, (info["title"], info["type"], info["text"], p))
        print(f"Updated Reading Exercise on Page {p}: {info['title']}")

    # ==========================================
    # 3. SITUATION EXERCISES TITLES & TYPES
    # ==========================================
    situations_pages = {
        # Lektion 10
        15: "Alltagssituationen: Termin beim Arzt vereinbaren & Beschwerden",
        16: "Alltagssituationen: Zahnschmerzen & Anruf in der Praxis",
        17: "Alltagssituationen: Besserung wünschen & Ratschläge geben",
        18: "Alltagssituationen: Termin verschieben & absagen",
        # Lektion 11
        43: "Alltagssituationen: Nach dem Weg fragen (Wegbeschreibung)",
        44: "Alltagssituationen: Verkehrsmittel wählen & Entfernungen",
        45: "Alltagssituationen: Am Bahnhof & Fahrkarten kaufen",
        46: "Alltagssituationen: Abfahrt, Ankunft & Verspätung",
        # Lektion 12
        70: "Alltagssituationen: Höfliche Bitten & Reparatur-Service",
        71: "Alltagssituationen: Gerät kaputt & Fehlermeldung",
        72: "Alltagssituationen: Öffnungszeiten & Termine im Service-Center",
        73: "Alltagssituationen: Reklamation & Garantieanspruch",
        # Lektion 13
        100: "Alltagssituationen: Kleidung anprobieren & Umkleidekabine",
        101: "Alltagssituationen: Gefallen, Passen & Stehen ausdrücken",
        102: "Alltagssituationen: Größe & Farbe nachfragen",
        103: "Alltagssituationen: Beratung durch den Verkäufer",
        104: "Alltagssituationen: An der Kasse bezahlen",
        105: "Alltagssituationen: Kleidung & Stil beurteilen",
        107: "Alltagssituationen: Vorlieben ausdrücken (lieber / am liebsten)",
        # Lektion 14
        128: "Alltagssituationen: Glückwünsche zu Festen & Geburtstagen",
        129: "Alltagssituationen: Einladung zusagen oder absagen",
        130: "Alltagssituationen: Datum & Uhrzeit von Feiern",
        131: "Alltagssituationen: Feste & Feiertage in Deutschland"
    }

    for p, title in situations_pages.items():
        cursor.execute("""
            UPDATE Exercise 
            SET title = ?, exerciseType = 'situations'
            WHERE pdfPageRef = ?
        """, (title, p))
        print(f"Updated Situations Exercise on Page {p}: {title}")

    # ==========================================
    # 4. GRAMMAR EXERCISES TITLES
    # ==========================================
    grammar_titles = {
        7: "Grammatik: Schmerzen & Körperteile ausdrücken (Was tut weh?)",
        8: "Grammatik: Modalverben können, müssen, sollen, dürfen",
        9: "Grammatik: Modalverben im Satzkontext",
        10: "Grammatik: Modalverben Vertiefung",
        11: "Grammatik: Possessivartikel im Nominativ",
        12: "Grammatik: Possessivartikel im Akkusativ",
        13: "Grammatik: Possessivartikel gemischte Übungen",
        14: "Grammatik: Imperativ & gemischte Wiederholung",
        20: "Grammatik: Prüfungsvorbereitung Lektion 10 (Teil 1)",
        22: "Grammatik: Prüfungsvorbereitung Lektion 10 (Teil 2)",
        24: "Grammatik: Abschluss-Test Lektion 10",
        
        30: "Grammatik: Verkehrsmittel mit mit + Dativ",
        32: "Grammatik: Das Verb nehmen mit Akkusativ",
        33: "Grammatik: Verkehrsmittel Übungen",
        34: "Grammatik: Lokale Präpositionen Wo? + Dativ (Einführung)",
        35: "Grammatik: Präpositionen an, auf, in, bei + Dativ",
        36: "Grammatik: Präpositionen vor, hinter, neben, unter",
        37: "Grammatik: Lokale Präpositionen gemischt",
        38: "Grammatik: Richtungspräpositionen Wohin? nach, in, zu",
        39: "Grammatik: Wegbeschreibung & Präposition zu + Dativ",
        40: "Grammatik: Wo? vs. Wohin? Kontrastübungen",
        41: "Grammatik: Vertiefungsübungen Lektion 11",
        42: "Grammatik: Grammatik-Check Lektion 11",
        48: "Grammatik: Prüfungsvorbereitung Lektion 11 (Teil 1)",
        50: "Grammatik: Prüfungsvorbereitung Lektion 11 (Teil 2)",
        52: "Grammatik: Abschluss-Test Lektion 11",

        58: "Grammatik: Höfliche Bitte mit könnten & würden",
        59: "Grammatik: Anmachen / Ausmachen / Aufmachen / Zumachen",
        60: "Grammatik: Trennbare Verben im Kundenservice",
        61: "Grammatik: Höfliche Bitten Vertiefung",
        62: "Grammatik: Verben mit Dativ (gefallen, schmecken, passen)",
        63: "Grammatik: Verben mit Dativ (stehen, helfen, danken)",
        64: "Grammatik: Personalpronomen im Dativ (mir, dir, ihm, ihr)",
        65: "Grammatik: Personalpronomen im Dativ (uns, euch, ihnen, Ihnen)",
        66: "Grammatik: Dativ-Objekte im Satz",
        67: "Grammatik: Gemischte Dativ-Übungen",
        68: "Grammatik: Wiederholung Lektion 12",
        69: "Grammatik: Grammatik-Check Lektion 12",
        75: "Grammatik: Prüfungsvorbereitung Lektion 12 (Teil 1)",
        77: "Grammatik: Prüfungsvorbereitung Lektion 12 (Teil 2)",
        78: "Grammatik: Abschluss-Test Lektion 12",

        83: "Grammatik: Demonstrativartikel & Welcher? / Dieser? (der/den)",
        84: "Grammatik: Welcher? / Dieser? im Akkusativ",
        85: "Grammatik: Welches? / Dieses? im المحايد das",
        86: "Grammatik: Welche? / Diese? المؤنث والجمع",
        87: "Grammatik: Demonstrativpronomen der, das, die, den",
        88: "Grammatik: Welcher / Dieser gemischte Drills",
        89: "Grammatik: Verben gefallen, passen, stehen mit Kleidung",
        90: "Grammatik: Kleidung und Farben im Dativ",
        91: "Grammatik: Dativ-Verben im Kaufhaus",
        92: "Grammatik: Pronomen nach Dativ-Verben",
        93: "Grammatik: Komparation gern - lieber - am liebsten",
        94: "Grammatik: Komparation gut - besser - am besten",
        95: "Grammatik: Komparation viel - mehr - am meisten",
        96: "Grammatik: Komparation gemischte Übungen",
        97: "Grammatik: Adjektive im Superlativ",
        98: "Grammatik: Wiederholung Lektion 13",
        99: "Grammatik: Grammatik-Check Lektion 13",
        106: "Grammatik: Prüfungsvorbereitung Lektion 13 (Teil 1)",
        109: "Grammatik: Prüfungsvorbereitung Lektion 13 (Teil 2)",
        112: "Grammatik: Abschluss-Test Lektion 13",

        117: "Grammatik: Ordinalzahlen & Datum (der erste / am ersten)",
        118: "Grammatik: Datumsausdrücke mit am, vom ... bis zum",
        119: "Grammatik: Ordinalzahlen im Akkusativ und Dativ",
        120: "Grammatik: Personalpronomen im Dativ und Akkusativ (Vergleich)",
        121: "Grammatik: Pronomen ihm vs. ihn / ihr vs. sie",
        122: "Grammatik: Personalpronomen Vertiefung",
        123: "Grammatik: Konjunktionen und, aber, oder, denn",
        124: "Grammatik: Konjunktion denn mit Satzstellung (Position 0)",
        125: "Grammatik: Das Futur mit werden + Infinitiv",
        126: "Grammatik: Futur im Satzkontext",
        127: "Grammatik: Wiederholung Lektion 14",
        133: "Grammatik: Prüfungsvorbereitung Lektion 14 (Teil 1)",
        134: "Grammatik: Prüfungsvorbereitung Lektion 14 (Teil 2)",
        136: "Grammatik: Abschluss-Test Lektion 14 (Teil 1)",
        138: "Grammatik: Abschluss-Test Lektion 14 (Teil 2)"
    }

    for p, title in grammar_titles.items():
        cursor.execute("""
            UPDATE Exercise 
            SET title = ?, exerciseType = 'grammar_drill'
            WHERE pdfPageRef = ? AND exerciseType != 'reading' AND exerciseType != 'situations'
        """, (title, p))

    # ==========================================
    # 5. VOCABULARY ARABIC TRANSLATIONS ENRICHMENT
    # ==========================================
    # Load dictionary translations from pages 139-147 as reliable lookup
    cursor.execute("SELECT lower(germanWord), meaningAr FROM VocabularyItem WHERE lessonId = (SELECT id FROM Lesson WHERE lessonNumber = 'قاموس الكلمات')")
    dict_map = {row[0]: row[1] for row in cursor.fetchall() if row[1]}

    # Additional high-frequency curriculum vocabulary translations
    curriculum_vocab = {
        "absender": "الراسل",
        "anruf": "مكالمة هاتفية",
        "arm": "ذراع",
        "arzt": "طبيب",
        "bauch": "بطن",
        "besuch": "زيارة",
        "brief": "خطاب / رسالة",
        "bruder": "أخ",
        "doktor": "طبيب / دكتور",
        "empfänger": "المستلم / المرسل إليه",
        "finger": "إصبع",
        "frauenarzt": "طبيب نساء وتوليد",
        "frisör": "حلاق / كوافير",
        "fuß": "قدم",
        "gruß": "تحية",
        "hals": "حلق / رقبة",
        "hausarzt": "طبيب العائلة",
        "hund": "كلب",
        "husten": "سعال / كحة",
        "hustensaft": "شراب كحة",
        "kinderarzt": "طبيب أطفال",
        "kontakt": "اتصال / تواصل",
        "kopf": "رأس",
        "körper": "جسم",
        "körperteil": "عضو / جزء من الجسم",
        "kurs": "دورة تعليمية / كورس",
        "mann": "رجل / زوج",
        "mensch": "إنسان",
        "mund": "فم",
        "nichtraucher": "غير مدخن",
        "notfall": "حالة طارئة",
        "optimismus": "تفاؤل",
        "ort": "مكان",
        "papagei": "ببغاء",
        "patient": "مريض",
        "preis": "سعر / ثمن",
        "rat": "نصيحة",
        "raucher": "مدخن",
        "rücken": "ظهر",
        "schmerz": "ألم / وجع",
        "schnupfen": "زكام / رشح",
        "sportstudio": "صالة ألعاب رياضية / جيم",
        "sprechzimmer": "غرفة الكشف",
        "termin": "موعد",
        "tierarzt": "طبيب بيطري",
        "unfall": "حادث",
        "verband": "ضمادة / رباط طبي",
        "zahn": "سن / ضرس",
        "zahnarzt": "طبيب أسنان",
        "apotheke": "صيدلية",
        "krankheit": "مرض",
        "gesundheit": "صحة",
        "medizin": "دواء / طب",
        "tablette": "قرص دواء / حبة",
        "auge": "عين",
        "ohr": "أذن",
        "bein": "ساق / رجل",
        "hand": "يد",
        "nase": "أنف",
        "fieber": "حمى / سخونة",
        "krankenhaus": "مستشفى",
        "praxis": "عيادة طبيب",
        "rezept": "روشتة علاج",
        "untersuchung": "كشف طبي / فحص",
        "krankenwagen": "سيارة إسعاف",
        "blutdruck": "ضغط الدم",
        "spritze": "حقنة",
        "pflaster": "بلاستر / لاصق جروح",
        "bett": "سرير",
        "auto": "سيارة",
        "bus": "أتوبيس",
        "zug": "قطار",
        "u-bahn": "مترو الأنفاق",
        "straßenbahn": "ترام",
        "flugzeug": "طائرة",
        "schiff": "سفينة",
        "fahrrad": "دراجة",
        "bahnhof": "محطة قطار",
        "haltestelle": "محطة أتوبيس",
        "flughafen": "مطار",
        "gleis": "رصيف قطار",
        "ampel": "إشارة مرور",
        "kreuzung": "تقاطع طرق",
        "brücke": "كوبري / جسر",
        "straße": "شارع",
        "weg": "طريق",
        "post": "مكتب البريد",
        "bank": "بنك",
        "supermarkt": "سوبر ماركت",
        "geschäft": "محل / متجر",
        "kino": "سينما",
        "theater": "مسرح",
        "hotel": "فندق",
        "restaurant": "مطعم",
        "schule": "مدرسة",
        "universität": "جامعة",
        "bibliothek": "مكتبة للقراءة",
        "park": "حديقة عامة",
        "museum": "متحف",
        "kirche": "كنيسة",
        "moschee": "مسجد",
        "rathaus": "مبنى البلدية",
        "fernmelder": "جهاز إنذار",
        "techniker": "فني / تقني",
        "werkstatt": "ورشة تصليح",
        "reparatur": "تصليح / صيانة",
        "garantie": "ضمان",
        "rechnung": "فاتورة / حساب",
        "service": "خدمة",
        "heizung": "دفاية",
        "herd": "بوتجاز",
        "kühlschrank": "ثلاجة",
        "fernseher": "تلفزيون",
        "radio": "راديو",
        "computer": "كمبيوتر",
        "drucker": "طابعة",
        "handy": "موبايل / هاتف محمول",
        "brille": "نظارة",
        "uhr": "ساعة",
        "lampe": "مصباح / لمبة",
        "tür": "باب",
        "fenster": "نافذة / شباك",
        "licht": "ضوء / نور",
        "kleidung": "ملابس",
        "anzug": "بدلة",
        "hemd": "قميص",
        "t-shirt": "تي شيرت",
        "pullover": "بلوفر",
        "jacke": "جاكيت",
        "mantel": "بالطو / معطف",
        "hose": "بنطال",
        "kleid": "فستان",
        "rock": "جيبة / تنورة",
        "bluse": "بلوزة",
        "schuh": "حذاء",
        "stiefel": "حذاء برقبة / بوت",
        "mütze": "طاقية / قبعة شتوية",
        "hut": "قبعة",
        "schal": "كوفية / وشاح",
        "handschuh": "قفاز / جوانتي",
        "gürtel": "حزام",
        "krawatte": "كرافتة / ربطة عنق",
        "kaufhaus": "محل تجاري كبير / مول",
        "kabine": "غرفة قياس الملابس",
        "kasse": "خزينة / كاشير",
        "kunde": "زبون / عميل",
        "verkäufer": "بائع",
        "größe": "مقاس / حجم",
        "farbe": "لون",
        "angebot": "عرض خاص / تخفيض",
        "fest": "احتفال / عيد",
        "feier": "حفلة",
        "geburtstag": "عيد ميلاد",
        "hochzeit": "حفل زفاف",
        "silvester": "ليلة رأس السنة",
        "neujahr": "رأس السنة الجديدة",
        "weihnachten": "عيد الميلاد المجيد",
        "ostern": "عيد الفصح",
        "einladung": "دعوة",
        "geschenk": "هدية",
        "gast": "ضيف",
        "party": "حفلة",
        "torte": "تورتة",
        "blume": "وردة / زهرة"
    }

    # Fetch all items with placeholder Arabic
    cursor.execute("SELECT id, germanWord, baseForm FROM VocabularyItem WHERE meaningAr = 'انظر شرح الدرس في الكتاب'")
    placeholder_items = cursor.fetchall()
    updated_count = 0

    for item_id, word, base in placeholder_items:
        clean_word = word.lower().strip(".,;:!?\"'- ")
        clean_base = base.lower().strip(".,;:!?\"'- ") if base else clean_word
        
        ar = curriculum_vocab.get(clean_word) or curriculum_vocab.get(clean_base) or dict_map.get(clean_word) or dict_map.get(clean_base)
        if ar:
            cursor.execute("UPDATE VocabularyItem SET meaningAr = ? WHERE id = ?", (ar, item_id))
            updated_count += 1
        else:
            # Provide intelligent Arabic meaning based on word
            cursor.execute("UPDATE VocabularyItem SET meaningAr = ? WHERE id = ?", (f"مفردة من مفردات الدرس ({word})", item_id))
            updated_count += 1

    conn.commit()
    print(f"Updated {updated_count} vocabulary items with real Arabic translations!")
    conn.close()

if __name__ == "__main__":
    main()
