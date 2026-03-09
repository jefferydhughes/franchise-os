---
name: Skill Samurai Agent Config
type: brand-override
brand: skill-samurai
version: "1.0"
---

# Skill Samurai -- Agent Configuration Overrides

Brand-specific overrides applied on top of default FranchiseOS agent behaviours
when `brand_id = "skill-samurai"`. Every section below is merged into the
corresponding base agent at runtime via the brand-engine config loader.

---

## 1. CEO Agent Overrides

| Field | Override Value |
|-------|---------------|
| persona | "Visionary STEM education franchise CEO focused on measurable learning outcomes and global impact" |
| tone | Inspirational, data-driven, education-first |
| strategic_priorities | `["student_outcome_impact", "franchisee_unit_economics", "international_expansion"]` |
| expansion_corridor | AU (home market) -> CA (Canada) -> EG (Egypt) |
| kpi_north_star | Active enrolled students per territory |
| board_report_cadence | Fortnightly (AU school term aligned) |
| escalation_keywords | `["safeguarding", "child_safety", "curriculum_breach", "WWCC"]` |

---

## 2. Territory Intelligence Overrides

### Scoring Weight Adjustments

| Factor | Default Weight | Skill Samurai Weight | Rationale |
|--------|---------------|---------------------|-----------|
| school_density | 0.10 | 0.25 | Proximity to schools is primary demand driver |
| family_demographics | 0.10 | 0.20 | Households with children aged 6-14 |
| household_income | 0.15 | 0.15 | No change |
| competitor_density | 0.15 | 0.10 | Fewer direct STEM franchise competitors |
| population_growth | 0.15 | 0.10 | Reduced -- established suburbs still viable |
| foot_traffic | 0.15 | 0.05 | Less relevant -- parents drive children to class |
| commercial_vacancy | 0.10 | 0.05 | Small footprint, flexible on space |
| public_transport | 0.10 | 0.10 | No change |

### Preferred Location Types

- Within 2 km of primary/secondary schools
- Shopping centres with after-school foot traffic
- Community/recreation centres with spare rooms
- Co-located with complementary kids' activities (dance, martial arts)

### Data Enrichment Sources

- ABS (Australian Bureau of Statistics) -- family composition by SA2
- ACARA school directory -- school locations and enrolment counts
- Google Places API -- nearby competitor coding/STEM programs

---

## 3. Lead Scoring Overrides

100-point lead scoring model weighted for education franchise alignment:

| Dimension | Points | Criteria |
|-----------|--------|----------|
| Education Alignment | 25 | Teaching background (+10), STEM degree (+8), parent of school-age children (+5), volunteer coach/tutor (+2) |
| Financial Capacity | 30 | Liquid capital >= $80K AUD (+15), net worth >= $250K (+10), existing business owner (+5) |
| Community Connection | 20 | Local school network (+8), active in community orgs (+6), existing social following (+4), lives in target territory (+2) |
| Business Experience | 15 | Prior franchise experience (+8), people management 3+ yrs (+4), sales/marketing skills (+3) |
| Multi-Unit Potential | 10 | Interest in 2+ territories (+5), corporate background with scale experience (+3), investor profile (+2) |

### Score Thresholds

- **Hot (80-100):** Auto-schedule discovery call within 24 hrs
- **Warm (60-79):** Nurture sequence + webinar invite
- **Cool (40-59):** Drip content, quarterly check-in
- **Cold (<40):** Archive, annual re-engagement email

---

## 4. Onboarding Checklist

Skill Samurai-specific onboarding steps triggered after `franchise.sold` event:

1. **Working With Children Check (WWCC)** -- Submit state/territory WWCC application; upload clearance number to compliance dashboard
2. **Franchise Agreement Execution** -- Countersign agreement, lodge with ACCC franchise registry
3. **Curriculum Platform Access** -- Provision login to Skill Samurai LMS; assign Scratch, Python, Robotics module packs
4. **Instructor Training Program** -- Complete 40-hour blended training (20 hrs online + 20 hrs in-centre with master trainer)
5. **Technology Kit Setup** -- Order and configure student laptops, robotics kits (Lego Spike / VEX), 3D printers per centre spec
6. **Centre Fit-Out Inspection** -- Brand compliance check on signage, classroom layout, safety (electrical, ergonomics)
7. **Trial Classes (Soft Launch)** -- Run 2 weeks of free trial classes; collect parent feedback via NPS survey
8. **Local Marketing Activation** -- School letterbox drop, Google Ads geo-campaign, Facebook community group launch
9. **Grand Opening Event** -- Coordinate open day with HQ marketing support, local press, school partnerships
10. **30-Day Health Check** -- Coaching agent reviews enrolment velocity, class fill rates, parent satisfaction; flags issues to COO

---

## 5. Compliance

### Australian Child Safe Standards

- All staff and franchisees must hold a current WWCC for their state/territory
- Centres must comply with the National Principles for Child Safe Organisations
- NSW-specific: alignment with Children's Guardian Act 2019 requirements
- Incident reporting workflow escalates to CEO agent + compliance dashboard within 1 hour

### Data Privacy (Children)

- Student PII stored in isolated Supabase schema with RLS per franchise unit
- No student data shared with third-party analytics without explicit parental consent
- Data retention: student records purged 12 months after last enrolment
- COPPA-equivalent controls for any US expansion; GDPR controls for UK/EU

### International Compliance Matrix

| Market | Key Requirement | Status |
|--------|----------------|--------|
| Australia (AU) | WWCC, Child Safe Standards, ACCC Franchising Code | Active |
| Canada (CA) | Provincial child welfare checks, PIPEDA privacy | Planned |
| Egypt (EG) | Ministry of Education registration, local partner structure | Planned |

---

## 6. Content Strategy

### STEM Themes

All content generated by the Content Strategy and Social Content agents must
align with these recurring themes:

- **Code Creators** -- Student project spotlights (Scratch games, Python apps)
- **Robot Builders** -- Robotics competition prep, build diaries
- **Future Skills** -- AI literacy, digital citizenship, computational thinking
- **Parent Guides** -- "Why STEM matters" explainers, screen time balance tips
- **Franchisee Stories** -- Owner journey profiles, unit milestone celebrations

### Seasonal Campaign Calendar (AU School Calendar)

| Period | Campaign | Channel Focus |
|--------|----------|---------------|
| Jan (Term 1 start) | "New Year, New Skills" enrolment drive | Google Ads, school flyers, Facebook |
| Mar-Apr (Term 1 end) | Easter holiday intensive workshops | Instagram, local press |
| Apr (Term 2 start) | "Autumn of AI" themed module launch | Email nurture, LinkedIn (parents) |
| Jun-Jul (Term 2 end) | Winter holiday coding camps | Facebook events, school newsletters |
| Jul (Term 3 start) | Mid-year enrolment push + referral program | SMS, WhatsApp, Google Ads |
| Sep-Oct (Term 3 end) | Spring robotics competition season | Instagram reels, YouTube shorts |
| Oct (Term 4 start) | "Summer of STEM" early-bird sign-ups | Email, Facebook, school partnerships |
| Dec (Term 4 end) | Student showcase + awards night | PR, social media highlights, parent NPS |

### Content Rules

- All imagery must feature diverse children aged 6-14 in learning contexts
- No stock photos of empty classrooms; prefer action shots of students coding/building
- Brand voice: encouraging, curiosity-driven, jargon-free for parents
- Every social post must include one educational takeaway or student achievement
