import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import './landing.css'

export const metadata: Metadata = {
  title: 'zorspace — Your AI Franchise HQ',
  description:
    '20 AI agents replace the HQ staff you can\'t afford. Territory intelligence, lead scoring, campaign execution, franchisee coaching — running 24/7 for a fraction of one salary.',
}

export default async function LandingPage() {
  const { userId } = await auth()

  return (
    <div className="landing-page">
      {/* ── NAV ── */}
      <nav className="landing-nav">
        <Link href="/" className="landing-nav-logo">
          zor<span>space</span>
        </Link>
        <div className="landing-nav-links">
          <a href="#agents">Agents</a>
          <a href="#warroom">War Room</a>
          <a href="#how">How It Works</a>
          {userId ? (
            <Link href="/war-room" className="landing-btn-login">
              Dashboard &rarr;
            </Link>
          ) : (
            <Link href="/sign-in" className="landing-btn-login">
              Log In
            </Link>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="landing-hero-badge">
            <span className="dot" /> 20 AI agents. Always on.
          </div>
          <h1>
            Your franchise HQ.
            <br />
            <em>Without the headcount.</em>
          </h1>
          <p className="landing-hero-sub">
            zorspace gives emerging franchise brands a full AI-powered headquarters — territory
            intelligence, lead scoring, campaign execution, franchisee coaching — running 24/7 for a
            fraction of one salary.
          </p>
          <div className="landing-hero-cta">
            <a href="#demo" className="landing-btn-primary">
              Book a Demo &rarr;
            </a>
            <a href="#warroom" className="landing-btn-secondary">
              See the War Room
            </a>
          </div>
          <div className="landing-hero-stat-row">
            <div className="landing-hero-stat">
              <div className="num">20</div>
              <div className="label">AI Agents</div>
            </div>
            <div className="landing-hero-stat">
              <div className="num">24/7</div>
              <div className="label">Always Running</div>
            </div>
            <div className="landing-hero-stat">
              <div className="num">350+</div>
              <div className="label">New Brands/Year</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="landing-problem">
        <div className="landing-container">
          <span className="landing-section-label">The Problem</span>
          <h2 className="landing-section-title">
            You launched a franchise.
            <br />
            Now you need an army.
          </h2>
          <p className="landing-section-sub">
            Every new franchise brand needs marketing, sales, territory analysis, onboarding,
            compliance, and coaching. That&apos;s 6+ hires before you sell a single unit.
          </p>
          <div className="landing-problem-grid">
            <div className="landing-pain-list">
              <div className="landing-pain-item">
                <div className="landing-pain-icon">&#128176;</div>
                <div>
                  <h4>Staffing costs are brutal</h4>
                  <p>
                    A VP of Development, marketing manager, and operations lead will cost $300K+
                    before you see revenue.
                  </p>
                </div>
              </div>
              <div className="landing-pain-item">
                <div className="landing-pain-icon">&#9203;</div>
                <div>
                  <h4>You&apos;re doing everything yourself</h4>
                  <p>
                    Answering leads at midnight. Building territory proposals in Google Sheets.
                    Writing franchise brochures on weekends.
                  </p>
                </div>
              </div>
              <div className="landing-pain-item">
                <div className="landing-pain-icon">&#128200;</div>
                <div>
                  <h4>Opportunities slip through</h4>
                  <p>
                    Hot territories cool off. Leads go stale. Competitors move into markets you
                    flagged months ago.
                  </p>
                </div>
              </div>
              <div className="landing-pain-item">
                <div className="landing-pain-icon">&#128556;</div>
                <div>
                  <h4>The stress is unsustainable</h4>
                  <p>
                    You didn&apos;t build a brand to burn out. But without a team, every function
                    depends on you.
                  </p>
                </div>
              </div>
            </div>
            <div className="landing-cost-card">
              <div className="big-num">$300K+</div>
              <div className="cost-label">Typical year-one HQ staffing cost</div>
              <div className="divider" />
              <div className="versus">zorspace replaces this with</div>
              <div className="zor-price">20 AI Agents</div>
              <div className="zor-sub">Working around the clock. No salaries. No turnover.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION: AGENTS ── */}
      <section className="landing-solution" id="agents">
        <div className="landing-container">
          <span className="landing-section-label">The Swarm</span>
          <h2 className="landing-section-title">A full executive team. Powered by AI.</h2>
          <p className="landing-section-sub center">
            Every agent has a defined role, personality, and set of tools. They coordinate through an
            event-driven system — detecting opportunities, executing campaigns, and coaching
            franchisees autonomously.
          </p>
          <div className="landing-agents-grid">
            {/* Executive */}
            <AgentCard tier="exec" icon="&#129332;" name="CEO Agent" desc="Strategic oversight. Growth priorities. Risk detection. Your AI chief of staff." />
            <AgentCard tier="exec" icon="&#128176;" name="CRO Agent" desc="Revenue leadership. Pipeline management. Franchise sales acceleration." />
            <AgentCard tier="exec" icon="&#9881;" name="COO Agent" desc="Operations backbone. Onboarding. Training. Compliance. Support escalation." />
            <AgentCard tier="exec" icon="&#128227;" name="CMO Agent" desc="Marketing direction. Campaign approval. Brand voice enforcement across channels." />
            {/* Department */}
            <AgentCard tier="dept" icon="&#127758;" name="Territory Intelligence" desc="Scores and ranks territories by demand, competition, and demographic fit." />
            <AgentCard tier="dept" icon="&#128269;" name="Market Opportunity" desc="Detects demand surges in unsold territories before your competitors do." />
            <AgentCard tier="dept" icon="&#127919;" name="Lead Intelligence" desc="Scores every inbound lead. Routes hot prospects to your pipeline instantly." />
            <AgentCard tier="dept" icon="&#128200;" name="Sales Pipeline" desc="Tracks deal progression. Detects stalls. Triggers follow-up sequences automatically." />
            <AgentCard tier="dept" icon="&#128640;" name="Campaign Agent" desc="Orchestrates multi-channel campaigns across email, social, and landing pages." />
            <AgentCard tier="dept" icon="&#127891;" name="Coaching Agent" desc="Monitors franchisee performance. Delivers personalized coaching plans." />
            <AgentCard tier="dept" icon="&#128075;" name="Onboarding Agent" desc="Activates new franchisees with sequenced onboarding — training, setup, first 90 days." />
            <AgentCard tier="dept" icon="&#128161;" name="Pattern Detection" desc="Finds cross-system patterns. Why did Dallas convert? What's working in Tampa?" />
            {/* Worker */}
            <AgentCard tier="worker" icon="&#128196;" name="Landing Pages" desc="Generates localized franchise recruitment pages on demand." />
            <AgentCard tier="worker" icon="&#9993;" name="Email Agent" desc="Writes outreach and nurture sequences tuned to your brand voice." />
            <AgentCard tier="worker" icon="&#128247;" name="Social Content" desc="Creates localized social campaigns for every market you target." />
            <AgentCard tier="worker" icon="&#128202;" name="Report Agent" desc="Executive summaries. Operational reports. Delivered daily, on time, every time." />
          </div>
        </div>
      </section>

      {/* ── WAR ROOM ── */}
      <section className="landing-warroom" id="warroom">
        <div className="landing-container">
          <span className="landing-section-label">Command Center</span>
          <h2 className="landing-section-title">The War Room</h2>
          <p className="landing-section-sub center">
            One screen. Every signal. Ask your AI team anything in plain English.
          </p>
          <div className="landing-warroom-mockup">
            <div className="landing-mockup-bar">
              <div className="landing-mockup-dot r" />
              <div className="landing-mockup-dot y" />
              <div className="landing-mockup-dot g" />
              <div className="landing-mockup-url">zorspace.io/war-room</div>
            </div>
            <div className="landing-mockup-body">
              {/* Command Bar */}
              <div className="landing-wr-widget full" style={{ marginBottom: 16 }}>
                <div className="landing-wr-cmd">
                  <span style={{ color: 'var(--accent-bright)' }}>&#128269;</span>
                  Ask zorspace anything...
                  <div className="cursor-blink" />
                </div>
              </div>
              <div className="landing-wr-grid">
                {/* Opportunity Radar */}
                <div className="landing-wr-widget">
                  <h5>&#128308; Opportunity Radar</h5>
                  <div className="landing-wr-opp">
                    <div className="landing-wr-opp-item">
                      <span className="landing-wr-opp-dot" style={{ background: 'var(--red)' }} />
                      <span>Dallas, TX</span>
                      <span className="landing-wr-opp-score">Score: 94</span>
                    </div>
                    <div className="landing-wr-opp-item">
                      <span className="landing-wr-opp-dot" style={{ background: 'var(--yellow)' }} />
                      <span>Tampa, FL</span>
                      <span className="landing-wr-opp-score">Score: 81</span>
                    </div>
                    <div className="landing-wr-opp-item">
                      <span className="landing-wr-opp-dot" style={{ background: 'var(--yellow)' }} />
                      <span>Austin, TX</span>
                      <span className="landing-wr-opp-score">Score: 77</span>
                    </div>
                    <div className="landing-wr-opp-item">
                      <span className="landing-wr-opp-dot" style={{ background: 'var(--green)' }} />
                      <span>Charlotte, NC</span>
                      <span className="landing-wr-opp-score">Score: 68</span>
                    </div>
                  </div>
                </div>
                {/* Swarm Activity */}
                <div className="landing-wr-widget">
                  <h5>&#9889; Swarm Activity</h5>
                  <div className="landing-wr-feed">
                    <div className="landing-wr-feed-item">
                      <span className="landing-wr-feed-time">2m ago</span>
                      <span className="landing-wr-feed-agent" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-bright)' }}>CMO</span>
                      <span>Approved Dallas campaign brief</span>
                    </div>
                    <div className="landing-wr-feed-item">
                      <span className="landing-wr-feed-time">8m ago</span>
                      <span className="landing-wr-feed-agent" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--green)' }}>LEAD</span>
                      <span>Scored 3 new inbound leads</span>
                    </div>
                    <div className="landing-wr-feed-item">
                      <span className="landing-wr-feed-time">14m ago</span>
                      <span className="landing-wr-feed-agent" style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--orange)' }}>EMAIL</span>
                      <span>Sent nurture sequence #4</span>
                    </div>
                    <div className="landing-wr-feed-item">
                      <span className="landing-wr-feed-time">22m ago</span>
                      <span className="landing-wr-feed-agent" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-bright)' }}>CEO</span>
                      <span>Flagged Tampa territory overlap risk</span>
                    </div>
                  </div>
                </div>
                {/* Pipeline */}
                <div className="landing-wr-widget">
                  <h5>&#128200; Pipeline</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>Discovery</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>12</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ width: '70%', height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>Proposal Sent</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>5</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ width: '45%', height: '100%', background: 'var(--yellow)', borderRadius: 3 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>Closing</span>
                      <span style={{ fontWeight: 700, color: 'var(--green)' }}>2</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ width: '25%', height: '100%', background: 'var(--green)', borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="landing-how" id="how">
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <span className="landing-section-label">How It Works</span>
          <h2 className="landing-section-title">Live in 3 steps</h2>
          <p className="landing-section-sub center">
            No code. No IT department. No 6-month implementation.
          </p>
          <div className="landing-how-steps">
            <div className="landing-how-step">
              <div className="step-num">1</div>
              <h4>Upload your brand</h4>
              <p>
                Brand voice, territory rules, ideal franchisee profile, marketing playbook. We
                configure your agents to match your brand DNA.
              </p>
            </div>
            <div className="landing-how-step">
              <div className="step-num">2</div>
              <h4>Agents go live</h4>
              <p>
                20 agents activate and begin monitoring territories, scoring leads, executing
                campaigns, and coaching franchisees — immediately.
              </p>
            </div>
            <div className="landing-how-step">
              <div className="step-num">3</div>
              <h4>You run the War Room</h4>
              <p>
                Open your dashboard, ask questions in plain English, approve initiatives, and watch
                your brand grow while your agents do the heavy lifting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="landing-proof">
        <div className="landing-container">
          <span className="landing-section-label">Trusted By</span>
          <h2 className="landing-section-title">Brands already on zorspace</h2>
          <div className="landing-logo-row">
            <div className="landing-logo-item">Skill Samurai</div>
            <div className="landing-logo-item">Beakid</div>
            <div className="landing-logo-item">Koolminds</div>
            <div className="landing-logo-item">Tiger Adjusters</div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="landing-final-cta" id="demo">
        <div className="landing-container">
          <h2>
            Stop hiring.
            <br />
            Start deploying.
          </h2>
          <p>
            See how 20 AI agents can replace your HQ staffing gap — in a 30-minute demo.
          </p>
          <a
            href="https://calendly.com"
            className="landing-btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Book Your Demo &rarr;
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-container">
          &copy; 2026 zorspace. Built for franchise founders who refuse to wait.
        </div>
      </footer>
    </div>
  )
}

/* ── Helper component ── */
function AgentCard({
  tier,
  icon,
  name,
  desc,
}: {
  tier: 'exec' | 'dept' | 'worker'
  icon: string
  name: string
  desc: string
}) {
  const tierLabels = { exec: 'Executive', dept: 'Department', worker: 'Worker' }
  const tierBg = {
    exec: 'rgba(99,102,241,0.15)',
    dept: 'rgba(34,197,94,0.12)',
    worker: 'rgba(249,115,22,0.12)',
  }

  return (
    <div className="landing-agent-card">
      <span className={`landing-tier-label landing-tier-${tier}`}>{tierLabels[tier]}</span>
      <div className="agent-icon" style={{ background: tierBg[tier] }} dangerouslySetInnerHTML={{ __html: icon }} />
      <h4>{name}</h4>
      <p>{desc}</p>
    </div>
  )
}
