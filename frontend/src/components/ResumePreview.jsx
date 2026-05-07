export default function ResumePreview({ data }) {
  const { personal = {}, summary, experience = [], education = [], skills = {}, projects = [], certifications = [] } = data

  const contactParts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.website,
  ].filter(Boolean)

  return (
    <div id="resume-preview" className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gray-950 text-white px-8 py-7">
        <h1 className="text-3xl font-bold tracking-tight">{personal.name || 'Your Name'}</h1>
        {personal.title && (
          <p className="text-flame-400 font-medium text-lg mt-1">{personal.title}</p>
        )}
        {contactParts.length > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-gray-300">
            {personal.email    && <span>{personal.email}</span>}
            {personal.phone    && <span>{personal.phone}</span>}
            {personal.location && <span>{personal.location}</span>}
            {personal.linkedin && <span>{personal.linkedin}</span>}
            {personal.github   && <span>{personal.github}</span>}
            {personal.website  && <span>{personal.website}</span>}
          </div>
        )}
      </div>

      <div className="px-8 py-7 space-y-6">
        {/* Summary */}
        {summary && (
          <Section title="Professional Summary">
            <p className="text-gray-700 leading-relaxed text-sm">{summary}</p>
          </Section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <Section title="Experience">
            <div className="space-y-5">
              {experience.map((job, i) => (
                <div key={i}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-semibold text-gray-900">{job.role}</div>
                      <div className="text-sm text-gray-500">
                        {job.company}{job.location ? ` · ${job.location}` : ''}
                      </div>
                    </div>
                    {(job.start || job.end) && (
                      <div className="text-xs text-gray-400 whitespace-nowrap pt-0.5">
                        {job.start}{job.end ? ` – ${job.end}` : ''}
                      </div>
                    )}
                  </div>
                  {job.bullets?.length > 0 && (
                    <ul className="mt-2 space-y-1.5 ml-1">
                      {job.bullets.map((b, j) => (
                        <li key={j} className="text-sm text-gray-700 flex gap-2.5 leading-snug">
                          <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-flame-500 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <Section title="Education">
            <div className="space-y-3">
              {education.map((edu, i) => (
                <div key={i} className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-semibold text-gray-900">{edu.degree}</div>
                    <div className="text-sm text-gray-500">
                      {edu.institution}{edu.location ? ` · ${edu.location}` : ''}
                    </div>
                    {(edu.gpa || edu.honors) && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {[edu.honors, edu.gpa && `GPA ${edu.gpa}`].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  {edu.year && (
                    <div className="text-xs text-gray-400 whitespace-nowrap pt-0.5">{edu.year}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Skills */}
        {(skills.technical?.length > 0 || skills.tools?.length > 0 || skills.soft?.length > 0) && (
          <Section title="Skills">
            <div className="space-y-2.5">
              {skills.technical?.length > 0 && <SkillRow label="Technical" items={skills.technical} />}
              {skills.tools?.length > 0      && <SkillRow label="Tools & Platforms" items={skills.tools} />}
              {skills.soft?.length > 0       && <SkillRow label="Soft Skills" items={skills.soft} />}
            </div>
          </Section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <Section title="Projects">
            <div className="space-y-3">
              {projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{proj.name}</span>
                    {proj.tech?.length > 0 && (
                      <span className="text-xs text-gray-400">{proj.tech.join(', ')}</span>
                    )}
                    {proj.link && (
                      <span className="text-xs text-blue-600">{proj.link}</span>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-sm text-gray-700 mt-0.5 leading-snug">{proj.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <Section title="Certifications">
            <div className="space-y-1.5">
              {certifications.map((cert, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">
                    {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}
                  </span>
                  {cert.year && <span className="text-xs text-gray-400">{cert.year}</span>}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 whitespace-nowrap">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      {children}
    </div>
  )
}

function SkillRow({ label, items }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-xs font-semibold text-gray-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((skill, i) => (
          <span key={i} className="text-xs bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full">
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}
