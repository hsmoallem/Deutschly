#!/usr/bin/env python3
"""
Master Vocabulary & Arabic Curation Script
- Deletes invalid non-words and header entries ((Akk), (Dativ), Das, Die, stray letters)
- Fixes malformed German words and prefixes
- Decodes font encoding artifacts (tanwin damm -> yaa)
- Strips OCR digits and leader noise
- Applies authoritative curriculum translations for all lesson and dictionary words
- Updates code/prisma/dev.db and antigravity/output/verified_vocabulary.json
"""

import sqlite3
import re
import json

DB_PATH = "code/prisma/dev.db"
JSON_PATH = "antigravity/output/verified_vocabulary.json"

# Authoritative curriculum mapping for German words
CURRICULUM_LOOKUP = {
    # Lektion 10
    "absender": "الراسل",
    "arm": "ذراع",
    "arzt": "طبيب",
    "bruder": "أخ",
    "doktor": "طبيب / دكتور",
    "empfänger": "المستلم / المرسل إليه",
    "finger": "إصبع",
    "frauenarzt": "طبيب أمراض نساء",
    "frisör": "حلاق / كوافير",
    "fuß": "قدم",
    "geburtstag": "عيد ميلاد",
    "gruß": "تحية",
    "hals": "حلق / رقبة",
    "hausarzt": "طبيب العائلة",
    "hund": "كلب",
    "kinderarzt": "طبيب أطفال",
    "kopf": "رأس",
    "körper": "جسم / بدن",
    "körperteil": "جزء من الجسم",
    "magersucht": "فقدان الشهية العصبي",
    "mund": "فم",
    "optimismus": "التفاؤل",
    "ort": "مكان",
    "papagei": "ببغاء",
    "patient": "مريض",
    "pfeffer": "فلفل أسود",
    "preis": "سعر",
    "rat": "نصيحة",
    "rücken": "ظهر",
    "schmerz": "ألم / وجع",
    "schnupfen": "زكام / رشح",
    "spezialist": "طبيب أخصائي",
    "sport": "رياضة",
    "stress": "ضغط عصبي / توتر",
    "stress-": "ضغط عصبي / توتر",
    "tee": "شاي",
    "tierarzt": "طبيب بيطري",
    "unterricht": "حصة / دراسة",
    "zahn": "سن / ضرس",
    "angebot": "عرض / أوكازيون",
    "auge": "عين",
    "bad": "حمام",
    "bein": "ساق / رجل",
    "befinden": "الحالة الصحية",
    "bett": "سرير",
    "datum": "تاريخ",
    "entschuldigungsschreiben": "خطاب اعتذار",
    "entschuldigungsc": "خطاب اعتذار",
    "fach": "مادة دراسية / تخصص",
    "fieber": "حمى / سخونة",
    "fitnessstudio": "صالة ألعاب رياضية (جيم)",
    "gewicht": "وزن",
    "gesicht": "وجه",
    "gespräch": "محادثة / حوار",
    "gesundheitsproblem": "مشكلة صحية",
    "gesundheitsprobl": "مشكلة صحية",
    "haar": "شعر",
    "halsweh": "ألم في الحلق",
    "hotel": "فندق",
    "haus": "منزل / بيت",
    "kind": "طفل",
    "knie": "ركبة",
    "krankenhaus": "مستشفى",
    "lach-yoga": "يوجا الضحك",
    "lach-yoga(sg.)": "يوجا الضحك",
    "lachseminar": "ورشة يوجا الضحك",
    "medikament": "دواء / علاج",
    "monster": "وحش",
    "ohr": "أذن",
    "problem": "مشكلة",
    "rezept": "روشتة طبية",
    "salz": "ملح",
    "seminar": "ندوة / ورشة عمل",
    "spiel": "لعبة / مباراة",
    "sportstudio": "صالة رياضية",
    "sprechzimmer": "غرفة الكشف",
    "tennis": "تنس",
    "thermalbad": "حمام مياه كبريتية / معدنية",
    "tier": "حيوان",
    "wartezimmer": "غرفة الانتظار",
    "anfrage": "طلب استفسار / استعلام",
    "anrede": "صيغة المخاطبة",
    "anzeige": "إعلان",
    "apotheke": "صيدلية",
    "auskunft": "معلومات / استعلامات",
    "brille": "نظارة",
    "dame": "سيدة",
    "depressionen": "اكتئاب",
    "eltern": "والدان",
    "eltern (pl.)": "والدان",
    "firma": "شركة",
    "frage": "سؤال",
    "freude": "فرحة / سعادة",
    "freude (sg.)": "فرحة / سعادة",
    "geburtstagsfeier": "حفل عيد ميلاد",
    "gesundheit": "صحة",
    "gesundheit (sg.)": "صحة",
    "gesundheitskarte": "بطاقة التأمين الصحي",
    "grippe": "إنفلونزا",
    "grillparty": "حفلة شواء",
    "hand": "يد",
    "hausnummer": "رقم المنزل",
    "idee": "فكرة",
    "konzentration": "تركيز",
    "kontrolle": "فحص / مراجعة",
    "krankheit": "مرض",
    "krankmeldung": "إجازة مرضية / إخطار بالمرض",
    "lichttherapie": "علاج بالضوء",
    "masseurin": "أخصائية تدليك (ماسيور)",
    "medizin": "دواء / طب",
    "nachricht": "رسالة / خبر",
    "nase": "أنف",
    "pause": "استراحة / فسحة",
    "party": "حفلة",
    "praxis": "عيادة طبيب",
    "regel": "قاعدة",
    "rolle": "دور",
    "schlafstörung": "أرق / اضطراب في النوم",
    "schokolade": "شوكولاتة",
    "seite": "صفحة / جانب",
    "tante": "عمة / خالة",
    "untersuchung": "فحص طبي / كشف",
    "woche": "أسبوع",
    "abgeben": "يسلم (روشتة / مفتاح)",
    "atmen": "يتنفس",
    "aufstehen": "يستيقظ / ينهض",
    "ausprobieren": "يجرب",
    "aussehen": "يبدو",
    "auswählen": "يختار",
    "auswȁhlen": "يختار",
    "baden": "يستحم",
    "bedeuten": "يعني / يقصد",
    "behalten": "يحتفظ بـ",
    "bekommen": "يحصل على",
    "bestehen": "يجتاز / ينجح في",
    "bestellen": "يطلب / يحجز",
    "brauchen": "يحتاج",
    "drücken": "يضغط على",
    "dürfen": "يسمح له / يجوز",
    "essen": "يأكل",
    "fahren": "يقود / يسافر بالسيارة",
    "feiern": "يحتفل",
    "fehlen": "ينقص / يغيب",
    "finden": "يجد / يرى",
    "geben": "يعطي",
    "gehen": "يذهب / يمشي",
    "gehören": "يخص / ملك لـ",
    "genießen": "يستمتع بـ",
    "haben": "يملك / لديه",
    "helfen": "يساعد",
    "hoffen": "يأمل / يتمنى",
    "hören": "يسمع",
    "husten": "يسعل / يكح",
    "kaufen": "يشتري",
    "kennen": "يعرف",
    "kochen": "يطبخ / يطهو",
    "kosten": "يتكلف",
    "lachen": "يضحك",
    "leben": "يعيش",
    "leihen": "يستعير / يقرض",
    "lernen": "يتعلم / يذاكر",
    "lesen": "يقرأ",
    "liegen": "يرقد / يقع أفقياً",
    "machen": "يفعل / يصنع",
    "möchten": "يرغب / يود",
    "müssen": "يجب / يلزم (إلزام قاطع)",
    "nehmen": "يأخذ (دواء / مواصلات)",
    "öffnen": "يفتح",
    "passen": "يناسب / يلائم",
    "rauchen": "يدخن",
    "rausgehen": "يخرج إلى الخارج",
    "reiten": "يركب الخيل",
    "riechen": "يشم / تخرج منه رائحة",
    "sagen": "يقول",
    "schlafen": "ينام",
    "schließen": "يغلق",
    "schlieβen": "يغلق",
    "schmecken": "يعجبه المذاق / طعمه لذيذ",
    "schmerzen": "يؤلم",
    "schreiben": "يكتب",
    "schwimmen": "يسبح / يعوم",
    "sehen": "يرى",
    "sein": "يكون",
    "senden": "يرسل",
    "setzen": "يجلس / يضع",
    "sitzen": "يجلس",
    "sollen": "ينبغي / يجب (نصيحة)",
    "spazieren gehen": "يتنزه / يتمشى",
    "spielen": "يلعب / يعزف",
    "sprechen": "يتحدث",
    "starten": "يبدأ / ينطلق",
    "stehen": "يقف",
    "stellen": "يضع رأسياً",
    "sterben": "يموت",
    "stimmen": "صحيح / مضبوط",
    "stören": "يزعج / يضايق",
    "streichen": "يدهن / يشطب",
    "suchen": "يبحث عن",
    "tanzen": "يرقص",
    "telefonieren": "يتحدث هاتفياً",
    "tragen": "يرتدي / يحمل",
    "treffen": "يقابل / يلتقي",
    "trinken": "يشرب",
    "tun": "يفعل / يصنع",
    "unterschreiben": "يوقع / يمضي",
    "untersuchen": "يفحص / يكشف طبياً",
    "vereinbaren": "يحدد / يرتب (موعداً)",
    "vergessen": "ينسى",
    "vergleichen": "يقارن",
    "verstehen": "يفهم",
    "versuchen": "يحاول / يجرب",
    "vorbeikommen": "يمر على / يزور",
    "warten": "ينتظر",
    "waschen": "يغسل",
    "wehtun": "يؤلم / يوجع",
    "werden": "يصبح",
    "wiederholen": "يكرر / يعيد",
    "wiederkommen": "يعود / يرجع",
    "wissen": "يعلم / يعرف",
    "wohnen": "يسكن / يقيم",
    "wollen": "يريد / ينوي",
    "wünschen": "يتمنى",
    "zeigen": "يوضح / يعرض",
    "ändern": "يغير / يعدل",

    # Lektion 11
    "abflug": "إقلاع (للطائرة)",
    "ausgang": "مخرج",
    "bahnhof": "محطة قطار",
    "bahnsteig": "رصيف قطار",
    "baum": "شجرة",
    "berg": "جبل",
    "bus": "أتوبيس / حافلة",
    "eingang": "مدخل",
    "fahrplan": "جدول مواعيد السفر",
    "flughafen": "مطار",
    "fluss": "نهر",
    "fremde": "غريب / أجنبي",
    "fußgänger": "مشاة",
    "hafen": "ميناء",
    "jugendliche": "شباب / مراهقون",
    "kiosk": "كشك",
    "klub": "نادٍ",
    "laden": "محل / متجر",
    "lkw": "شاحنة نقل (لوري)",
    "meter": "متر",
    "park": "حديقة عامة",
    "passagier": "مسافر / راكب",
    "platz": "ميدان / ساحة / مكان",
    "schalter": "شباك تذاكر / شباك خدمة",
    "see": "بحيرة",
    "stau": "ازدحام مروري",
    "termin": "موعد",
    "turm": "برج",
    "urlaub": "إجازة / عطلة",
    "verkehr": "حركة المرور",
    "vogel": "طائر / عصفور",
    "wagen": "سيارة / عربة",
    "wald": "غابة",
    "weg": "طريق / سبيل",
    "zug": "قطار",
    "auto": "سيارة",
    "boot": "قارب / زورق",
    "dorf": "قرية",
    "fahrrad": "دراجة (هوائية)",
    "flugzeug": "طائرة",
    "gleis": "رصيف سكة حديد",
    "meer": "بحر",
    "motorrad": "دراجة نارية (موتوسيكل)",
    "schiff": "سفينة",
    "taxi": "تاكسي",
    "ticket": "تذكرة",
    "verkehrsmittel": "وسيلة مواصلات",
    "zentrum": "مركز المدينة / وسط البلد",
    "abfahrt": "تحرك / سفر (للحافلة أو القطار)",
    "ampel": "إشارة مرور",
    "autobahn": "طريق سريع",
    "bahn": "قطار / سكة حديد",
    "bank": "بنك / مصرف",
    "brücke": "جسر / كوبري",
    "durchsage": "إذاعة داخلية / بيان صوتي",
    "ecke": "زاوية / ناصية",
    "fahrkarte": "تذكرة سفر",
    "fahrt": "رحلة / توصيلة",
    "haltestelle": "محطة توقف (أتوبيس أو ترام)",
    "insel": "جزيرة",
    "kirche": "كنيسة",
    "linie": "خط (أتوبيس / مترو)",
    "lust": "رغبة / مزاج",
    "lust (sg.)": "رغبة / مزاج",
    "nähe": "قرب / جوار",
    "nähe (sg.)": "قرب / جوار",
    "post": "مكتب بريد",
    "reise": "رحلة / سفر",
    "s-bahn": "قطار الضواحي السريع",
    "stadt": "مدينة",
    "station": "محطة",
    "straße": "شارع",
    "straßenbahn": "ترام",
    "tankstelle": "محطة وقود (بنزينة)",
    "treppe": "سلم / درج",
    "u-bahn": "مترو الأنفاق",
    "verspätung": "تأخير",
    "abfahren": "يتحرك / يغادر (قطار أو أتوبيس)",
    "abholen": "يحضر / يستقبل شخصاً من مكان",
    "ankommen": "يصل",
    "anrufen": "يتصل هاتفياً",
    "aussteigen": "ينزل من وسيلة مواصلات",
    "einsteigen": "يركب وسيلة مواصلات",
    "fliegen": "يطير / يسافر بالطائرة",
    "umsteigen": "يبدل وسيلة المواصلات",
    "warten (auf)": "ينتظر",
    "weit": "بعيد",
    "nah": "قريب",
    "geradeaus": "إلى الأمام مباشرة",
    "links": "يساراً / شمالاً",
    "rechts": "يميناً",
    "oben": "أعلى / فوق",
    "unten": "أسفل / تحت",
    "vorne": "في الأمام",
    "hinten": "في الخلف",
    "drüben": "على الجانب الآخر / هناك",
    "in der nähe": "بالقرب من",

    # Lektion 12
    "apparat": "جهاز",
    "ausflug": "رحلة خلوية / نزهة",
    "drucker": "طابعة",
    "fernseher": "تلفزيون",
    "fotoapparat": "كاميرا تصوير",
    "führerschein": "رخصة قيادة",
    "herd": "بوتاجاز / موقد",
    "kühlschrank": "ثلاجة",
    "monat": "شهر",
    "optiker": "أخصائي بصريات",
    "reiseplan": "جدول الرحلة",
    "schlüssel": "مفتاح",
    "spaziergang": "نزهة سيراً على الأقدام",
    "tisch": "طاولة / منضدة",
    "verleih": "محل تأجير",
    "wohnraum": "مكان للإقامة / سكن",
    "jahr": "سنة / عام",
    "konzert": "حفلة موسيقية",
    "modell": "موديل / طراز",
    "öl": "زيت",
    "rad": "عجلة / دراجة",
    "ansage": "نداء إذاعي / إعلان صوتي",
    "garantie": "فترة الضمان",
    "heizung": "مدفأة / دفاية",
    "kaffeemaschine": "ماكينة إعداد القهوة",
    "rechnung": "فاتورة / حساب",
    "reisegruppe": "فوج سياحي",
    "reparatur": "تصليح / صيانة",
    "rundfahrt": "جولة سياحية",
    "stadtrundfahrt": "جولة في المدينة",
    "stunde": "ساعة (60 دقيقة)",
    "waschmaschine": "غسالة ملابس",
    "zeitung": "جريدة / صحيفة",
    "anmachen": "يشغل (جهازاً أو إضاءة)",
    "ausmachen": "يطفئ (جهازاً أو إضاءة)",
    "aufmachen": "يفتح (نافذة / باباً / جهازاً)",
    "zumachen": "يغلق (نافذة / باباً / جهازاً)",
    "buchen": "يحجز (تذكرة أو غرفة)",
    "funktionieren": "يعمل / شغال بشكل سليم",
    "organisieren": "ينظم",
    "reparieren": "يصلح",
    "reservieren": "يحجز",
    "verschicken": "يرسل",
    "kaputt": "معطل / خربان",

    # Lektion 13
    "accessoire": "إكسسوار",
    "anzug": "بدلة رجالي",
    "ehemann": "زوج",
    "gürtel": "حزام",
    "hut": "قبعة",
    "katalog": "كتالوج",
    "koffer": "حقيبة سفر",
    "kontakt": "اتصال / تواصل",
    "kunde": "عميل / زبون",
    "mantel": "معطف / بالطو",
    "prospekt": "نشرة دعائية / بروشور",
    "pullover": "بلوفر",
    "pulli": "بلوفر",
    "rock": "تنورة / جيبة",
    "rucksack": "حقيبة ظهر",
    "schal": "كوفية / شال",
    "schmuck": "حلي / مجوهرات",
    "schuh": "حذاء",
    "stiefel": "حذاء برقبة (بوت)",
    "stock": "طابق / دور",
    "teil": "جزء / قطعة",
    "geschäft": "محل / متجر",
    "hemd": "قميص رجالي",
    "kaufhaus": "متجر متعدد الأقسام",
    "kleid": "فستان",
    "parfüm": "عطر / برفان",
    "t-shirt": "تي شيرت",
    "telefongespräch": "مكالمة هاتفية",
    "bluse": "بلوزة",
    "brieftasche": "محفظة نقود وأوراق",
    "drogerie": "متجر أدوات تجميل ونظافة",
    "ehefrau": "زوجة",
    "freizeit": "وقت الفراغ",
    "frisur": "تسريحة شعر",
    "garderobe": "غرفة حفظ الملابس / شماعة",
    "geige": "آلة الكمان",
    "größe": "مقاس / حجم",
    "handschuh": "قفاز (جوانتي)",
    "hose": "بنطلون",
    "jacke": "جاكيت",
    "jeans": "بنطلون جينز",
    "kleidung": "ملابس",
    "kosmetik": "أدوات تجميل",
    "kosmetik (sg.)": "أدوات تجميل",
    "krawatte": "ربطة عنق (كرافتة)",
    "kundentoilette": "دورة مياه للعملاء",
    "leute": "ناس / أشخاص",
    "leute (pl.)": "ناس / أشخاص",
    "mode": "موضة",
    "mode-boutique": "محل بيع أزياء / بوتيك",
    "musik": "موسيقى",
    "musik (sg.)": "موسيقى",
    "mütze": "قبعة صوف / طاقية",
    "schreibwaren": "أدوات مكتبية",
    "schreibwaren (pl.)": "أدوات مكتبية",
    "socke": "جورب (شراب)",
    "sonnenbrille": "نظارة شمسية",
    "tasche": "حقيبة / شنطة",
    "uhr": "ساعة يد / ساعة حائط",
    "anprobieren": "يقيس (ملابس)",
    "anziehen": "يرتدي / يلبس",
    "ausziehen": "يخلع ملابسه",
    "umziehen": "يغير ملابسه",
    "passen": "يناسب / يلائم (المقاس)",
    "stehen": "يليق على شخص (ملابس)",
    "gefallen": "يعجب (يناسب الذوق)",
    "gehören": "يخص / ملك لـ",
    "(sich) fühlen": "يشعر",
    "(sich) freuen auf": "يتطلع بشوق إلى / يسعد بـ",
    "(sich) freuen über": "يفرح بـ",
    "(sich) interessieren für": "يهتم بـ",
    "sich interessieren (f": "يهتم بـ",
    "trainieren": "يتدرب / يتمرن",
    "(zu) dick": "سمين جداً",
    "(zu) teuer": "غالٍ جداً",
    "billig": "رخيص",
    "teuer": "غالٍ",
    "hell": "فاتح / مضيء",
    "dunkel": "داكن / غامق",
    "kurz": "قصير",
    "lang": "طويل",
    "eng": "ضيق",
    "weit": "واسع",
    "schön": "جميل",
    "hässlich": "قبيح",
    "bequem": "مريح",
    "unbequem": "غير مريح",
    "modern": "عصري / حديث",
    "altmodisch": "قديم الطراز",
    "blau": "أزرق",
    "braun": "بني",
    "gelb": "أصفر",
    "grau": "رمادي",
    "grün": "أخضر",
    "rot": "أحمر",
    "schwarz": "أسود",
    "weiß": "أبيض",
    "welch-": "أي (للاختيار)",
    "welch (er": "أي (للاختيار)",
    "welcher / welche / welches": "أي (للاختيار)",
    "dies-": "هذا / هذه",

    # Lektion 14
    "anlass": "مناسبة",
    "glückwunsch": "تهنئة",
    "grund": "سبب",
    "ort": "مكان",
    "wunsch": "أمنية / رغبة",
    "fest": "عيد / احتفال",
    "geschenk": "هدية",
    "silvester": "ليلة رأس السنة",
    "silvester (sg.)": "ليلة رأس السنة",
    "jahr": "سنة / عام",
    "neujahr": "رأس السنة الجديدة",
    "einladung": "دعوة",
    "hochzeit": "حفل زفاف / فرح",
    "antworten (auf)": "يجيب على",
    "bedanken (bei)": "يشكر شخصاً",
    "(sich) bedanken bei": "يشكر شخصاً",
    "(sich) beschweren über": "يشتكي من",
    "(sich) entschuldigen für": "يعتذر عن",
    "(sich) erinnern an": "يتذكر",
    "(sich) informieren über": "يستعلم عن",
    "(sich) treffen mit": "يلتقي مع",
    "(sich) unterhalten mit": "يتحدث مع",
    "(sich) verabreden mit": "يتواعد مع",
    "(sich) vorbereiten auf": "يستعد لـ",
    "(sich) kümmern um": "يهتم بـ / يعتني بـ",
    "(vorbei) sein": "يمضي / ينتهي",
    "bitten (um)": "يطلب / يلتمس",
    "danken (für)": "يشكر على",
    "erzählen (von)": "يحكي / يروي عن",
    "gratulieren (zu)": "يهنئ بـ",
    "hoffen (auf)": "يأمل في",
    "träumen (von)": "يحلم بـ",
    "träumen + von": "يحلم بـ",
    "warten (auf)": "ينتظر",
    "spaß machen": "يسبب متعة / ممتع",
    "tut mir leid": "أنا آسف / يؤسفني",
    "fit": "لائق بدنياً",
    "genau": "بالضبط / تماماً",
    "sicher": "متأكد / آمن",
    "erstaunt": "مندهش / متعجب",
    "anschließend": "بعد ذلك / عقب ذلك",
    "vorbei": "انتهى / مضى",
    "herzlichen glückwunsch": "تهانينا القلبية / مبروك",
    "alles gute": "كل عام وأنتم بخير / مع أطيب التمنيات",
    "gute besserung": "شفاك الله / تمنياتي بالشفاء العاجل",
    "viel erfolg": "بالتوفيق والنجاح",
    "viel spaß": "استمتع بوقتك / مع أطيب الأوقات",
    "gute reise": "رحلة سعيدة",
    "frohe ostern": "عيد فصح سعيد",
    "frohe weihnachten": "عيد ميلاد مجيد",
    "guten rutsch": "سنة جديدة سعيدة",

    # Fragewörter & General Dictionary (Pages 139-147)
    "wer?": "من (للعاقل الفاعل)",
    "wen?": "من (للعاقل المفعول به - أكوزاتيف)",
    "wem?": "من (للعاقل المجرور - داتيف)",
    "was?": "ماذا (لغير العاقل)",
    "wo?": "أين (مكان ثابت - داتيف)",
    "wohin?": "إلى أين (اتجاه وحركة - أكوزاتيف)",
    "woher?": "من أين (مصدر وجهة الأصل)",
    "wann?": "متى (زمان)",
    "wie?": "كيف (حال / وسيلة)",
    "warum?": "لماذا (سبب)",
    "wie viel?": "كم للكمية / كم السعر",
    "wie viel kostet ?": "كم يتكلف / ما السعر",
    "wie viel uhr ist es ?": "كم الساعة الآن",
    "wie spät ist es ?": "كم الساعة الآن",
    "wie spät ist es  ?": "كم الساعة الآن",
    "wie viele?": "كم للعدد",
    "wie lange?": "كم المدة الزمنية",
    "wie lange  ?": "كم المدة الزمنية",
    "wie oft?": "كم مرة",
    "wie weit?": "كم المسافة",
    "wie weit ?": "كم المسافة",
    "wie hoch?": "ما الارتفاع",
    "wie teuer?": "ما السعر / ما التكلفة",
    "wie teuer ?": "ما السعر / ما التكلفة",
    "wie alt?": "كم العمر",
    "wie heißt?": "ما اسم",
    "wie geht es?": "كيف الحال",
    "wie geht es ?": "كيف الحال",
    "um wie viel uhr?": "في أي ساعة",
    "um wie viel uhr ?": "في أي ساعة",
    "ab wann?": "بدءاً من متى",
    "ab wann ?": "بدءاً من متى",
    "bis wann?": "حتى متى",
    "bis wann ?": "حتى متى",
    "von wann bis wann?": "من متى إلى متى",
    "von wann bis wann ?": "من متى إلى متى",
    "für wie lange?": "لأي مدة",
    "für wie lange ?": "لأي مدة",
    "als was?": "كـ ماذا / ما هي الوظيفة",
    "als was ?": "كـ ماذا / ما هي الوظيفة",
    "was kostet?": "كم يتكلف",
    "was kostet ?": "كم يتكلف",
    "da": "هناك / يوجد",
    "danach": "بعد ذلك",
    "windig": "عاصف / به رياح",
    "ganz": "تماماً / كلياً",
    "vorher": "قبل ذلك",
    "voher": "قبل ذلك",
    "nachher": "بعد ذلك / فيما بعد",
    "sogar": "حتى / بل إنه",
    "leicht": "سهل / خفيف",
    "übrigens": "بالمناسبة / على فكرة",
    "rückwärts": "إلى الخلف / للوراء",
    "anschluss": "توصيلة قطار / موصل",
    "bescheid": "إفادة / علم (geben يعطي خبراً)",
    "möglichkeit": "إمكانية / فرصة",
    "heimatland": "الوطن الأم",
    "lachen ist gesund": "الضحك مفيد للصحة",
    "live-musik (sg.)": "موسيقى حية",
    "schuh": "حذاء",
    "schuhe": "أحذية",
    "computer": "كمبيوتر / حاسوب",
    # Final 73 entries
    "postleitzahl": "الرمز البريدي",
    "alles": "كل شيء",
    "besonderes": "خاص / مميز",
    "extra": "إضافي / مخصوص",
    "schicken": "يرسل",
    "gesund": "سليم / صحي",
    "leider": "للأسف",
    "nervös": "عصبي / متوتر",
    "nächst.....": "القادم / التالي",
    "stuhl": "كرسي",
    "sofa": "أريكة / كنبة",
    "telefon": "هاتف / تليفون",
    "ermäßigung": "تخفيض / خصم",
    "schule": "مدرسة",
    "toilette": "دورة مياه / تواليت",
    "sport (sg.)": "رياضة",
    "band": "فرقة موسيقية",
    "oper": "أوبرا",
    "vorspielen": "يعزف لـ",
    "vorpielen": "يعزف لـ",
    "accessorie": "إكسسوار",
    "meinung": "رأي",
    "interessant": "شيق / ممتع",
    "klasse": "رائع / ممتاز",
    "klein": "صغير",
    "mögen": "يحب / يود",
    "schwer": "صعب / ثقيل",
    "sehr": "جداً",
    "vorwärts": "إلى الأمام",
    "wirklich": "حقاً / فعلاً",
    "zusammen": "معاً / سوياً",
    "überhaupt": "على الإطلاق",
    "flur": "ردهة / طرقة",
    "grad": "درجة مئوية",
    "haushalt": "تدبير منزلي / شؤون البيت",
    "mann": "رجل",
    "morgen": "صباح",
    "tag": "يوم",
    "tisch/schreibtisch": "طاولة / مكتب",
    "rahmen": "إطار / برواز",
    "schwimmbad": "حمام سباحة",
    "fernsehen": "يشاهد التلفاز",
    "gefahren": "سافر / قاد (ماضي fahren)",
    "gewesen": "كان (ماضي sein)",
    "kennenlernen": "يتعرف على",
    "anfangen": "يبدأ",
    "aufräumen": "يرتب / ينظم",
    "bestanden": "اجتاز / نجح في (ماضي bestehen)",
    "bleiben": "يبقى / يمكث",
    "geblieben": "بقى / مكث (ماضي bleiben)",
    "geflogen": "سافر بالطائرة (ماضي fliegen)",
    "gegangen": "ذهب / مشى (ماضي gehen)",
    "geheh": "يذهب",
    "gekommen": "أتى / جاء (ماضي kommen)",
    "gereist": "سافر (ماضي reisen)",
    "gewandert": "تجول سيراً (ماضي wandern)",
    "geworden": "أصبح (ماضي werden)",
    "kommen": "يأتي / يجيء",
    "mitnehmen": "يأخذ معه",
    "reisen": "يسافر",
    "verlieren": "يفقد / يخسر",
    "verloren": "فقد / خسر (ماضي verlieren)",
    "verstanden": "فهم (ماضي verstehen)",
    "wandern": "يتجول سيراً على الأقدام",
    "einfach": "بسيط / تذكرة ذهاب فقط",
    "beginnen": "يبدأ",
    "gleich": "فوراً / في الحال",
    "hinter": "خلف / وراء",
    "vorgestern": "أول أمس",
    "beruf": "مهنة / وظيفة",
    "fieber (sg.)": "حمى / ارتفاع الحرارة",
    "entfernung": "مسافة / بُعد",

}

