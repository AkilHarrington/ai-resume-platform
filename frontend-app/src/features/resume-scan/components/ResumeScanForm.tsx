import { useState } from 'react'
import type { ResumeScanRequest } from '../types/resumeScan.types'

interface ResumeScanFormProps {
  onSubmit: (values: ResumeScanRequest) => Promise<void>
  isLoading: boolean
}

export function ResumeScanForm({ onSubmit, isLoading }: ResumeScanFormProps) {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!resumeText.trim()) {
      alert('Please paste resume text before scanning.')
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
          htmlFor="resumeText"
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
          id="resumeText"
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
          placeholder="Paste the candidate's resume text here..."
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
          htmlFor="jobDescription"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          Job Description
          <span style={{ marginLeft: '6px', color: '#6b7280', fontWeight: 500 }}>(optional)</span>
        </label>
        <textarea
          id="jobDescription"
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
          {isLoading ? 'Scanning...' : 'Scan Resume'}
        </button>

        <span style={{ color: '#6b7280', fontSize: '0.95rem' }}>
          Paste raw resume text and optionally compare it to a target job description.
        </span>
      </div>
    </form>
  )
}