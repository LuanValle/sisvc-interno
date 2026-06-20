export function readJsonBody(request) {
  if (!request.body) return {}

  if (typeof request.body === 'string') {
    const bodyText = request.body.trim()
    if (!bodyText) return {}
    return JSON.parse(bodyText)
  }

  return request.body
}

export function sendJsonParseError(response) {
  return response.status(400).json({
    error: 'JSON invalido.',
  })
}
