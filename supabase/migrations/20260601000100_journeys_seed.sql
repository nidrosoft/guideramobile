-- Guidera "Journeys" module — seed (spec §19)

-- ── Categories (16) ────────────────────────────────────────────────
insert into journey_categories
  (slug,name,subtitle,"group",icon,tint,is_popular,has_subhubs,sort_order,monetization_model,risk_tier,is_sensitive,requires_disclaimer,ai_definition,ai_emphasis,ai_section_order,ai_critical_sections)
values
 ('medical','Medical & Cosmetic','Treatment abroad','health','stethoscope','#C75D58',true,true,1,'lead_gen','high',false,true,
   'Affordable, quality surgery, dental, hair restoration and cosmetic care abroad.',
   'Lead with real costs vs home, the step-by-step process, honest risks, and recovery/aftercare.',
   array['quick_facts','costs','process','risks','aftercare','things_to_know','top_destinations','providers','community','faq']::text[],
   array['costs','process','risks','aftercare','providers']::text[]),
 ('relocation','Relocation & Expat','Move & settle','living','building','#3D6FB0',true,false,2,'affiliate','medium',false,false,
   'Long-term moving and expat life: visas, cost of living, housing and settling in.',
   'Lead with the move process, logistics, cost of living and the local expat community.',
   array['quick_facts','costs','process','logistics','things_to_know','top_destinations','risks','community','faq']::text[],
   array['process','logistics','costs','community']::text[]),
 ('nomad','Digital Nomad','Work from anywhere','living','briefcase','#6E5BC9',true,false,3,'affiliate','low',false,false,
   'Remote-work bases: nomad visas, internet, monthly cost and community.',
   'Lead with logistics (visa, internet, cost) and the nomad community.',
   array['quick_facts','logistics','costs','things_to_know','top_destinations','community','risks','faq']::text[],
   array['quick_facts','logistics','costs','community']::text[]),
 ('wellness','Wellness & Retreats','Reset & recharge','health','sun','#D89A3D',true,false,4,'affiliate','medium',false,false,
   'Retreats, yoga, detox and spiritual reset travel.',
   'Lead with why here, realistic costs and honest risks (unregulated retreats).',
   array['quick_facts','why_here','costs','things_to_know','top_destinations','risks','providers','community','faq']::text[],
   array['costs','risks','why_here']::text[]),
 ('retire','Retirement Abroad','Retire well for less','living','heart','#2E9B7E',false,false,7,'affiliate','medium',false,false,
   'Retiring abroad on a fixed income: healthcare, cost of living, climate and visas.',
   'Lead with monthly costs, healthcare and logistics, and the retiree community.',
   array['quick_facts','costs','logistics','community','process','things_to_know','risks','faq']::text[],
   array['costs','logistics','community']::text[]),
 ('fertility','Fertility & IVF','Family-building abroad','health','baby','#C95D8A',false,false,8,'lead_gen','high',false,true,
   'IVF, egg donation and surrogacy abroad where the legal framework matters.',
   'Lead with what is legally permitted, cost per cycle, the process and community.',
   array['quick_facts','legal','costs','process','things_to_know','community','risks','providers','faq']::text[],
   array['legal','costs','process','community']::text[]),
 ('solo','Solo Female','Travel solo, safely','purpose','shield','#B5546E',true,false,5,'affiliate','medium',false,false,
   'Solo female travel with a focus on safety and connection.',
   'Lead with safety, practical know-how and the community.',
   array['quick_facts','risks','things_to_know','community','top_destinations','costs','faq']::text[],
   array['risks','things_to_know','community']::text[]),
 ('study','Study Abroad','Learn overseas','purpose','cap','#4574B5',true,false,6,'affiliate','low',false,false,
   'Universities, semesters and language study abroad.',
   'Lead with why here, what to know, and realistic costs.',
   array['quick_facts','why_here','things_to_know','costs','process','top_destinations','logistics','risks','community','faq']::text[],
   array['why_here','things_to_know','costs']::text[]),
 ('pilgrimage','Pilgrimage & Faith','Sacred journeys','purpose','footprints','#9A7B53',true,false,9,'affiliate','medium',false,false,
   'Faith and spiritual sites, routes and pilgrimages.',
   'Lead with why here, what to know and practical logistics.',
   array['quick_facts','why_here','things_to_know','costs','process','top_destinations','logistics','risks','community','faq']::text[],
   array['why_here','things_to_know','costs']::text[]),
 ('adventure','Adventure & Expedition','Trek, climb, explore','purpose','mountain','#3E7D5A',false,false,10,'affiliate','medium',false,false,
   'Trekking, climbing, expeditions and big-nature travel.',
   'Lead with why here, what to know and honest risks.',
   array['quick_facts','why_here','things_to_know','costs','process','top_destinations','logistics','risks','community','faq']::text[],
   array['why_here','things_to_know','costs']::text[]),
 ('heritage','Heritage & Ancestry','Roots & reconnection','purpose','dna','#7A6A9E',false,false,11,'affiliate','low',false,false,
   'Ancestry, roots and diaspora reconnection travel.',
   'Lead with why here and what to know.',
   array['quick_facts','why_here','things_to_know','costs','process','top_destinations','logistics','risks','community','faq']::text[],
   array['why_here','things_to_know','costs']::text[]),
 ('longevity','Longevity & Biohacking','Advanced health','health','heartpulse','#5FA45C',false,false,12,'lead_gen','high',false,true,
   'Advanced diagnostics, biohacking and longevity clinics abroad.',
   'Lead with what to know, costs and honest risks; avoid medical claims.',
   array['quick_facts','why_here','things_to_know','costs','process','top_destinations','logistics','risks','community','faq']::text[],
   array['why_here','things_to_know','costs']::text[]),
 ('cbi','Citizenship/Investment','Second passports','living','landmark','#4A6670',false,false,13,'lead_gen','high',false,true,
   'Citizenship and residency by investment ("golden" programs).',
   'Lead with what to know, the process and honest risks; no legal advice.',
   array['quick_facts','why_here','things_to_know','costs','process','top_destinations','logistics','risks','community','faq']::text[],
   array['why_here','things_to_know','costs']::text[]),
 ('worldschool','Worldschooling','Educate on the move','living','backpack','#C77F3A',false,false,14,'affiliate','low',false,false,
   'Families educating kids abroad and family gap years.',
   'Lead with why here, what to know and logistics for families.',
   array['quick_facts','why_here','things_to_know','costs','process','top_destinations','logistics','risks','community','faq']::text[],
   array['why_here','things_to_know','costs']::text[]),
 ('volunteer','Volunteer & Aid','Give back abroad','purpose','handshake','#C26B5A',false,false,15,'affiliate','medium',false,false,
   'Humanitarian, conservation and community work abroad.',
   'Lead with why here, what to know and honest risks (voluntourism ethics).',
   array['quick_facts','why_here','things_to_know','costs','process','top_destinations','logistics','risks','community','faq']::text[],
   array['why_here','things_to_know','costs']::text[]),
 ('family','Family & Multigen','Travel together','purpose','users','#D88A5A',false,false,16,'affiliate','low',false,false,
   'Multigenerational and family travel.',
   'Lead with why here, what to know and logistics for all ages.',
   array['quick_facts','why_here','things_to_know','costs','process','top_destinations','logistics','risks','community','faq']::text[],
   array['why_here','things_to_know','costs']::text[])
