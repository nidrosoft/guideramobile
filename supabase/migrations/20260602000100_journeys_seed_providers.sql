-- Journeys: sample verified providers + a checklist template (Phase 2 preview).
-- Provider names are illustrative directory slots (verification_notes marks them
-- as samples); ranking is by quality_score/is_verified, never by payment.

insert into journey_providers
  (category_id, subhub_id, country_code, name, provider_type, summary, contact, accreditations, is_verified, verified_at, verification_notes, quality_score, tier, monetization)
select c.id, s.id, 'TR', v.name, 'clinic', v.summary, '{}'::jsonb, v.accred, true, now(),
       'Sample verified listing for preview.', v.qs, 'verified', 'lead_gen'
from journey_categories c
join journey_subhubs s on s.category_id = c.id and s.slug = 'hair'
join (values
  ('Istanbul Hair Restoration Center', 'High-volume FUE/DHI center with surgeon-led procedures and English-speaking coordinators.', array['JCI','ISO']::text[], 0.92),
  ('Antalya Aesthetic Clinic', 'Coastal clinic pairing recovery with lower package pricing; ISO-accredited facilities.', array['ISO']::text[], 0.85)
) as v(name, summary, accred, qs) on true
where c.slug = 'medical'
on conflict do nothing;

insert into journey_providers
  (category_id, country_code, name, provider_type, summary, contact, accreditations, is_verified, verified_at, verification_notes, quality_score, tier, monetization)
select c.id, 'PT', v.name, 'relocation_firm', v.summary, '{}'::jsonb, '{}'::text[], true, now(),
       'Sample verified listing for preview.', v.qs, 'verified', 'affiliate'
from journey_categories c
join (values
  ('Lisbon Relocation Partners', 'End-to-end D7/digital-nomad visa support, NIF, banking and housing search.', 0.90),
  ('Porto Settle-In Services', 'Bilingual relocation concierge for families moving to northern Portugal.', 0.83)
) as v(name, summary, qs) on true
where c.slug = 'relocation'
on conflict do nothing;

-- Pre-departure checklist template (Medical)
insert into journey_checklist_templates (category_id, items)
select c.id, '[
  {"key":"passport","label":"Valid passport (6+ months)","phase":"before","info":"Check expiry and visa-free/e-visa eligibility."},
  {"key":"consult","label":"Complete online consultation + photo assessment","phase":"before"},
  {"key":"quote","label":"Get an itemized quote (incl. graft count) in writing","phase":"before"},
  {"key":"insurance","label":"Arrange travel insurance covering elective procedures","phase":"before"},
  {"key":"meds","label":"Pause blood thinners / alcohol as advised","phase":"before","info":"Confirm timing with the clinic."},
  {"key":"buffer","label":"Book a buffer day before flying home","phase":"during"},
  {"key":"aftercare","label":"Confirm the remote follow-up plan (3/6/12 months)","phase":"after"}
]'::jsonb
from journey_categories c where c.slug = 'medical'
on conflict (category_id) do nothing;
