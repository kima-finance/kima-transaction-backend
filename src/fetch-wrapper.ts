export const fetchWrapper = {
  get,
  post
}

function get(url: string, token?: string) {
  const requestOptions: any = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`
    }
  }

  return fetch(url, requestOptions).then(handleResponse)
}

function post(url: string, body: any) {
  const requestOptions: any = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(body)
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
