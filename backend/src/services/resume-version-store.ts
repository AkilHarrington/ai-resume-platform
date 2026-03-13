import { ResumeVersion } from "../types/resume-version"

const resumeVersions: ResumeVersion[] = []

export function saveResumeVersion(version: ResumeVersion) {
  resumeVersions.push(version)
}

export function getResumeVersions(resumeId: string) {
  return resumeVersions.filter(v => v.resumeId === resumeId)
}

export function getLatestResumeVersion(resumeId: string) {
  const versions = resumeVersions.filter(v => v.resumeId === resumeId)

  if (versions.length === 0) return null

  return versions.sort((a,b) => b.createdAt - a.createdAt)[0]
}