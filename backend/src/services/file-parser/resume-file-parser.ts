import pdfParse from "pdf-parse"
import mammoth from "mammoth"

export async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  const data = await pdfParse(fileBuffer)
  return data.text || ""
}

export async function extractDocxText(fileBuffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: fileBuffer })
  return result.value || ""
}

export async function extractResumeText(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {

  if (mimeType === "application/pdf") {
    return extractPdfText(fileBuffer)
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxText(fileBuffer)
  }

  if (mimeType === "text/plain") {
    return fileBuffer.toString("utf-8")
  }

  throw new Error("Unsupported resume file format")
}