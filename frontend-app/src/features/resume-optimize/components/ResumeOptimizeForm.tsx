import { useEffect, useState } from 'react'
import type { ResumeOptimizeRequest } from '../types/resumeOptimize.types'

interface ResumeOptimizeFormProps {
  onSubmit: (values: ResumeOptimizeRequest) => Promise<void>
  isLoading: boolean
  initialValues?: ResumeOptimizeRequest
}

export function ResumeOptimizeForm({
  onSubmit,
  isLoading,
  initialValues,
}: ResumeOptimizeFormProps) {
  const [resumeText, setResumeText] = useState(initialValues?.resumeText ?? '')
  const [jobDescription, setJobDescription] = useState(initialValues?.jobDescription ?? '')

  useEffect(() => {
    if (initialValues) {
      setResumeText(initialValues.resumeText ?? '')
      setJobDescription(initialValues.jobDescription ?? '')
    }
  }, [initialValues])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!resumeText.trim()) {
      alert('Please paste resume text before optimizing.')
      return
    }

    await onSubmit({
      resumeText: resumeText.trim(),
      jobDescription: jobDescription.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
      <div>
        <label
          htmlFor="optimizeResumeText"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          Resume Text
        </label>
        <textarea
          id="optimizeResumeText"
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
          placeholder="Paste the resume text you want to improve..."
          rows={12}
          style={{
            width: '100%',
            padding: '14px',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            resize: 'vertical',
            background: '#ffffff',
          }}
        />
      </div>

      <div>
        <label
          htmlFor="optimizeJobDescription"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          Job Description
          <span style={{ marginLeft: '6px', color: '#6b7280', fontWeight: 500 }}>
            (optional)
          </span>
        </label>
        <textarea
          id="optimizeJobDescription"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the target job description here..."
          rows={8}
          style={{
            width: '100%',
            padding: '14px',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            resize: 'vertical',
            background: '#ffffff',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: 'fit-content',
            padding: '12px 18px',
            border: 'none',
            borderRadius: '12px',
            background: '#111827',
            color: '#ffffff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            fontWeight: 700,
          }}
        >
          {isLoading ? 'Optimizing...' : 'Optimize Resume'}
        </button>

        <span style={{ color: '#6b7280', fontSize: '0.95rem' }}>
          Generate an improved version and compare before vs after ATS performance.
        </span>
      </div>
    </form>
  )
}