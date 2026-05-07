export default function ResumeModern({ data }) {
  const {
    personal = {}, summary, experience = [],
    education = [], skills = {}, projects = [], certifications = [],
  } = data

  return (
    <div id="resume-preview" className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-2xl flex" style={{ minHeight: '900px' }}>
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white px-6 py-8 space-y-7 flex-shrink-0">
        {/* Name & title */}
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-tight">{personal.name || 'Your Name'}</h1>
          {personal.title && <p className="text-slate-300 text-sm mt-1.5 leading-snug">{personal.title}</p>}
        </div>

        {/* Contact */}
        <div className="space-y-1.5">
          <SidebarHeading>Contact</SidebarHeading>
          {personal.email    && <p className="text-xs text-slate-300 break-all">{personal.email}</p>}
          {personal.phone    && <p className="text-xs text-slate-300">{personal.phone}</p>}
          {personal.location && <p className="text-xs text-slate-300">{personal.location}</p>}
          {personal.linkedin && <p className="text-xs text-slate-300 break-all">{personal.linkedin}</p>}
          {personal.github   && <p className="text-xs text-slate-300 break-all">{personal.github}</p>}
        </div>

        {/* Skills */}
        {(skills.technical?.length > 0 || skills.tools?.length > 0) && (
          <div className="space-y-4">
            <SidebarHeading>Skills</SidebarHeading>
            {skills.technical?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Technical</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.technical.map((s, i) => (
                    <span key={i} className="text-[11px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {skills.tools?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Tools</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.tools.map((s, i) => (
                    <span key={i} className="text-[11px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {skills.soft?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Soft Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.soft.map((s, i) => (
                    <span key={i} className="text-[11px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="space-y-3">
            <SidebarHeading>Education</SidebarHeading>
            {education.map((edu, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-white leading-tight">{edu.degree}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{edu.institution}</p>
                {edu.year && <p className="text-[11px] text-slate-500">{edu.year}</p>}
                {(edu.gpa || edu.honors) && (
                  <p className="text-[11px] text-slate-500">{[edu.honors, edu.gpa && `GPA ${edu.gpa}`].filter(Boolean).join(' · ')}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="space-y-2">
            <SidebarHeading>Certifications</SidebarHeading>
            {certifications.map((cert, i) => (
              <div key={i}>
                <p className="text-xs text-slate-300 leading-tight">{cert.name}</p>
                {cert.issuer && <p className="text-[11px] text-slate-500">{cert.issuer}</p>}
                {cert.year   && <p className="text-[11px] text-slate-500">{cert.year}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 px-8 py-8 space-y-6">
        {summary && (
          <ModernSection title="Professional Summary">
            <p className="text-gray-600 text-sm leading-relaxed">{summary}</p>
          </ModernSection>
        )}

        {experience.length > 0 && (
          <ModernSection title="Experience">
            <div className="space-y-5">
              {experience.map((job, i) => (
                <div key={i}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-bold text-gray-900">{job.role}</p>
                      <p className="text-sm text-slate-500">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
                    </div>
                    {(job.start || job.end) && (
                      <span className="text-xs text-gray-400 whitespace-nowrap pt-0.5">
                        {job.start}{job.end ? ` – ${job.end}` : ''}
                      </span>
                    )}
                  </div>
                  {job.bullets?.length > 0 && (
                    <ul className="mt-2 space-y-1.5 ml-1">
                      {job.bullets.map((b, j) => (
                        <li key={j} className="text-sm text-gray-700 flex gap-2.5 leading-snug">
                          <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </ModernSection>
        )}

        {projects.length > 0 && (
          <ModernSection title="Projects">
            <div className="space-y-3">
              {projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{proj.name}</span>
                    {proj.tech?.length > 0 && <span className="text-xs text-gray-400">{proj.tech.join(', ')}</span>}
                    {proj.link && <span className="text-xs text-blue-600">{proj.link}</span>}
                  </div>
                  {proj.description && <p className="text-sm text-gray-700 mt-0.5 leading-snug">{proj.description}</p>}
                </div>
              ))}
            </div>
          </ModernSection>
        )}
      </div>
    </div>
  )
}

function SidebarHeading({ children }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 border-b border-slate-700 pb-1.5 mb-2">
      {children}
    </h3>
  )
}

function ModernSection({ title, children }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 whitespace-nowrap">{title}</h2>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      {children}
    </div>
  )
}
