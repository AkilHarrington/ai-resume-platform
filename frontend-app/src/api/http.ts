export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    throw new Error('The server returned an unexpected response.')
  }

  return response.json() as Promise<T>
}

export async function apiPost<TResponse, TBody>(
  url: string,
  body: TBody,
): Promise<TResponse> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let message = 'Something went wrong while contacting the server.'

      try {
        const data = await parseJsonResponse<{ error?: string; message?: string }>(response)
        message = data.error || data.message || message
      } catch {
        if (response.status >= 500) {
          message = 'The server hit an error while processing your request.'
        } else if (response.status === 404) {
          message = 'The API route could not be found.'
        } else if (response.status === 400) {
          message = 'The request was invalid. Please check the resume text and try again.'
        }
      }

      throw new Error(message)
    }

    return parseJsonResponse<TResponse>(response)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Failed to fetch') {
        throw new Error(
          'Could not reach the server. Make sure the backend is running on port 3000 and try again.',
        )
      }

      throw error
    }

    throw new Error('Unexpected network error. Please try again.')
  }
}