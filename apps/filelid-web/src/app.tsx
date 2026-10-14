import {
  ArrowDown,
  ArrowUpRight,
  Clock3,
  CornerDownRight,
  Feather,
  FileImage,
  FileText,
  Link2,
  Orbit,
  Upload,
} from 'lucide-react'
import { UploadPanel } from './components/upload-panel'
import { SharePage } from './pages/share-page'

export function App() {
  const path = window.location.pathname
  const shareRoute = path.match(
    /^\/s\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i,
  )
  const home = path === '/'

  return (
    <div className="site-shell">
      <header className="site-header">
        <a href="/" className="brand" aria-label="Filelid home">
          <span className="brand-symbol">
            <Orbit size={29} strokeWidth={1.7} />
          </span>
          filelid<span className="brand-period">.</span>
        </a>
        <div className="header-right">
          {home && (
            <a href="#how-it-works" className="header-link">
              The short version <ArrowDown size={13} />
            </a>
          )}
          <span className="header-note mono">
            <span className="live-dot" /> NO SIGN-UP. JUST SEND.
          </span>
        </div>
      </header>

      {home ? (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="hero-eyebrow mono">
                <span className="eyebrow-line" /> A LITTLE SPACE. A SHORT STAY.
              </div>
              <h1>
                Files for now.
                <br />
                <em>Not forever.</em>
                <span className="headline-dot">*</span>
              </h1>
              <p className="hero-description">
                Some things don&apos;t need a permanent address.
                <br />
                Drop your files, share a link, and let time
                <br className="desktop-break" /> take care of the rest.
              </p>
              <div className="hero-details">
                <span>
                  <Feather size={16} /> Light on commitment.
                </span>
                <span>
                  <Clock3 size={16} /> Gone on schedule.
                </span>
              </div>
              <div className="file-art" aria-hidden="true">
                <div className="art-orbit" />
                <div className="art-file art-file-back">
                  <FileText size={30} strokeWidth={1} />
                  <span className="mono">notes.pdf</span>
                </div>
                <div className="art-file art-file-front">
                  <FileImage size={32} strokeWidth={1} />
                  <span className="mono">a-good-day.jpg</span>
                  <span className="art-file-dot" />
                </div>
                <span className="art-label mono">
                  HERE TODAY.
                  <br />
                  GONE WHEN YOU SAY.
                </span>
                <CornerDownRight className="art-arrow" size={30} strokeWidth={1} />
              </div>
              <div className="hero-postscript mono">
                <span>*</span> BIG IDEAS. SMALL FOOTPRINT.
              </div>
            </div>
            <div className="hero-upload">
              <div className="upload-top-note mono">
                <span>LESS FRICTION. MORE SHARING.</span>
                <span>EST. NOW</span>
              </div>
              <UploadPanel />
              <p className="upload-below-note">
                For the drafts, the moments, the <em>just-for-nows.</em>
              </p>
            </div>
          </section>

          <section className="how-it-works" id="how-it-works" aria-label="How Filelid works">
            <div className="how-heading">
              <span className="mono">THE SHORT VERSION</span>
              <p>
                A send-off.
                <br />
                <em>Not a storage plan.</em>
              </p>
            </div>
            <article className="how-step">
              <div className="how-step-top">
                <span className="mono">01 / DROP</span>
                <Upload size={19} strokeWidth={1.3} />
              </div>
              <h3>A little of anything.</h3>
              <p>
                Up to 10 files, 100 MB total.
                <br />
                No accounts. No extra steps.
              </p>
            </article>
            <article className="how-step">
              <div className="how-step-top">
                <span className="mono">02 / SHARE</span>
                <Link2 size={19} strokeWidth={1.3} />
              </div>
              <h3>One link does it.</h3>
              <p>
                Copy it. Send it. Anyone with
                <br />
                the link can get your files.
              </p>
            </article>
            <article className="how-step">
              <div className="how-step-top">
                <span className="mono">03 / DISAPPEAR</span>
                <Clock3 size={19} strokeWidth={1.3} />
              </div>
              <h3>Time takes care of it.</h3>
              <p>
                Choose 1 hour, 24 hours, or 7 days.
                <br />
                We handle the cleanup.
              </p>
            </article>
          </section>
        </main>
      ) : shareRoute?.[1] ? (
        <SharePage id={shareRoute[1]} />
      ) : (
        <main className="share-page">
          <div className="share-card empty-card">
            <h1>
              A wrong
              <br />
              <em>turn.</em>
            </h1>
            <p>There&apos;s nothing at this address.</p>
            <a href="/" className="primary-button">
              Back to Filelid <ArrowUpRight size={18} />
            </a>
          </div>
        </main>
      )}

      <footer className="site-footer">
        <span className="mono">FILELID / LESS TO HOLD ON TO.</span>
        <span>
          Made for passing things along.<span className="footer-spark">*</span>
        </span>
      </footer>
    </div>
  )
}
