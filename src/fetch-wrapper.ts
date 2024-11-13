export const fetchWrapper = {
  get,
  post
}

function get<T = any>(url: string, token?: string) {
  const requestOptions: any = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`
    }
  }

  return fetch(url, requestOptions).then(handleResponse<T>)
}

function post<T = any>(url: string, body: any) {
  const requestOptions: any = {
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
    } catch (error) {
      data = text
    }

    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
      }

      // const error = (data && data.message) || response.statusText;
      const error = data || response.statusText

      return Promise.reject({ status: response.status, error })
    }

    return data
  })
}