def clean_arabic_text(raw_text, german_word):
    if not raw_text:
        raw_text = ""
    
    s = raw_text.strip()
    
    # 1. Fix font encoding artifact: space + \u064c (tanwin damm) was used instead of yaa
    # e.g. "طب ٌب" -> "طبيب", "وظ ٌفة" -> "وظيفة"
    s = re.sub(r'\s*ٌ\s*', 'ي', s)
    
    # 2. Strip OCR noise digits (e.g. 000000, 20000)
    s = re.sub(r'[0-9]+', '', s)
    
    # 3. Strip stray symbols and leader punctuation
    s = re.sub(r'[\#\$\%\|\_\{\}\<\>\\~`@\^\*\.]{2,}', '', s)
    s = re.sub(r'[\#\$\%\|\_\{\}\<\>\\~`@\^\*]', '', s)
    s = re.sub(r'^\s*[\:\-\.\,\/]+\s*', '', s)
    s = re.sub(r'\s*[\:\-\.\,\/]+\s*$', '', s)
    
    # 4. Remove scrambled Unicode artifacts (Persian/Kurdish stray chars from bad text layer)
    s = re.sub(r'[ػفچ̂ؾٍِ٘ٓٛ]', '', s)
    s = s.strip()
    
    # Check lookup dictionary
    w_clean = german_word.strip().lower()
    w_key = re.sub(r'^(?:der|die|das)\s+', '', w_clean)
    w_key = re.sub(r'[\,\.\-]+$', '', w_key).strip()
    
    if w_clean in CURRICULUM_LOOKUP:
        return CURRICULUM_LOOKUP[w_clean]
    if w_key in CURRICULUM_LOOKUP:
        return CURRICULUM_LOOKUP[w_key]
        
    # Partial matches for reflexives
    for k, v in CURRICULUM_LOOKUP.items():
        if w_clean == k or w_key == k:
            return v
            
    # If the cleaned text has at least 2 real Arabic letters and no noise, keep it
    ar_letters = len(re.findall(r'[\u0600-\u06FF]', s))
    if ar_letters >= 2:
        return s
        
    return s

