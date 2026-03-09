# INITIATIVE_ENGINE_SPEC.md

Purpose:
Convert opportunities, risks, and strategic signals into structured initiatives that the FranchiseOS swarm can execute.

The Initiative Engine is the system that turns:

- a detected market opportunity
- a stalled sales opportunity
- an underperforming unit
- a campaign test recommendation

into a governed, trackable mission.

This engine must not blindly launch actions.
It must check legal, strategic, territorial, and operational constraints first.

It is the bridge between:
insight → action

---

# 1. Core Responsibilities

The Initiative Engine must:

1. receive initiative-worthy signals
2. classify the type of initiative
3. evaluate brand-specific constraints
4. determine whether action is allowed
5. determine whether approval is required
6. create initiative records
7. launch downstream agents when permitted
8. notify stakeholders when action is blocked or conditional
9. schedule reviews and success metrics
10. preserve reasoning in the decision log

This engine is not just a task creator.
It is the strategic mission layer of FranchiseOS.

---

# 2. Initiative Types

The Initiative Engine should support multiple initiative classes.

## 2.1 Market Expansion Initiative
Examples:
- Dallas demand spike
- Charlotte market activation
- Tampa localized campaign launch

## 2.2 Sales Acceleration Initiative
Examples:
- high-value lead requires white-glove follow-up
- proposal stalled
- validation path needs intervention

## 2.3 Franchisee Recovery Initiative
Examples:
- Unit 114 performance decline
- local marketing recovery plan
- coaching intervention

## 2.4 Brand Readiness Initiative
Examples:
- state filing needed
- territory model needs expansion
- local registration required before sales activity

## 2.5 Strategic Research Initiative
Examples:
- investigate emerging category demand
- run low-cost validation in unregistered state
- monitor market until filing decision

The v1 priority for this engine is:
- Market Expansion Initiative
- Brand Readiness Initiative

---

# 3. Core Inputs

The Initiative Engine receives signals from:

- MARKET_OPPORTUNITY_AGENT
- PATTERN_DETECTION_AGENT
- EXPANSION_RADAR
- SALES_PIPELINE_AGENT
- COACHING_AGENT
- manual dashboard triggers
- messaging approvals

Typical event examples:
- market.opportunity.detected
- market.recommendation.generated
- strategy.recommended
- pipeline.risk.detected
- unit.performance_drop
- initiative.requested.manually

---

# 4. Initiative Decision Framework

Before creating an initiative, the engine must evaluate five primary gates.

## Gate 1 — State Registration Gate
Question:
Is the brand currently registered or legally able to operate/sell in this state?

Example:
Dallas detected → state = Texas

Check:
- is Texas included in brand registration profile?
- is the franchise registered or filed where required?
- is there a legal restriction recorded?

Possible results:
- registered
- not_registered
- unknown
- restricted

If not registered:
Do not launch a full expansion initiative.
Instead:
- create Brand Readiness Initiative
- notify Zor
- recommend filing/registering in the state

---

## Gate 2 — Territory Availability Gate
Question:
Is there actually an available territory in the target market?

Checks:
- is territory open?
- is territory reserved?
- is territory sold?
- is territory blocked by overlap?
- does the target fall within permitted expansion geography?

Possible results:
- available
- partially_available
- reserved
- sold
- conflict

If not available:
Do not launch expansion initiative.
Possible next steps:
- notify sales team
- log market activity
- suggest territory redesign if strategic

---

## Gate 3 — Strategic Alignment Gate
Question:
Is this market part of the brand’s current growth strategy?

Checks:
- target states / provinces
- target cities / regions
- current quarterly priorities
- stage of brand maturity
- target franchisee profile in that region

Possible results:
- aligned
- adjacent
- outside_strategy

If outside strategy:
Do not auto-launch full initiative.
Possible next steps:
- notify Zor
- create Strategic Research Initiative
- recommend filing and strategic review

---

## Gate 4 — Initiative Duplication Gate
Question:
Is there already an active initiative for this market and brand?

Checks:
- existing initiatives by market
- recent campaign launches
- pending filings
- open readiness initiatives
- existing proposal pipeline in that territory

If duplicate exists:
- merge into current initiative
- update signals
- do not create duplicate

---

## Gate 5 — Confidence and Actionability Gate
Question:
Is the signal strong enough to justify action now?

Checks:
- opportunity score
- similarity to winners
- lead quality
- market readiness
- confidence from source agent

