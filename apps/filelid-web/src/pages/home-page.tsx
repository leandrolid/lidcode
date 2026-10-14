import { Clock3, CornerDownRight, Feather, FileImage, FileText, Link2, Upload } from 'lucide-react'
import { UploadPanel } from '../components/upload-panel'
import { useLanguage } from '../lib/i18n'

export function HomePage() {
  const { t } = useLanguage()

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow mono">
            <span className="eyebrow-line" /> {t('hero.eyebrow')}
          </div>
          <h1>
            {t('hero.title')}
            <br />
            <em>{t('hero.titleEmphasis')}</em>
            <span className="headline-dot">*</span>
          </h1>
          <p className="hero-description">
            {t('hero.description')}
            <br />
            {t('hero.descriptionStart')}
            <br className="desktop-break" /> {t('hero.descriptionEnd')}
          </p>
          <div className="hero-details">
            <span>
              <Feather size={16} /> {t('hero.light')}
            </span>
            <span>
              <Clock3 size={16} /> {t('hero.scheduled')}
            </span>
          </div>
          <div className="file-art" aria-hidden="true">
            <div className="art-orbit" />
            <div className="art-file art-file-back">
              <FileText size={30} strokeWidth={1} />
              <span className="mono">{t('hero.exampleDocument')}</span>
            </div>
            <div className="art-file art-file-front">
              <FileImage size={32} strokeWidth={1} />
              <span className="mono">{t('hero.exampleImage')}</span>
              <span className="art-file-dot" />
            </div>
            <span className="art-label mono">
              {t('hero.artToday')}
              <br />
              {t('hero.artGone')}
            </span>
            <CornerDownRight className="art-arrow" size={30} strokeWidth={1} />
          </div>
          <div className="hero-postscript mono">
            <span>*</span> {t('hero.postscript')}
          </div>
        </div>
        <div className="hero-upload">
          <div className="upload-top-note mono">
            <span>{t('hero.uploadNote')}</span>
            <span>{t('hero.established')}</span>
          </div>
          <UploadPanel />
          <p className="upload-below-note">
            {t('hero.belowNote')} <em>{t('hero.belowEmphasis')}</em>
          </p>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works" aria-label={t('how.label')}>
        <div className="how-heading">
          <span className="mono">{t('how.shortVersion')}</span>
          <p>
            {t('how.title')}
            <br />
            <em>{t('how.titleEmphasis')}</em>
          </p>
        </div>
        <article className="how-step">
          <div className="how-step-top">
            <span className="mono">{t('how.drop')}</span>
            <Upload size={19} strokeWidth={1.3} />
          </div>
          <h3>{t('how.dropTitle')}</h3>
          <p>
            {t('how.dropLimit')}
            <br />
            {t('how.dropDescription')}
          </p>
        </article>
        <article className="how-step">
          <div className="how-step-top">
            <span className="mono">{t('how.share')}</span>
            <Link2 size={19} strokeWidth={1.3} />
          </div>
          <h3>{t('how.shareTitle')}</h3>
          <p>
            {t('how.shareStart')}
            <br />
            {t('how.shareEnd')}
          </p>
        </article>
        <article className="how-step">
          <div className="how-step-top">
            <span className="mono">{t('how.disappear')}</span>
            <Clock3 size={19} strokeWidth={1.3} />
          </div>
          <h3>{t('how.disappearTitle')}</h3>
          <p>
            {t('how.disappearOptions')}
            <br />
            {t('how.disappearDescription')}
          </p>
        </article>
      </section>
    </main>
  )
}
