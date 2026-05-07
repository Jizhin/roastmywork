export default function ResumeMinimal({ data }) {
  const {
    personal = {}, summary, experience = [],
    education = [], skills = {}, projects = [], certifications = [],
  } = data

  const contactParts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.github,
  ].filter(Boolean)

  return (
    <div id="resume-preview" className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-2xl px-10 py-10 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">{personal.name || 'Your Name'}</h1>
        {personal.title && <p className="text-gray-500 text-lg mt-1">{personal.title}</p>}
        {contactParts.length > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-gray-500">
            {personal.email    && <span>{personal.email}</span>}
            {personal.phone    && <span>{personal.phone}</span>}
            {personal.location && <span>{personal.location}</span>}
            {personal.linkedin && <span>{personal.linkedin}</span>}
            {personal.github   && <span>{personal.github}</span>}
          </div>
        )}
      </div>

      {summary && (
        <MinimalSection title="Summary">
          <p className="text-gray-600 leading-relaxed text-sm">{summary}</p>
        </MinimalSection>
      )}

      {experience.length > 0 && (
        <MinimalSection title="Experience">
          <div className="space-y-5">
            {experience.map((job, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{job.role}</p>
                    <p className="text-sm text-gray-500">{job.company}{job.location ? `, ${job.location}` : ''}</p>
                  </div>
                  {(job.start || job.end) && (
                    <span className="text-sm text-gray-400 whitespace-nowrap flex-shrink-0">
                      {job.start}{job.end ? ` – ${job.end}` : ''}
                    </span>
                  )}
                </div>
                {job.bullets?.length > 0 && (
                  <ul className="mt-2 space-y-1 list-disc list-inside marker:text-gray-300">
                    {job.bullets.map((b, j) => (
                      <li key={j} className="text-sm text-gray-700 leading-snug">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </MinimalSection>
      )}

      {education.length > 0 && (
        <MinimalSection title="Education">
          <div className="space-y-3">
            {education.map((edu, i) => (
              <div key={i} className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{edu.degree}</p>
                  <p className="text-sm text-gray-500">{edu.institution}{edu.location ? `, ${edu.location}` : ''}</p>
                  {(edu.gpa || edu.honors) && (
                    <p className="text-xs text-gray-400 mt-0.5">{[edu.honors, edu.gpa && `GPA ${edu.gpa}`].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
                {edu.year && <span className="text-sm text-gray-400 whitespace-nowrap">{edu.year}</span>}
              </div>
            ))}
          </div>
        </MinimalSection>
      )}

      {(skills.technical?.length > 0 || skills.tools?.length > 0 || skills.soft?.length > 0) && (
        <MinimalSection title="Skills">
          <div className="space-y-1.5">
            {skills.technical?.length > 0 && (
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Technical: </span>
                {skills.technical.join(', ')}
              </p>
            )}
            {skills.tools?.length > 0 && (
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Tools: </span>
                {skills.tools.join(', ')}
              </p>
            )}
            {skills.soft?.length > 0 && (
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">Soft Skills: </span>
                {skills.soft.join(', ')}
              </p>
            )}
          </div>
        </MinimalSection>
      )}

      {projects.length > 0 && (
        <MinimalSection title="Projects">
          <div className="space-y-3">
            {projects.map((proj, i) => (
              <div key={i}>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{proj.name}</span>
                  {proj.tech?.length > 0 && <span className="text-xs text-gray-400">{proj.tech.join(', ')}</span>}
                  {proj.link && <span className="text-xs text-blue-600">{proj.link}</span>}
                </div>
                {proj.description && <p className="text-sm text-gray-600 mt-0.5 leading-snug">{proj.description}</p>}
              </div>
            ))}
          </div>
        </MinimalSection>
      )}

      {certifications.length > 0 && (
        <MinimalSection title="Certifications">
          <div className="space-y-1.5">
            {certifications.map((cert, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}</span>
                {cert.year && <span className="text-sm text-gray-400">{cert.year}</span>}
              </div>
            ))}
          </div>
        </MinimalSection>
      )}
    </div>
  )
}

function MinimalSection({ title, children }) {
  return (
    <div>
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</h2>
      {children}
    </div>
  )
}