on conflict (slug) do nothing;

-- ── Sub-hubs (Medical) ─────────────────────────────────────────────
insert into journey_subhubs (category_id, slug, name, icon, tint, blurb, stat, ai_focus, sort_order)
select c.id, v.slug, v.name, v.icon, v.tint, v.blurb, v.stat, v.ai_focus, v.sort_order
from journey_categories c
join (values
  ('dental','Dental','smile','#3FA0A6','Implants, crowns, veneers — 50–90% less','Fastest-growing','Focus on dental work: implants, crowns, veneers, full-mouth restoration.',1),
  ('hair','Hair Restoration','sparkles','#C77F3A','FUE & DHI transplants','1M+ patients/yr in Turkey','Focus on hair restoration: FUE, DHI, beard and graft counts.',2),
  ('cosmetic','Cosmetic & Surgical','activity','#C75D58','Aesthetic & elective surgery','Highest-value','Focus on aesthetic and elective cosmetic surgery.',3)
) as v(slug,name,icon,tint,blurb,stat,ai_focus,sort_order) on true
where c.slug = 'medical'
on conflict (category_id, slug) do nothing;

-- ── Countries (working set) ────────────────────────────────────────
insert into journey_countries (code,name,continent,flag_emoji) values
 ('TR','Turkey','Asia','🇹🇷'),('MX','Mexico','Americas','🇲🇽'),('HU','Hungary','Europe','🇭🇺'),
 ('TH','Thailand','Asia','🇹🇭'),('KR','South Korea','Asia','🇰🇷'),('BR','Brazil','Americas','🇧🇷'),
 ('PT','Portugal','Europe','🇵🇹'),('ES','Spain','Europe','🇪🇸'),('AE','United Arab Emirates','Asia','🇦🇪'),
 ('ID','Indonesia','Asia','🇮🇩'),('CO','Colombia','Americas','🇨🇴'),('IN','India','Asia','🇮🇳'),
 ('CR','Costa Rica','Americas','🇨🇷'),('PA','Panama','Americas','🇵🇦'),('CZ','Czechia','Europe','🇨🇿'),
 ('GR','Greece','Europe','🇬🇷'),('GB','United Kingdom','Europe','🇬🇧'),('US','United States','Americas','🇺🇸'),
 ('CA','Canada','Americas','🇨🇦'),('DE','Germany','Europe','🇩🇪'),('AU','Australia','Oceania','🇦🇺'),
 ('JP','Japan','Asia','🇯🇵'),('IS','Iceland','Europe','🇮🇸'),('NZ','New Zealand','Oceania','🇳🇿'),
 ('SA','Saudi Arabia','Asia','🇸🇦'),('IT','Italy','Europe','🇮🇹'),('NP','Nepal','Asia','🇳🇵'),
 ('CL','Chile','Americas','🇨🇱'),('IE','Ireland','Europe','🇮🇪'),('GH','Ghana','Africa','🇬🇭'),
 ('KE','Kenya','Africa','🇰🇪'),('PE','Peru','Americas','🇵🇪'),('ZA','South Africa','Africa','🇿🇦'),
 ('CH','Switzerland','Europe','🇨🇭'),('KN','St Kitts & Nevis','Americas','🇰🇳'),('MT','Malta','Europe','🇲🇹'),
 ('VU','Vanuatu','Oceania','🇻🇺'),('CM','Cameroon','Africa','🇨🇲')
