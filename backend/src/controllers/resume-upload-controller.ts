import type { Request, Response } from "express";

import { runResumeScanPipeline } from "../services/resume-orchestrator";
import { extractResumeText } from "../services/file-parser/resume-file-parser";

export async function handleResumeUpload(req: Request, res: Response) {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    const jobDescription =
      typeof req.body?.jobDescription === "string"
        ? req.body.jobDescription.trim()
        : "";

    const extractedText = await extractResumeText(
      file.buffer,
      file.mimetype
    );

    const pipelineResult = runResumeScanPipeline({
      rawText: extractedText,
      jobDescription
    });

    return res.status(200).json({
      success: true,
      data: {
        ...pipelineResult,
        rawText: extractedText
      }
    });
  } catch (error) {
    console.error("handleResumeUpload error:", error);

    return res.status(500).json({
      success: false,
      error: "Resume upload failed"
    });
  }
}