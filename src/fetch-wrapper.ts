export const fetchWrapper = {
  get,
  post
}

function get<T = any>(url: string, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) headers['Authorization'] = token

  const requestOptions: RequestInit = {
    method: 'GET',
    headers
  }

  return fetch(url, requestOptions).then(handleResponse<T>)
}

function post<T = any>(url: string, body: any) {
  const requestOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(body)
  }

  return fetch(url, requestOptions).then(handleResponse<T>)
}

function handleResponse<T = any>(response: Response): Promise<T | string> {
  return response.text().then((text) => {
    let data: T | string = text

    try {
      data = JSON.parse(text) as T
    } catch {
      data = text
    }

    if (!response.ok) {
      // Include upstream body text for debugging; caller can decide what to expose
      const error = data || response.statusText
      return Promise.reject({ status: response.status, error })
    }

    return data
  })
}
