import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../lib/config';

type InterviewType = 'behavioral' | 'technical' | 'mixed' | 'hr' | 'live_coding';
type ResponseStyle = 'concise' | 'bullet_points' | 'detailed';
type CaptureMode = 'extension' | 'virtual_device' | 'display_media';

export const SessionConfigWizard: React.FC = () => {
  const navigate = useNavigate();
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

  const [interviewLanguage, setInterviewLanguage] = useState<'auto' | 'es' | 'en' | 'pt' | 'fr' | 'de'>('auto');
  const [responseLanguage, setResponseLanguage] = useState<'es' | 'en' | 'pt' | 'fr' | 'de'>('es');
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>('concise');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('extension');

  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [testing, setTesting] = useState(false);
  const [stepError, setStepError] = useState('');

  const validateStep = (current: number): boolean => {
    if (current === 1) {
      if (!jobTitle.trim() || !company.trim() || !jobDescription.trim() || requiredSkills.length === 0) {
        setStepError('Completa cargo, empresa, descripción y al menos una skill requerida.');
        return false;
      }
    }
    if (current === 2) {
      if (!keyAchievements.trim() || !resumeSummary.trim()) {
        setStepError('Agrega tus logros clave y un resumen de tu perfil/CV.');
        return false;
      }
    }
    setStepError('');
    return true;
  };

  const handleAddSkill = (value: string, target: 'required' | 'nice') => {
    const cleaned = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!cleaned.length) return;
    if (target === 'required') {
      setRequiredSkills((prev) => Array.from(new Set([...prev, ...cleaned])));
    } else {
      setNiceSkills((prev) => Array.from(new Set([...prev, ...cleaned])));
    }
  };

  const handleLaunch = async () => {
    const sessionId = 'ses_' + Math.random().toString(36).slice(2, 10);
    const config = {
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

    localStorage.setItem('ip_config', JSON.stringify(config));
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
        <span style={{ fontSize: 11, letterSpacing: '0.1em', color: '#384d3e' }}>CONFIGURACIÓN DE SESIÓN</span>
      </header>

      <main
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          maxWidth: 1000,
          margin: '0 auto',
          padding: '48px 40px',
          gap: 48
        }}
      >
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { id: 1, label: 'La vacante', desc: 'Cargo, empresa y descripción' },
            { id: 2, label: 'Tu perfil', desc: 'Experiencia y logros' },
            { id: 3, label: 'IA y audio', desc: 'Idioma, estilo y fuente' },
            { id: 4, label: 'Revisar', desc: 'Confirmar y lanzar' }
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                border: '1px solid transparent',
                background:
                  step === s.id ? 'rgba(0,217,126,0.15)' : 'transparent',
                opacity: step > s.id ? 0.8 : 1
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: `1.5px solid ${step === s.id ? '#00d97e' : '#2a3d31'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: step === s.id ? '#000' : '#384d3e',
                  background: step === s.id ? '#00d97e' : 'transparent'
                }}
              >
                {s.id}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.05em',
                    color: step === s.id ? '#00d97e' : '#6a8f78',
                    textTransform: 'uppercase',
                    marginBottom: 3
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontSize: 10, color: '#384d3e' }}>{s.desc}</div>
              </div>
            </button>
          ))}
        </aside>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {step === 1 && (
            <>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.18em', color: '#00d97e', textTransform: 'uppercase' }}>
                  paso 01 / 04
                </span>
                <h1 style={{ fontFamily: 'Syne, system-ui', fontSize: 26, fontWeight: 800 }}>La vacante</h1>
                <p style={{ fontSize: 12, color: '#6a8f78', maxWidth: 480 }}>
                  Ingresa los detalles del cargo. Cuanto más específico seas, mejores serán las respuestas sugeridas. Si elegís &quot;Prueba en vivo&quot;, la IA priorizará pasos de código, qué decir en voz alta y trampas típicas.
                </p>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>
                      Cargo <span style={{ color: '#00d97e' }}>*</span>
                    </label>
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="ej: Senior Frontend Developer"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Empresa <span style={{ color: '#00d97e' }}>*</span>
                    </label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="ej: Rappi, Bancolombia, Google..."
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    Descripción de la vacante <span style={{ color: '#00d97e' }}>*</span>
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Pega aquí la descripción completa del cargo..."
                    rows={4}
                    style={{ ...inputStyle, minHeight: 90 }}
                  />
                  <p style={{ fontSize: 10, color: '#384d3e', fontStyle: 'italic', marginTop: 4 }}>
                    Mientras más completa, más precisas serán las respuestas de la IA.
                  </p>
                </div>

                <SkillField
                  label="Skills requeridas"
                  placeholder="React, TypeScript, AWS..."
                  skills={requiredSkills}
                  onAdd={(value) => handleAddSkill(value, 'required')}
                  onRemove={(s) => setRequiredSkills((prev) => prev.filter((x) => x !== s))}
                />

                <SkillField
                  label="Skills deseables"
                  placeholder="Docker, GraphQL, Figma..."
                  skills={niceSkills}
                  onAdd={(value) => handleAddSkill(value, 'nice')}
                  onRemove={(s) => setNiceSkills((prev) => prev.filter((x) => x !== s))}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Tipo de entrevista</label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value as InterviewType)}
                      style={inputStyle}
                    >
                      <option value="mixed">Mixta (técnica + comportamental)</option>
                      <option value="technical">Técnica</option>
                      <option value="behavioral">Comportamental / STAR</option>
                      <option value="hr">RRHH / Cultural fit</option>
                      <option value="live_coding">Prueba en vivo (live coding)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Rango salarial (opcional)</label>
                    <input
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      placeholder="ej: COP 8M - 12M / mes"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <footer style={navRowStyle}>
                <span style={{ fontSize: 11, color: '#e05252' }}>{stepError}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={stepCounterStyle}>1 de 4</span>
                  <button
                    style={nextButtonStyle}
                    onClick={() => {
                      if (validateStep(1)) setStep(2);
                    }}
                  >
                    Continuar →
                  </button>
                </div>
              </footer>
            </>
          )}

          {step === 2 && (
            <>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.18em', color: '#00d97e', textTransform: 'uppercase' }}>
                  paso 02 / 04
                </span>
                <h1 style={{ fontFamily: 'Syne, system-ui', fontSize: 26, fontWeight: 800 }}>Tu perfil</h1>
                <p style={{ fontSize: 12, color: '#6a8f78', maxWidth: 480 }}>
                  La IA usará esta información para personalizar las respuestas con tus experiencias reales.
                </p>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Tu nombre</label>
                    <input
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Rol actual</label>
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
                      Años de experiencia <span style={{ color: '#00d97e' }}>*</span>
                    </label>
                    <select
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="0">Menos de 1 año</option>
                      <option value="1">1-2 años</option>
                      <option value="3">3-5 años</option>
                      <option value="5">5-8 años</option>
                      <option value="8">8-12 años</option>
                      <option value="12">12+ años</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tecnologías que dominas</label>
                    <input
                      value={technologiesUsed}
                      onChange={(e) => setTechnologiesUsed(e.target.value)}
                      placeholder="React, Node.js, PostgreSQL, AWS..."
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>CV / Resume (PDF o Word) (opcional)</label>
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
                      Archivo seleccionado: <span style={{ color: '#c8e8d4' }}>{resumeFileName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>
                    Logros clave <span style={{ color: '#00d97e' }}>*</span>
                  </label>
                  <textarea
                    value={keyAchievements}
                    onChange={(e) => setKeyAchievements(e.target.value)}
                    rows={4}
                    placeholder="Incluye métricas concretas..."
                    style={{ ...inputStyle, minHeight: 90 }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Resumen de tu CV / perfil profesional <span style={{ color: '#00d97e' }}>*</span>
                  </label>
                  <textarea
                    value={resumeSummary}
                    onChange={(e) => setResumeSummary(e.target.value)}
                    rows={4}
                    style={{ ...inputStyle, minHeight: 90 }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Contexto adicional (opcional)</label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, minHeight: 70 }}
                  />
                </div>
              </div>

              <footer style={navRowStyle}>
                <button style={backButtonStyle} onClick={() => setStep(1)}>
                  ← Atrás
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={stepCounterStyle}>2 de 4</span>
                  <button
                    style={nextButtonStyle}
                    onClick={() => {
                      if (validateStep(2)) setStep(3);
                    }}
                  >
                    Continuar →
                  </button>
                </div>
              </footer>
            </>
          )}

          {step === 3 && (
            <>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.18em', color: '#00d97e', textTransform: 'uppercase' }}>
                  paso 03 / 04
                </span>
                <h1 style={{ fontFamily: 'Syne, system-ui', fontSize: 26, fontWeight: 800 }}>IA y audio</h1>
                <p style={{ fontSize: 12, color: '#6a8f78', maxWidth: 480 }}>
                  Configura cómo la herramienta escucha la entrevista y cómo quieres que aparezcan las respuestas.
                </p>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Idioma de la entrevista</label>
                    <select
                      value={interviewLanguage}
                      onChange={(e) => setInterviewLanguage(e.target.value as any)}
                      style={inputStyle}
                    >
                      <option value="auto">🔍 Detectar automáticamente</option>
                      <option value="es">🇪🇸 Español</option>
                      <option value="en">🇺🇸 English</option>
                      <option value="pt">🇧🇷 Português</option>
                      <option value="fr">🇫🇷 Français</option>
                      <option value="de">🇩🇪 Deutsch</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Idioma de las respuestas sugeridas</label>
                    <select
                      value={responseLanguage}
                      onChange={(e) => setResponseLanguage(e.target.value as any)}
                      style={inputStyle}
                    >
                      <option value="es">🇪🇸 Español</option>
                      <option value="en">🇺🇸 English</option>
                      <option value="pt">🇧🇷 Português</option>
                      <option value="fr">🇫🇷 Français</option>
                      <option value="de">🇩🇪 Deutsch</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Estilo de respuesta</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    <StyleCard
                      title="Concisa"
                      desc="2-3 oraciones. Ideal para leer y hablar al mismo tiempo."
                      icon="⚡"
                      selected={responseStyle === 'concise'}
                      onClick={() => setResponseStyle('concise')}
                    />
                    <StyleCard
                      title="Puntos clave"
                      desc="3-4 bullets con verbos de acción."
                      icon="📌"
                      selected={responseStyle === 'bullet_points'}
                      onClick={() => setResponseStyle('bullet_points')}
                    />
                    <StyleCard
                      title="Detallada"
                      desc="Respuesta completa con método STAR."
                      icon="📝"
                      selected={responseStyle === 'detailed'}
                      onClick={() => setResponseStyle('detailed')}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    Fuente de audio <span style={{ color: '#00d97e' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <AudioOption
                      title="Extensión de Chrome (Recomendado)"
                      desc="Captura el audio del tab de Meet directamente. Sin configuración adicional. Invisible al entrevistador."
                      badges={['✓ Google Meet', '✓ 100% Invisible', '✓ Sin setup']}
                      selected={captureMode === 'extension'}
                      onClick={() => setCaptureMode('extension')}
                    />
                    <AudioOption
                      title="Dispositivo de audio virtual"
                      desc="Requiere BlackHole (Mac) o VB-Cable (Windows). Ideal para Zoom y Teams nativos."
                      badges={['✓ Zoom', '✓ Teams', '⚠ Instalar BlackHole/VB-Cable']}
                      selected={captureMode === 'virtual_device'}
                      onClick={() => setCaptureMode('virtual_device')}
                    />
                    <AudioOption
                      title="Compartir pantalla con audio"
                      desc="Sin instalación adicional. El navegador pedirá elegir qué compartir. Activar 'Compartir audio del sistema'."
                      badges={['✓ Universal', '⚠ Muestra barra de captura']}
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
                    Prueba de audio
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
                      <span>🎙</span> {testing ? 'Probando...' : 'Probar micrófono'}
                    </button>
                    <span
                      style={{
                        fontSize: 11,
                        color: testStatus === 'ok' ? '#00d97e' : testStatus === 'error' ? '#e05252' : '#384d3e'
                      }}
                    >
                      {testStatus === 'idle' && 'Sin probar'}
                      {testStatus === 'ok' && '✓ Micrófono funcionando'}
                      {testStatus === 'error' && '✗ Permiso denegado'}
                    </span>
                  </div>
                </div>
              </div>

              <footer style={navRowStyle}>
                <button style={backButtonStyle} onClick={() => setStep(2)}>
                  ← Atrás
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={stepCounterStyle}>3 de 4</span>
                  <button style={nextButtonStyle} onClick={() => setStep(4)}>
                    Revisar →
                  </button>
                </div>
              </footer>
            </>
          )}

          {step === 4 && (
            <>
              <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.18em', color: '#00d97e', textTransform: 'uppercase' }}>
                  paso 04 / 04
                </span>
                <h1 style={{ fontFamily: 'Syne, system-ui', fontSize: 26, fontWeight: 800 }}>Todo listo</h1>
                <p style={{ fontSize: 12, color: '#6a8f78', maxWidth: 480 }}>Revisa la configuración antes de iniciar.</p>
              </header>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12
                }}
              >
                <SummaryCard label="Cargo" value={jobTitle || '—'} accent />
                <SummaryCard label="Empresa" value={company || '—'} />
                <SummaryCard
                  label="Tipo de entrevista"
                  value={
                    {
                      mixed: 'Mixta',
                      technical: 'Técnica',
                      behavioral: 'Comportamental',
                      hr: 'RRHH / Cultural fit',
                      live_coding: 'Prueba en vivo (live coding)'
                    }[interviewType]
                  }
                />
                <SummaryCard label="Años de experiencia" value={yearsOfExperience} />
                <SummaryCard label="Idioma entrevista" value={interviewLanguage} />
                <SummaryCard label="Idioma respuestas" value={responseLanguage} accent />
                <SummaryCard label="Estilo IA" value={responseStyle} />
                <SummaryCard label="Fuente audio" value={captureMode} />
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
                    Skills requeridas
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
                <button style={backButtonStyle} onClick={() => setStep(3)}>
                  ← Atrás
                </button>
                <button
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
                  🚀 INICIAR SESIÓN
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
  skills: string[];
  onAdd: (value: string) => void;
  onRemove: (skill: string) => void;
};

const SkillField: React.FC<SkillFieldProps> = ({ label, placeholder, skills, onAdd, onRemove }) => {
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
            + Agregar
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