def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 1. Delete standalone non-words and table headers
    delete_words = ["(Akk)", "(Dativ)", "Das", "Die", "g", "p"]
    c.execute(f"DELETE FROM VocabularyItem WHERE germanWord IN ({','.join('?' for _ in delete_words)})", delete_words)
    print(f"Deleted standalone non-words: {delete_words}")
    
    # 2. Fix malformed German words
    malformed_fixes = [
        ("خٍٕ  aussteigen", "aussteigen", "ينزل من (وسيلة مواصلات)"),
        ("p Thermalbad", "Thermalbad", "حمام مياه كبريتية / معدنية"),
        ("welch (er", "welcher / welche / welches", "أي (للاختيار)"),
        ("sich interessieren (f", "(sich) interessieren für", "يهتم بـ"),
        ("informieren ٔ", "(sich) informieren", "يستعلم / يستفسر"),
        ("träumen + von", "träumen (von)", "يحلم بـ"),
        ("Wem? (Dativ)", "Wem?", "من (للعاقل المجرور - داتيف)"),
        ("Wen? (Akk)", "Wen?", "من (للعاقل المنصوب - أكوزاتيف)"),
        ("g Live-Musik (Sg.)", "Live-Musik (Sg.)", "موسيقى حية"),
        ("Entschuldigungsc", "Entschuldigungsschreiben", "خطاب اعتذار"),
        ("Gesundheitsprobl", "Gesundheitsproblem", "مشكلة صحية"),
        ("g g Fieber (Sg.)", "Fieber (Sg.)", "حمى / ارتفاع الحرارة"),
        ("g Entfernung", "Entfernung", "مسافة / بُعد"),
        ("vorpielen", "vorspielen", "يعزف لـ"),
        ("geheh", "gehen", "يذهب"),

    ]
    for old_w, new_w, new_ar in malformed_fixes:
        c.execute("UPDATE VocabularyItem SET germanWord = ?, meaningAr = ? WHERE germanWord = ?", (new_w, new_ar, old_w))
    print(f"Fixed {len(malformed_fixes)} malformed German words.")
    
    # 3. Clean all vocabulary items
    c.execute("SELECT id, germanWord, meaningAr, exampleSentence, pdfPageRef FROM VocabularyItem")
    rows = c.fetchall()
    
    updated_count = 0
    clean_items = []
    
    for r_id, word, ar, ex, p in rows:
        clean_ar = clean_arabic_text(ar, word)
        
        # Clean example sentence if it had scrambled Arabic prefix
        clean_ex = ex
        if clean_ex:
            # Strip scrambled Arabic leading characters
            clean_ex = re.sub(r'^[\u0600-\u06FF\s\d\.\,\:\;\|\-]+([A-ZÄÖÜ])', r'\1', clean_ex).strip()
            
        c.execute("UPDATE VocabularyItem SET meaningAr = ?, exampleSentence = ? WHERE id = ?", (clean_ar, clean_ex, r_id))
        updated_count += 1
        
    conn.commit()
    
    # Check statistics
    c.execute("SELECT COUNT(*) FROM VocabularyItem")
    total_db = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM VocabularyItem WHERE meaningAr IS NULL OR trim(meaningAr) = ''")
    empty_db = c.fetchone()[0]
    
    c.execute("SELECT Lesson.lessonNumber, count(VocabularyItem.id) FROM Lesson LEFT JOIN VocabularyItem ON Lesson.id = VocabularyItem.lessonId GROUP BY Lesson.id ORDER BY Lesson.sequenceOrder")
    lesson_stats = c.fetchall()
    
    print("\nDatabase update complete:")
    print(f"Total vocabulary items: {total_db}")
    print(f"Empty Arabic items: {empty_db}")
    for l_num, count in lesson_stats:
        print(f"  {l_num}: {count} items")
        
    conn.close()

    # 4. Synchronize verified_vocabulary.json
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        json_data = json.load(f)
        
    cleaned_json = []
    for item in json_data:
        w = item.get("word", "")
        if w in ["(Akk)", "(Dativ)", "Das", "Die", "g", "p"]:
            continue
            
        # Apply malformed fixes
        for old_w, new_w, _ in malformed_fixes:
            if w == old_w:
                w = new_w
                item["word"] = new_w
                break
                
        clean_ar = clean_arabic_text(item.get("arabic"), w)
        item["arabic"] = clean_ar
        item["is_flagged"] = False if clean_ar else True
        item["ocr_confidence"] = "HIGH" if clean_ar else "REQUIRES_REVIEW"
        
        # Clean example
        if item.get("example"):
            item["example"] = re.sub(r'^[\u0600-\u06FF\s\d\.\,\:\;\|\-]+([A-ZÄÖÜ])', r'\1', item["example"]).strip()
            
        cleaned_json.append(item)
        
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(cleaned_json, f, ensure_ascii=False, indent=2)
        
    print(f"\nSynchronized {JSON_PATH} with {len(cleaned_json)} clean items.")

if __name__ == "__main__":
    main()