Possible outcomes:
- launch_now
- test_first
- watch
- blocked

---

# 5. Initiative Outcomes

After evaluating gates, the engine should produce one of four outcomes.

## Outcome A — Launch Expansion Initiative
Use when:
- state registered
- territory available
- market aligned with strategy
- no duplicate initiative
- confidence high

Result:
Create market expansion initiative and launch execution tasks.

Example actions:
- landing page
- email campaign
- social sequence
- retargeting audience
- CRO notification
- review in 14 days

---

## Outcome B — Launch Readiness Initiative
Use when:
- demand exists
- territory may be available
- but brand is not registered/filed in state

Result:
Create Brand Readiness Initiative.

Example actions:
- notify Zor
- log demand activity
- recommend filing/registration
- prepare state-entry packet
- hold full campaign launch until readiness complete

Suggested recommendation text:
“Demand detected in Texas, but the brand is not currently registered there. Recommend filing/registering before initiating franchise sales activity.”

---

## Outcome C — Launch Strategic Research Initiative
Use when:
- demand exists
- market is outside stated growth strategy
- but market activity may justify review

Result:
Create limited initiative.

Example actions:
- notify Zor
- log market as emerging
- monitor traffic and repeat visits
- generate market brief
- recommend strategy review

Suggested recommendation text:
“This market is showing meaningful demand but sits outside the current growth strategy. Recommend strategic review and possible state filing if leadership wants to pursue expansion.”

---

## Outcome D — Watch / No Initiative
Use when:
- weak signals
- territory unavailable
- duplication exists
- insufficient confidence

Result:
No full initiative.
Log market and continue monitoring.

---

# 6. Zor Notification Rules

Zor should be notified when:

1. strong market activity occurs in a state where the brand is not registered
2. strong market activity occurs outside current growth strategy
3. a readiness initiative is created
4. a filing or registration recommendation is generated
5. an opportunity is repeatedly surfacing in a blocked state

Notification channels:
- dashboard alert
- Slack
- email
- optional SMS for high-priority opportunities

Example Zor notification:

Title:
State Filing Opportunity Detected

Body:
Dallas, Texas is showing strong franchise demand signals for Brand X.
Current status:
- brand not registered in Texas
- territory availability appears open
- market is outside current active expansion map

Recommendation:
Review Texas registration / filing to unlock expansion opportunity.

---

# 7. Required Brand Parameters

The Initiative Engine must read these from the brand configuration layer.

## 7.1 Registered States / Jurisdictions
File:
brands/{brand}/registration_config.json

Example:
{
  "registered_states": ["Florida", "Georgia", "North Carolina"],
  "pending_states": ["Tennessee"],
  "restricted_states": ["California"]
}

---

## 7.2 Territory Availability Rules
File:
brands/{brand}/territory_rules.json

Example:
{
  "exclusive": true,
  "territory_population_min": 120000,
  "allow_partial_overlap": false
}

Live data should come from:
- territories table
- territory polygons
- ownership status

---

## 7.3 Growth Strategy Parameters
File:
brands/{brand}/growth_strategy.json

Example:
{
  "priority_regions": ["Southeast", "Texas"],
  "priority_states": ["Florida", "Georgia", "Texas"],
  "priority_market_types": ["suburban", "family_dense"],
  "current_expansion_mode": "aggressive"
}

---

## 7.4 State Filing Policy
File:
brands/{brand}/filing_policy.json

Example:
{
  "notify_zor_if_unregistered_activity": true,
  "allow_research_in_unregistered_states": true,
  "allow_marketing_in_unregistered_states": false,
  "auto_create_readiness_initiative": true
}

---

# 8. Initiative Decision Logic

Pseudo-logic for Market Expansion Initiative creation:

```text
if event_type == market.opportunity.detected:

  load brand registration config
  load territory status
  load growth strategy
  load filing policy
  check duplicate initiatives
  check confidence threshold

  if state not registered:
      create readiness initiative
      notify Zor
      recommend filing/registering
      stop expansion launch

  else if territory not available:
      log blocked opportunity
      notify if high priority
      stop expansion launch

  else if market outside growth strategy:
      create strategic research initiative
      notify Zor
      recommend strategy review
      if filing needed, include filing recommendation
      stop full launch

  else if confidence >= launch threshold:
      create expansion initiative
      trigger campaign tasks
      schedule review

  else:
      log watch state
      continue monitoring