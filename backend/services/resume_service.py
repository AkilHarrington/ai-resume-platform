from openai import OpenAI
import json

client = OpenAI()


def generate_resume_content(data):
    prompt = f"""
You are an expert executive resume writer and ATS optimization specialist.

Your task is to generate a highly ATS-compatible, professionally written resume in valid JSON format.

Return ONLY valid JSON in this exact structure:
{{
  "full_name": "string",
  "location": "string",
  "phone": "string",
  "email": "string",
  "professional_summary": "string",
  "skills": ["string", "string"],
  "professional_experience": [
    {{
      "company": "string",
      "title": "string",
      "description": ["string", "string", "string"]
    }}
  ],
  "education": ["string"],
  "certifications": ["string"]
}}

Hard Rules:
- Return JSON only
- No markdown
- No commentary
- No code fences
- No placeholder text
- No bracketed notes
- No missing-section commentary
- If a section has no data, return an empty list or empty string
- Use clear ATS-friendly wording
- Keep contact information simple and parseable
- Tailor the resume strongly to the target role
- Use role-relevant keywords naturally
- Use concise, achievement-oriented language
- Prefer measurable impact whenever possible
- Avoid generic filler language

Professional Summary Rules:
- 3 to 5 lines in length
- Must include years of experience when available
- Must match the target role closely
- Must include 4 to 6 relevant keyword themes from the job description
- Should sound senior and credible, not generic

Skills Rules:
- Include 10 to 16 highly relevant ATS-friendly skills
- Prioritize the most important hard skills and leadership skills from the target role
- Remove duplicates
- Use short, standard phrasing

Professional Experience Rules:
- Include all provided roles when possible
- Each role must contain **4 to 6 bullet points**
- If limited information is available, infer reasonable responsibilities based on the role title and industry
- Each bullet must begin with a strong action verb
- Each bullet must contain responsibility + outcome or impact
- Prefer measurable impact where possible (percentages, budgets, revenue, assets, team size, scale, timelines)

Executive Role Guidance:
- Emphasize strategic leadership
- Mention scale indicators such as budgets, revenue, assets, geographic scope
- Highlight governance, capital allocation, transformation initiatives, and executive decision-making

Technical Role Guidance:
- Emphasize architecture, systems, scalability, reliability, performance, and team leadership

Operations Role Guidance:
- Emphasize process improvement, KPIs, cost reduction, compliance, efficiency gains, and operational scale

Education Rules:
- Include only if provided

Certifications Rules:
- Include only if provided

Candidate Information:
Name: {data.name}
Email: {data.email}
Phone: {data.phone}
Location: {data.location}

Skills:
{data.skills}

Experience:
{data.experience}

Education:
{data.education}

Certifications:
{data.certifications}

Target Role / Job Description:
{data.job_description}
"""

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt
    )

    text_output = response.output[0].content[0].text
    return json.loads(text_output)