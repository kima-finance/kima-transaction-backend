export const fetchWrapper = {
  get,
  post
}

function get(url: string) {
  const requestOptions: any = {
    method: 'GET'
  }

  requestOptions.headers = {
    'Content-Type': 'application/json'
  }

  return fetch(url, requestOptions).then(handleResponse)
}

function post(url: string, body: any) {
  const requestOptions: any = {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
      // Authorization: `Bearer ${token}`
    },
    body: body
  }

  return fetch(url, requestOptions).then(handleResponse)
}

function handleResponse(response: Response) {
  return response.text().then((text) => {
    let data = text

    try {
      data = JSON.parse(text)
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