on conflict (code) do nothing;

-- ── Curated hero guides (§19.5) ──

insert into journey_guides (category_id, subhub_id, country_code, focus, status, source, is_published, hook, fit_tags, headline_tag, rating, cost_band, content, prompt_version, confidence, generated_at)
select c.id, s.id, 'TR', 'Hair Restoration', 'curated', 'curated', true,
  'World-class hair & dental work at a fraction of Western prices — but vet clinics carefully.',
  array['FUE','DHI','Dental','Beard']::text[], 'Hair · Dental · Cosmetic', 4.6, '$',
  '{"hero": {"hook": "The world''s busiest hub for hair restoration and dental work \u2014 Istanbul alone has thousands of clinics. World-class results at a fraction of Western prices, but quality varies widely, so vetting is everything.", "fitTags": ["FUE", "DHI", "Dental", "Beard"], "focus": "Hair Restoration"}, "quickFacts": [{"icon": "trending-down", "label": "vs US/UK", "value": "60\u201380% less"}, {"icon": "clock", "label": "Typical stay", "value": "3\u20135 days"}, {"icon": "languages", "label": "English", "value": "In most clinics"}, {"icon": "badge-check", "label": "Accreditation", "value": "JCI clinics exist"}], "sections": [{"type": "costs", "title": "What it costs", "universal": true, "rows": [{"item": "FUE transplant", "abroad": "$1,800\u20133,500", "home": "$8,000\u201315,000"}, {"item": "DHI transplant", "abroad": "$2,500\u20134,000", "home": "$10,000\u201318,000"}, {"item": "Hotel & transfers", "abroad": "Often included", "home": "\u2014"}], "note": "Packages frequently bundle hotel, transfers, and a translator."}, {"type": "process", "title": "The process", "steps": ["Free online consult + photo assessment of the donor area", "Receive an itemized quote and package", "Travel; clinic arranges airport pickup", "Procedure day (FUE/DHI, ~6\u20138 hours)", "Wash and aftercare briefing the next day", "Fly home after a 1-day buffer; remote follow-ups at 3/6/12 months"]}, {"type": "risks", "title": "Risks & red flags", "items": ["Many high-volume clinics let technicians, not surgeons, do key steps \u2014 confirm who operates.", "Unusually cheap packages can mean cut corners on graft counts or hygiene.", "Get the exact graft number in writing and verify before/after photos are the clinic''s own.", "Arrange travel insurance that covers elective procedures abroad."]}, {"type": "aftercare", "title": "Aftercare & recovery", "isNew": true, "items": ["Do not fly for at least 24 hours after the procedure \u2014 grafts are fragile.", "Expect ~10\u201314 days of redness/scabbing before looking ''normal''.", "Shock loss is common at weeks 2\u20138; real regrowth begins around 3\u20134 months.", "Final results show at 12\u201318 months \u2014 confirm the clinic''s remote check-in plan first."]}, {"type": "things_to_know", "title": "Things to know", "universal": true, "items": ["Istanbul is the epicenter; Antalya is a cheaper, beach-side alternative for recovery.", "Most clinics bundle hotel, transfers, and a translator.", "Visa-free or e-visa for most nationalities \u2014 confirm before booking.", "Always plan a buffer day after the procedure before flying."]}, {"type": "top_destinations", "title": "Top destinations", "places": [{"name": "Istanbul", "note": "Highest clinic density; JCI options"}, {"name": "Antalya", "note": "Cheaper; recover by the sea"}, {"name": "Izmir", "note": "Quieter; growing dental scene"}]}, {"type": "faq", "title": "FAQ", "faqs": [{"q": "Is it safe?", "a": "It can be, at accredited clinics with a licensed surgeon \u2014 but quality varies widely, so verification matters."}]}], "faqs": [], "sources": [{"label": "General medical-tourism reputation; verify specifics independently"}], "confidence": 0.82, "requiresDisclaimer": true, "generatedNote": null}'::jsonb, 3, 0.82, now()
