import { Link } from 'react-router-dom';
import { HeroMock } from '../components/landing/HeroMock';
import {
  IconOverview,
  IconTasks,
  IconProof,
  IconVouch,
  IconStandings,
  IconAddCrew,
  IconSettings,
} from '../components/SidebarIcons';

const steps = [
  { num: '01', title: 'Join a crew', body: 'Get an invite code from a friend or start your own. No random strangers — just people who actually care if you show up.' },
  { num: '02', title: 'Get your tasks', body: 'The owner sets crew-wide tasks. You set personal ones. Daily, weekly, or one-time — whatever fits the grind.' },
  { num: '03', title: 'Send proof', body: 'Done? Snap a screenshot. No honor system. Your crew sees what you actually did.' },
  { num: '04', title: 'Get vouched', body: 'Crew members vouch or reject. Hit the threshold and it counts. Miss it, and it doesn\'t.' },
  { num: '05', title: 'Climb the standings', body: 'Points stack. Streaks grow. You\'ll know exactly where you rank — and so will everyone else.' },
];

const features = [
  {
    icon: <IconAddCrew />,
    title: 'Crews & roles',
    body: 'Create a crew, share an invite code, and split owner vs. member permissions. Owners set the tone; everyone pulls weight.',
  },
  {
    icon: <IconTasks />,
    title: 'Group & personal tasks',
    body: 'Shared crew tasks and solo personal tasks. Daily, weekly, or one-time deadlines — recurring schedules built in.',
  },
  {
    icon: <IconProof />,
    title: 'Send proof',
    body: 'Upload a photo or screenshot when you finish. Quick, visual, hard to fake — built for the way you actually work.',
  },
  {
    icon: <IconVouch />,
    title: 'Peer vouching',
    body: 'Your crew vouches or rejects each submission. Set how many vouches it takes before proof counts. Democracy, but for homework.',
  },
  {
    icon: <IconStandings />,
    title: 'Standings & streaks',
    body: 'Points for vouched proof. Streaks for consistency. A crew standings board that updates as people actually deliver.',
  },
  {
    icon: <IconOverview />,
    title: 'Your dashboard',
    body: 'See your rank, points, what\'s due now, and how many proofs need your vouch — all in one place.',
  },
];

const faqs = [
  { q: 'Is this just another habit tracker?', a: 'No. Vouch is built for groups. Your proof doesn\'t count until your crew vouches for it. That\'s the whole point.' },
  { q: 'What if someone lies?', a: 'That\'s why proof is visual and vouching is peer-reviewed. Your crew decides what counts — not an algorithm.' },
  { q: 'Can I use it solo?', a: 'You need a crew — but a crew can be two people. Accountability works better with someone watching.' },
];

const testimonials = [
  { quote: 'We finally stopped saying "I\'ll study later." Screenshots don\'t lie, and neither do we.', role: 'Sample quote — study crew of 4' },
  { quote: 'It\'s like having a gym buddy, but for everything you keep putting off.', role: 'Sample quote — morning routine crew' },
  { quote: 'The standings are petty. That\'s why it works.', role: 'Sample quote — roommate accountability crew' },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <Link to="/" className="landing-logo font-display">Vouch</Link>
          <nav className="landing-nav-links" aria-label="Main">
            <button type="button" onClick={() => scrollTo('how-it-works')}>How it works</button>
            <button type="button" onClick={() => scrollTo('features')}>Features</button>
            <button type="button" onClick={() => scrollTo('faq')}>FAQ</button>
          </nav>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-link-btn">Log in</Link>
            <Link to="/signup" className="btn btn-accent">Join a crew</Link>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="label-caps">Peer accountability, but make it a crew</p>
            <h1 className="landing-hero-title font-display">
              Say you&apos;ll do it.<br />Then prove it.
            </h1>
            <p className="landing-hero-sub">
              Vouch is where proof plus crew approval turns completed tasks into points and standings.
              Finish a task, send proof, get vouched — that&apos;s the loop.
            </p>
            <div className="landing-hero-ctas">
              <Link to="/signup" className="btn btn-accent">Start a crew</Link>
              <button type="button" className="btn btn-ghost" onClick={() => scrollTo('how-it-works')}>
                See how it works
              </button>
            </div>
          </div>
          <div className="landing-hero-visual">
            <HeroMock />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <div className="landing-container">
          <p className="label-caps">How it works</p>
          <h2 className="landing-section-title font-display">The loop your crew runs on</h2>
          <ol className="landing-steps">
            {steps.map((step) => (
              <li key={step.num} className="landing-step">
                <span className="landing-step-num font-mono">{step.num}</span>
                <div>
                  <h3 className="landing-step-title font-display">{step.title}</h3>
                  <p className="landing-step-body">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="landing-section landing-section-raised">
        <div className="landing-container">
          <p className="label-caps">Features</p>
          <h2 className="landing-section-title font-display">Everything a crew needs to stay honest</h2>
          <div className="landing-features">
            {features.map((f) => (
              <article key={f.title} className="landing-feature">
                <div className="landing-feature-icon" aria-hidden>{f.icon}</div>
                <h3 className="landing-feature-title font-display">{f.title}</h3>
                <p className="landing-feature-body">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container landing-trust">
          <div className="landing-trust-copy">
            <p className="label-caps">Why crews work</p>
            <h2 className="landing-section-title font-display">
              Willpower fades.<br />Your crew doesn&apos;t.
            </h2>
            <p className="landing-trust-body">
              Solo apps let you check a box and lie. Vouch makes your crew the judge.
              When someone&apos;s waiting to vouch your proof, &quot;I&apos;ll do it tomorrow&quot; gets a lot harder to sell.
            </p>
          </div>
          <div className="landing-testimonials">
            {testimonials.map((t) => (
              <blockquote key={t.role} className="landing-quote">
                <p>&ldquo;{t.quote}&rdquo;</p>
                <footer>{t.role}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-raised">
        <div className="landing-container landing-roadmap">
          <div className="landing-roadmap-icon" aria-hidden><IconSettings /></div>
          <div>
            <p className="label-caps">What&apos;s next</p>
            <h2 className="landing-section-title font-display">More ways to compete — eventually</h2>
            <p className="landing-roadmap-body">
              Badges for streak milestones and crew-vs-crew standings are on the horizon.
              For now, we&apos;re focused on nailing the core loop: task, proof, vouch, standings.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="landing-section">
        <div className="landing-container landing-faq-wrap">
          <p className="label-caps">FAQ</p>
          <h2 className="landing-section-title font-display">Quick answers</h2>
          <dl className="landing-faq">
            {faqs.map((item) => (
              <div key={item.q} className="landing-faq-item">
                <dt className="landing-faq-q font-display">{item.q}</dt>
                <dd className="landing-faq-a">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="landing-cta-band">
        <div className="landing-container landing-cta-inner">
          <h2 className="font-display landing-cta-title">
            Ready to stop vouching for your own excuses?
          </h2>
          <p className="landing-cta-sub">Start a crew. Set the bar. Send proof.</p>
          <Link to="/signup" className="btn landing-cta-btn">Get started — it&apos;s free</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div>
            <p className="landing-logo font-display">Vouch</p>
            <p className="landing-footer-tagline">Proof + crew approval = points that count.</p>
          </div>
          <nav className="landing-footer-nav" aria-label="Footer">
            <button type="button" onClick={() => scrollTo('how-it-works')}>How it works</button>
            <button type="button" onClick={() => scrollTo('features')}>Features</button>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </nav>
          <p className="landing-footer-copy">&copy; {new Date().getFullYear()} Vouch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
