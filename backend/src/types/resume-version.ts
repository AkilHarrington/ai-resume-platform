// =====================================================
// Resume Version Model
// =====================================================

export interface ResumeVersion {

  versionId: string
  resumeId: string

  createdAt: number

  source:
    | "original"
    | "optimized"
    | "job-tailored"

  contentJson: unknown
  rawText: string

  scoreSnapshot?: {
    overall: number
  }

}