from journey_categories c join journey_subhubs s on s.category_id=c.id and s.slug='hair'
where c.slug='medical'
on conflict (cache_key) do nothing;


insert into journey_guides (category_id, country_code, focus, status, source, is_published, hook, fit_tags, headline_tag, rating, cost_band, content, prompt_version, confidence, generated_at)
select c.id, 'PT', 'Relocation & Expat', 'curated', 'curated', true,
  'Western Europe''s most popular soft landing — mild, affordable, English-friendly, with clear residency paths.',
  array['D7 Visa','Expat hubs','EU access']::text[], 'Relocation · Expat', 4.7, '$$',
  '{"hero": {"hook": "Western Europe''s most popular soft landing: mild climate, low cost for the region, broad English, and clear residency paths. Lisbon and Porto anchor big expat communities, with cheaper living inland and in the Algarve.", "fitTags": ["D7 Visa", "Expat hubs", "EU access"], "focus": "Relocation & Expat"}, "quickFacts": [{"icon": "trending-down", "label": "Cost of living", "value": "30\u201345% below US"}, {"icon": "badge-check", "label": "Visa", "value": "D7 / digital nomad"}, {"icon": "languages", "label": "Language", "value": "English widely used"}, {"icon": "heartpulse", "label": "Healthcare", "value": "Strong public + private"}], "sections": [{"type": "costs", "title": "Cost of living", "universal": true, "rows": [{"item": "1-bed rent (city)", "abroad": "$900\u20131,500/mo", "home": "$1,800\u20133,000/mo"}, {"item": "Couple monthly budget", "abroad": "$2,000\u20133,000", "home": "$4,000\u20136,000"}, {"item": "Private health insurance", "abroad": "$50\u2013120/mo", "home": "$400\u2013700/mo"}], "note": "Lisbon/Porto cost more; the Algarve and interior are notably cheaper."}, {"type": "process", "title": "The move process", "steps": ["Pick a visa route (D7 passive-income, or digital-nomad visa)", "Get a NIF (tax number) and open a local bank account", "Show proof of income/savings and accommodation", "Apply at the consulate; receive entry visa", "Land, register, and book your residency appointment", "Exchange for the residence permit; renew on schedule toward long-term/PR"]}, {"type": "logistics", "title": "Logistics", "items": ["NIF + bank account are the first practical steps; a local fiscal representative helps.", "Public healthcare (SNS) plus affordable private cover is common for expats.", "Fast fiber internet in cities; coworking is widespread in Lisbon, Porto, Lagos.", "EU membership means easy travel across Schengen once resident."]}, {"type": "things_to_know", "title": "Things to know", "universal": true, "items": ["Lisbon housing is competitive \u2014 line up rentals early.", "Tax rules change; confirm current residency/tax treatment before moving.", "Bureaucracy is slow \u2014 build in buffer time for appointments.", "Learning basic Portuguese smooths daily life outside tourist zones."]}, {"type": "top_destinations", "title": "Where to base", "places": [{"name": "Lisbon", "note": "Biggest expat scene, jobs, flights"}, {"name": "Porto", "note": "Cheaper than Lisbon, great quality of life"}, {"name": "Algarve (Lagos/Faro)", "note": "Sun, beaches, big retiree community"}]}, {"type": "risks", "title": "Risks & watch-outs", "items": ["Housing shortages and rising rents in Lisbon/Porto.", "Visa/tax policy shifts \u2014 verify the current rules, not last year''s.", "Income/savings thresholds must be genuinely met and documented.", "Appointment backlogs can delay residency \u2014 plan around them."]}, {"type": "faq", "title": "FAQ", "faqs": [{"q": "Is the D7 the right visa?", "a": "The D7 suits people with stable passive income (pensions, rentals, dividends); remote workers often use the digital-nomad visa instead. Confirm current criteria."}]}], "faqs": [], "sources": [{"label": "General expat/residency reputation; verify current visa & tax rules"}], "confidence": 0.8, "requiresDisclaimer": false, "generatedNote": null}'::jsonb, 3, 0.80, now()
from journey_categories c where c.slug='relocation'
on conflict (cache_key) do nothing;

