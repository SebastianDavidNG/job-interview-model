import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../lib/config';
import { SESSION_CONFIG_STORAGE_KEY } from './storageKeys';
import {
  type SimLang,
  LANG_NATIVE_NAMES,
  SIM_LANGS,
  WIZARD_LANGUAGE_GATE,
  WIZARD_UI,
  loadSavedWizardLocale,
} from './wizardI18n';

type InterviewType = 'behavioral' | 'technical' | 'mixed' | 'hr' | 'live_coding';
type ResponseStyle = 'concise' | 'bullet_points' | 'detailed';
type CaptureMode = 'extension' | 'virtual_device' | 'display_media';

function interviewLangLabel(
  ai: (typeof WIZARD_UI)['es']['ai'],
  code: string
): string {
  if (code === 'auto') return ai.langAuto;
  const map: Record<string, string> = {
    es: ai.langEs,
    en: ai.langEn,
    pt: ai.langPt,
    fr: ai.langFr,
    de: ai.langDe
  };
  return map[code] ?? code;
}

export const SessionConfigWizard: React.FC = () => {
  const navigate = useNavigate();
  const [uiLocale, setUiLocale] = useState<SimLang | null>(() => loadSavedWizardLocale());
  const [step, setStep] = useState(1);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [niceSkills, setNiceSkills] = useState<string[]>([]);

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>('mixed');

  const [candidateName, setCandidateName] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('3');
  const [technologiesUsed, setTechnologiesUsed] = useState('');
  const [keyAchievements, setKeyAchievements] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  const [interviewLanguage, setInterviewLanguage] = useState<'auto' | 'es' | 'en' | 'pt' | 'fr' | 'de'>(() => {
    return loadSavedWizardLocale() ?? 'es';
  });
  const [responseLanguage, setResponseLanguage] = useState<'es' | 'en' | 'pt' | 'fr' | 'de'>(() => loadSavedWizardLocale() ?? 'es');
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>('concise');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('extension');

  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [testing, setTesting] = useState(false);
  const [stepError, setStepError] = useState('');

  const w = useMemo(() => WIZARD_UI[uiLocale ?? 'es'], [uiLocale]);

  /** Keep HTML lang, AI language picks, and UI copy aligned with the interface language chosen in step 1. */
  useEffect(() => {
    if (!uiLocale) return;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', uiLocale);
    }
    try {
      localStorage.setItem('ip_ui_locale', uiLocale);
    } catch {
      /* ignore */
    }
    setResponseLanguage(uiLocale);
    setInterviewLanguage(uiLocale);
  }, [uiLocale]);

  useEffect(() => {
    if (!uiLocale) setStep(1);
  }, [uiLocale]);

  const validateStep = (current: number): boolean => {
    if (current === 2) {
      if (!jobTitle.trim() || !company.trim() || !jobDescription.trim() || requiredSkills.length === 0) {
        setStepError(w.errors.stepJob);
        return false;
      }
    }
    if (current === 3) {
      if (!keyAchievements.trim() || !resumeSummary.trim()) {
        setStepError(w.errors.stepProfile);
        return false;
      }
    }
    setStepError('');
    return true;
  };

  const handleAddSkill = (value: string, target: 'required' | 'nice') => {
    const cleaned = value
      .split(',')
      .flatMap((s) => {
        const trimmed = s.trim();
        return trimmed ? [trimmed] : [];
      });
    if (!cleaned.length) return;
    if (target === 'required') {
      setRequiredSkills((prev) => Array.from(new Set([...prev, ...cleaned])));
    } else {
      setNiceSkills((prev) => Array.from(new Set([...prev, ...cleaned])));
    }
  };

  const handleLaunch = async () => {
    if (!uiLocale) return;
    const sessionId = 'ses_' + Math.random().toString(36).slice(2, 10);
    const config = {
      uiLocale,
      jobTitle,
      company,
      jobDescription,
      requiredSkills,
      niceToHaveSkills: niceSkills,
      interviewType,
      salaryRange,
      candidateName,
      currentRole,
      yearsOfExperience,
      technologiesUsed,
      keyAchievements,
      resumeSummary,
      resumeFileName,
      additionalContext,
      interviewLanguage,
      responseLanguage,
      responseStyle,
      captureMode
    };

    localStorage.setItem(SESSION_CONFIG_STORAGE_KEY, JSON.stringify(config));
    localStorage.setItem('ip_session', sessionId);

    try {
      await fetch(`${SERVER_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, config })
      });
    } catch {
      // modo demo: continuar aunque el server no responda
    }

    navigate(`/session/${sessionId}`);
  };

  const testMicrophone = async () => {
    if (testing) return;
    setTesting(true);
    setTestStatus('idle');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setTestStatus('ok');
    } catch {
      setTestStatus('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080b09', color: '#c8e8d4', fontFamily: `'DM Mono', monospace` }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 40px',
          borderBottom: '1px solid #1e2e24',
          background: 'rgba(8,11,9,0.9)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1.5px solid #00d97e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#00d97e',
                boxShadow: '0 0 10px #00d97e'
              }}
            />
          </div>
          <span style={{ fontFamily: 'Syne, system-ui', fontWeight: 700 }}>
            Interview<span style={{ color: '#00d97e' }}>Pilot</span>
          </span>
        </div>
        <span style={{ fontSize: 11, letterSpacing: '0.1em', color: '#384d3e' }}>
          {uiLocale ? w.headerSubtitle : ''}
        </span>
      </header>

      <main
        style={{
          display: 'grid',
          gridTemplateColumns: uiLocale ? '260px 1fr' : '1fr',
          maxWidth: uiLocale ? 1000 : 640,
          margin: '0 auto',
          padding: '48px 40px',
          gap: 48
        }}
      >
        {uiLocale ? (
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {w.navSteps.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setStep(idx + 1)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                border: '1px solid transparent',
                background:
                  step === idx + 1 ? 'rgba(0,217,126,0.15)' : 'transparent',
                opacity: step > idx + 1 ? 0.8 : 1
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: `1.5px solid ${step === idx + 1 ? '#00d97e' : '#2a3d31'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: step === idx + 1 ? '#000' : '#384d3e',
                  background: step === idx + 1 ? '#00d97e' : 'transparent'
                }}
              >
                {idx + 1}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.05em',
                    color: step === idx + 1 ? '#00d97e' : '#6a8f78',
                    textTransform: 'uppercase',
                    marginBottom: 3
                  }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: 10, color: '#384d3e' }}>{s.desc}</div>
              </div>
            </button>
          ))}
        </aside>
        ) : null}

        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {step === 1 && (
            <>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.18em', color: '#00d97e', textTransform: 'uppercase' }}>
                  {uiLocale ? w.lang.badge : '01 / 05'}
                </span>
                {!uiLocale ? (
                  <>
                    <h1
                      style={{
                        fontFamily: 'Syne, system-ui',
                        fontSize: 24,
                        fontWeight: 800,
                        lineHeight: 1.35,
                        maxWidth: 560
                      }}
                    >
                      {WIZARD_LANGUAGE_GATE.title}
                    </h1>
                    <p style={{ fontSize: 12, color: '#6a8f78', maxWidth: 520, lineHeight: 1.6 }}>{WIZARD_LANGUAGE_GATE.subtitle}</p>
                  </>
                ) : null}
              </header>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={labelStyle}>{uiLocale ? w.lang.label : WIZARD_LANGUAGE_GATE.pickerLabel}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {SIM_LANGS.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setUiLocale(code)}
                      style={{
                        padding: '12px 18px',
                        borderRadius: 8,
                        border: uiLocale === code ? '1px solid #00d97e' : '1px solid #2a3d31',
                        background: uiLocale === code ? 'rgba(0,217,126,0.2)' : '#0e1410',
                        color: uiLocale === code ? '#00d97e' : '#c8e8d4',
                        fontFamily: `'DM Mono', monospace`,
                        fontSize: 13,
                        cursor: 'pointer'
                      }}
                    >
                      {uiLocale ? w.lang.langNames[code] : LANG_NATIVE_NAMES[code]}
                    </button>
                  ))}
                </div>
                {uiLocale ? (
                  <>
                    <h1 style={{ fontFamily: 'Syne, system-ui', fontSize: 26, fontWeight: 800, marginTop: 8 }}>{w.lang.title}</h1>
                    <p style={{ fontSize: 12, color: '#6a8f78', maxWidth: 520, lineHeight: 1.6, marginTop: 0 }}>{w.lang.intro}</p>
                    <p style={{ fontSize: 11, color: '#384d3e', maxWidth: 480 }}>{w.lang.hint}</p>
                  </>
                ) : null}
              </div>
              <footer style={navRowStyle}>
                <span />
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={stepCounterStyle}>{uiLocale ? `1 ${w.nav.of} 5` : '1 / 5'}</span>
                  <button
                    type="button"
                    style={{
                      ...nextButtonStyle,
                      opacity: uiLocale ? 1 : 0.35,
                      cursor: uiLocale ? 'pointer' : 'not-allowed'
                    }}
                    disabled={!uiLocale}
                    onClick={() => {
                      if (uiLocale) setStep(2);
                    }}
                  >
                    {uiLocale ? w.lang.continue : WIZARD_LANGUAGE_GATE.continueDisabled}
                  </button>
                </div>
              </footer>
            </>
          )}

          {step === 2 && (
            <>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.18em', color: '#00d97e', textTransform: 'uppercase' }}>
                  {w.job.badge}
                </span>
                <h1 style={{ fontFamily: 'Syne, system-ui', fontSize: 26, fontWeight: 800 }}>{w.job.title}</h1>
                <p style={{ fontSize: 12, color: '#6a8f78', maxWidth: 480 }}>{w.job.intro}</p>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>
                      {w.job.jobTitle} <span style={{ color: '#00d97e' }}>*</span>
                    </label>
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={w.job.jobTitlePh}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      {w.job.company} <span style={{ color: '#00d97e' }}>*</span>
                    </label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={w.job.companyPh}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    {w.job.jobDescription} <span style={{ color: '#00d97e' }}>*</span>
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder={w.job.jobDescPh}
                    rows={4}
                    style={{ ...inputStyle, minHeight: 90 }}
                  />
                  <p style={{ fontSize: 10, color: '#384d3e', fontStyle: 'italic', marginTop: 4 }}>{w.job.jobDescHint}</p>
                </div>

                <SkillField
                  label={w.job.requiredSkills}
                  placeholder={w.job.requiredSkillsPh}
                  addLabel={w.skillAdd}
                  skills={requiredSkills}
                  onAdd={(value) => handleAddSkill(value, 'required')}
                  onRemove={(s) => setRequiredSkills((prev) => prev.filter((x) => x !== s))}
                />

                <SkillField
                  label={w.job.niceSkills}
                  placeholder={w.job.niceSkillsPh}
                  addLabel={w.skillAdd}
                  skills={niceSkills}
                  onAdd={(value) => handleAddSkill(value, 'nice')}
                  onRemove={(s) => setNiceSkills((prev) => prev.filter((x) => x !== s))}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>{w.job.interviewType}</label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value as InterviewType)}
                      style={inputStyle}
                    >
                      <option value="mixed">{w.job.interviewMixed}</option>
                      <option value="technical">{w.job.interviewTechnical}</option>
                      <option value="behavioral">{w.job.interviewBehavioral}</option>
                      <option value="hr">{w.job.interviewHr}</option>
                      <option value="live_coding">{w.job.interviewLiveCoding}</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{w.job.salaryRange}</label>
                    <input
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      placeholder={w.job.salaryPh}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <footer style={navRowStyle}>
                <button type="button" style={backButtonStyle} onClick={() => setStep(1)}>
                  {w.nav.back}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 11, color: '#e05252' }}>{stepError}</span>
                  <span style={stepCounterStyle}>
                    2 {w.nav.of} 5
                  </span>
                  <button
                    style={nextButtonStyle}
                    onClick={() => {
                      if (validateStep(2)) setStep(3);
                    }}
                  >
                    {w.nav.continue}
                  </button>
                </div>
              </footer>
            </>
          )}

          {step === 3 && (
            <>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.18em', color: '#00d97e', textTransform: 'uppercase' }}>
                  {w.profile.badge}
                </span>
                <h1 style={{ fontFamily: 'Syne, system-ui', fontSize: 26, fontWeight: 800 }}>{w.profile.title}</h1>
                <p style={{ fontSize: 12, color: '#6a8f78', maxWidth: 480 }}>{w.profile.intro}</p>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>{w.profile.yourName}</label>
                    <input
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{w.profile.currentRole}</label>
                    <input
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>
                      {w.profile.yearsExp} <span style={{ color: '#00d97e' }}>*</span>
                    </label>
                    <select
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="0">{w.profile.years0}</option>
                      <option value="1">{w.profile.years12}</option>
                      <option value="3">{w.profile.years35}</option>
                      <option value="5">{w.profile.years58}</option>
                      <option value="8">{w.profile.years812}</option>
                      <option value="12">{w.profile.years12p}</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{w.profile.technologies}</label>
                    <input
                      value={technologiesUsed}
                      onChange={(e) => setTechnologiesUsed(e.target.value)}
                      placeholder={w.profile.technologiesPh}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>{w.profile.resumeFile}</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setResumeFileName(file ? file.name : '');
                    }}
                    style={{
                      ...inputStyle,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      background: '#0e1410'
                    }}
                  />
                  {resumeFileName && (
                    <p style={{ fontSize: 10, color: '#6a8f78', marginTop: 4 }}>
                      {w.profile.fileSelected} <span style={{ color: '#c8e8d4' }}>{resumeFileName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>
                    {w.profile.keyAchievements} <span style={{ color: '#00d97e' }}>*</span>
                  </label>
                  <textarea
                    value={keyAchievements}
                    onChange={(e) => setKeyAchievements(e.target.value)}
                    rows={4}
                    placeholder={w.profile.keyAchievementsPh}
                    style={{ ...inputStyle, minHeight: 90 }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    {w.profile.resumeSummary} <span style={{ color: '#00d97e' }}>*</span>
                  </label>
                  <textarea
                    value={resumeSummary}
                    onChange={(e) => setResumeSummary(e.target.value)}
                    rows={4}
                    style={{ ...inputStyle, minHeight: 90 }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>{w.profile.additionalContext}</label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, minHeight: 70 }}
                  />
                </div>
              </div>

              <footer style={navRowStyle}>
                <button type="button" style={backButtonStyle} onClick={() => setStep(2)}>
                  {w.nav.back}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 11, color: '#e05252' }}>{stepError}</span>
                  <span style={stepCounterStyle}>3 {w.nav.of} 5</span>
                  <button
                    style={nextButtonStyle}
                    onClick={() => {
                      if (validateStep(3)) setStep(4);
                    }}
                  >
                    {w.nav.continue}
                  </button>
                </div>
              </footer>
            </>
          )}

          {step === 4 && (
            <>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.18em', color: '#00d97e', textTransform: 'uppercase' }}>
                  {w.ai.badge}
                </span>
                <h1 style={{ fontFamily: 'Syne, system-ui', fontSize: 26, fontWeight: 800 }}>{w.ai.title}</h1>
                <p style={{ fontSize: 12, color: '#6a8f78', maxWidth: 480 }}>{w.ai.intro}</p>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>{w.ai.interviewLanguage}</label>
                    <select
                      value={interviewLanguage}
                      onChange={(e) => setInterviewLanguage(e.target.value as 'auto' | 'es' | 'en' | 'pt' | 'fr' | 'de')}
                      style={inputStyle}
                    >
                      <option value="auto">{w.ai.langAuto}</option>
                      <option value="es">{w.ai.langEs}</option>
                      <option value="en">{w.ai.langEn}</option>
                      <option value="pt">{w.ai.langPt}</option>
                      <option value="fr">{w.ai.langFr}</option>
                      <option value="de">{w.ai.langDe}</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{w.ai.responseLanguage}</label>
                    <select
                      value={responseLanguage}
                      onChange={(e) => setResponseLanguage(e.target.value as 'es' | 'en' | 'pt' | 'fr' | 'de')}
                      style={inputStyle}
                    >
                      <option value="es">{w.ai.langEs}</option>
                      <option value="en">{w.ai.langEn}</option>
                      <option value="pt">{w.ai.langPt}</option>
                      <option value="fr">{w.ai.langFr}</option>
                      <option value="de">{w.ai.langDe}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>{w.ai.responseStyle}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    <StyleCard
                      title={w.ai.styleConcise}
                      desc={w.ai.styleConciseDesc}
                      icon="⚡"
                      selected={responseStyle === 'concise'}
                      onClick={() => setResponseStyle('concise')}
                    />
                    <StyleCard
                      title={w.ai.styleBullets}
                      desc={w.ai.styleBulletsDesc}
                      icon="📌"
                      selected={responseStyle === 'bullet_points'}
                      onClick={() => setResponseStyle('bullet_points')}
                    />
                    <StyleCard
                      title={w.ai.styleDetailed}
                      desc={w.ai.styleDetailedDesc}
                      icon="📝"
                      selected={responseStyle === 'detailed'}
                      onClick={() => setResponseStyle('detailed')}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    {w.ai.audioSource} <span style={{ color: '#00d97e' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <AudioOption
                      title={w.ai.extTitle}
                      desc={w.ai.extDesc}
                      badges={w.ai.extBadges}
                      selected={captureMode === 'extension'}
                      onClick={() => setCaptureMode('extension')}
                    />
                    <AudioOption
                      title={w.ai.virtTitle}
                      desc={w.ai.virtDesc}
                      badges={w.ai.virtBadges}
                      selected={captureMode === 'virtual_device'}
                      onClick={() => setCaptureMode('virtual_device')}
                    />
                    <AudioOption
                      title={w.ai.dmTitle}
                      desc={w.ai.dmDesc}
                      badges={w.ai.dmBadges}
                      selected={captureMode === 'display_media'}
                      onClick={() => setCaptureMode('display_media')}
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: '#0e1410',
                    borderRadius: 10,
                    border: '1px solid #1e2e24',
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14
                  }}
                >
                  <span style={{ fontSize: 10, letterSpacing: '0.12em', color: '#384d3e', textTransform: 'uppercase' }}>
                    {w.ai.audioTest}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    <button
                      type="button"
                      onClick={testMicrophone}
                      disabled={testing}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: '1px solid #2a3d31',
                        background: 'rgba(0,217,126,0.15)',
                        color: '#00d97e',
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>🎙</span> {testing ? w.ai.testing : w.ai.testMic}
                    </button>
                    <span
                      style={{
                        fontSize: 11,
                        color: testStatus === 'ok' ? '#00d97e' : testStatus === 'error' ? '#e05252' : '#384d3e'
                      }}
                    >
                      {testStatus === 'idle' && w.ai.notTested}
                      {testStatus === 'ok' && w.ai.micOk}
                      {testStatus === 'error' && w.ai.micDenied}
                    </span>
                  </div>
                </div>
              </div>

              <footer style={navRowStyle}>
                <button type="button" style={backButtonStyle} onClick={() => setStep(3)}>
                  {w.nav.back}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={stepCounterStyle}>4 {w.nav.of} 5</span>
                  <button type="button" style={nextButtonStyle} onClick={() => setStep(5)}>
                    {w.ai.reviewBtn}
                  </button>
                </div>
              </footer>
            </>
          )}

          {step === 5 && (
            <>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.18em', color: '#00d97e', textTransform: 'uppercase' }}>
                  {w.review.badge}
                </span>
                <h1 style={{ fontFamily: 'Syne, system-ui', fontSize: 26, fontWeight: 800 }}>{w.review.title}</h1>
                <p style={{ fontSize: 12, color: '#6a8f78', maxWidth: 480 }}>{w.review.intro}</p>
              </header>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12
                }}
              >
                <SummaryCard label={w.review.summaryJobTitle} value={jobTitle || '—'} accent />
                <SummaryCard label={w.review.summaryCompany} value={company || '—'} />
                <SummaryCard
                  label={w.review.summaryInterviewType}
                  value={w.review.interviewLabels[interviewType] ?? interviewType}
                />
                <SummaryCard label={w.review.summaryYears} value={yearsOfExperience} />
                <SummaryCard
                  label={w.review.summaryILang}
                  value={interviewLangLabel(w.ai, interviewLanguage)}
                />
                <SummaryCard
                  label={w.review.summaryRLang}
                  value={interviewLangLabel(w.ai, responseLanguage)}
                  accent
                />
                <SummaryCard
                  label={w.review.summaryStyle}
                  value={w.review.styleLabels[responseStyle] ?? responseStyle}
                />
                <SummaryCard
                  label={w.review.summaryAudio}
                  value={w.review.captureLabels[captureMode] ?? captureMode}
                />
              </div>

              {requiredSkills.length > 0 && (
                <div
                  style={{
                    background: '#0e1410',
                    borderRadius: 8,
                    border: '1px solid #1e2e24',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ fontSize: 9, letterSpacing: '0.12em', color: '#384d3e', textTransform: 'uppercase' }}>
                    {w.review.requiredSkillsSection}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {requiredSkills.map((s) => (
                      <span
                        key={s}
                        style={{
                          background: 'rgba(0,217,126,0.15)',
                          borderRadius: 4,
                          padding: '3px 8px',
                          fontSize: 10,
                          color: '#00d97e'
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <footer style={navRowStyle}>
                <button type="button" style={backButtonStyle} onClick={() => setStep(4)}>
                  {w.nav.back}
                </button>
                <button
                  type="button"
                  style={{
                    background: '#00d97e',
                    border: 'none',
                    color: '#000',
                    fontFamily: 'Syne, system-ui',
                    fontWeight: 800,
                    padding: '12px 32px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    letterSpacing: '0.05em'
                  }}
                  onClick={handleLaunch}
                >
                  {w.review.launch}
                </button>
              </footer>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.1em',
  color: '#384d3e',
  textTransform: 'uppercase',
  marginBottom: 6
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0e1410',
  border: '1px solid #1e2e24',
  borderRadius: 6,
  padding: '10px 14px',
  color: '#c8e8d4',
  fontFamily: `'DM Mono', monospace`,
  fontSize: 13,
  outline: 'none'
};

const navRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 8,
  borderTop: '1px solid #1e2e24'
};

const backButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #1e2e24',
  color: '#6a8f78',
  fontFamily: `'DM Mono', monospace`,
  fontSize: 12,
  padding: '10px 20px',
  borderRadius: 6,
  cursor: 'pointer'
};

const nextButtonStyle: React.CSSProperties = {
  background: '#00d97e',
  border: 'none',
  color: '#000',
  fontFamily: 'Syne, system-ui',
  fontSize: 13,
  fontWeight: 700,
  padding: '10px 28px',
  borderRadius: 6,
  cursor: 'pointer',
  letterSpacing: '0.02em'
};

const stepCounterStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#384d3e',
  letterSpacing: '0.1em'
};

type SkillFieldProps = {
  label: string;
  placeholder: string;
  addLabel: string;
  skills: string[];
  onAdd: (value: string) => void;
  onRemove: (skill: string) => void;
};

const SkillField: React.FC<SkillFieldProps> = ({ label, placeholder, addLabel, skills, onAdd, onRemove }) => {
  const [value, setValue] = useState('');
  const add = () => {
    if (!value.trim()) return;
    onAdd(value);
    setValue('');
  };
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 32 }}>
          {skills.map((s) => (
            <span
              key={s}
              style={{
                background: 'rgba(0,217,126,0.15)',
                border: '1px solid #2a3d31',
                borderRadius: 4,
                padding: '4px 10px',
                fontSize: 11,
                color: '#00d97e',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {s}
              <button
                type="button"
                onClick={() => onRemove(s)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#384d3e',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            style={{ ...inputStyle, padding: '8px 12px', fontSize: 12 }}
          />
          <button
            type="button"
            onClick={add}
            style={{
              background: 'rgba(0,217,126,0.15)',
              border: '1px solid #2a3d31',
              color: '#00d97e',
              fontSize: 12,
              padding: '8px 14px',
              borderRadius: 6,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {addLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

type StyleCardProps = {
  title: string;
  desc: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
};

const StyleCard: React.FC<StyleCardProps> = ({ title, desc, icon, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      borderRadius: 8,
      padding: 14,
      border: `1px solid ${selected ? '#00d97e' : '#1e2e24'}`,
      background: selected ? 'rgba(0,217,126,0.15)' : '#0e1410',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      textAlign: 'left'
    }}
  >
    <span style={{ fontSize: 18 }}>{icon}</span>
    <span
      style={{
        fontFamily: 'Syne, system-ui',
        fontSize: 12,
        fontWeight: 500,
        color: selected ? '#00d97e' : '#c8e8d4'
      }}
    >
      {title}
    </span>
    <span style={{ fontSize: 10, color: '#384d3e' }}>{desc}</span>
  </button>
);

type AudioOptionProps = {
  title: string;
  desc: string;
  badges: string[];
  selected: boolean;
  onClick: () => void;
};

const AudioOption: React.FC<AudioOptionProps> = ({ title, desc, badges, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      borderRadius: 8,
      padding: '16px 18px',
      border: `1px solid ${selected ? '#00d97e' : '#1e2e24'}`,
      background: selected ? 'rgba(0,217,126,0.15)' : '#0e1410',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      cursor: 'pointer',
      textAlign: 'left'
    }}
  >
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: `1.5px solid ${selected ? '#00d97e' : '#2a3d31'}`,
        marginTop: 2
      }}
    />
    <div>
      <div
        style={{
          fontFamily: 'Syne, system-ui',
          fontSize: 13,
          fontWeight: 500,
          color: selected ? '#00d97e' : '#c8e8d4',
          marginBottom: 4
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 11, color: '#384d3e' }}>{desc}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {badges.map((b) => (
          <span
            key={b}
            style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 3,
              border: '1px solid rgba(0,217,126,0.2)',
              color: b.startsWith('⚠') ? '#d4aa3a' : '#00d97e',
              background: b.startsWith('⚠') ? 'rgba(212,170,58,0.1)' : 'rgba(0,217,126,0.1)'
            }}
          >
            {b}
          </span>
        ))}
      </div>
    </div>
  </button>
);

type SummaryCardProps = { label: string; value: string; accent?: boolean };

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, accent }) => (
  <div
    style={{
      background: '#0e1410',
      borderRadius: 8,
      border: '1px solid #1e2e24',
      padding: '14px 16px'
    }}
  >
    <div style={{ fontSize: 9, letterSpacing: '0.12em', color: '#384d3e', textTransform: 'uppercase' }}>{label}</div>
    <div
      style={{
        fontSize: 13,
        color: accent ? '#00d97e' : '#c8e8d4',
        marginTop: 4
      }}
    >
      {value || '—'}
    </div>
  </div>
);

