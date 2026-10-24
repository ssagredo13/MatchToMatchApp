const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
const apiBaseUrl = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export async function apiFetch(path, options = {}, { authenticated = true } = {}) {
  if (!apiBaseUrl) {
    throw new Error('El servicio API no está configurado para este entorno.');
  }

  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (authenticated) {
    let accessToken;
    try {
      accessToken = sessionStorage.getItem('access_token');
    } catch (error) {
      throw new Error('No se pudo acceder a la sesión de este navegador.', { cause: error });
    }
    if (!accessToken) {
      throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.', {
      cause: error,
    });
  }

  let responseText;
  try {
    responseText = await response.text();
  } catch (error) {
    throw new Error('La conexión se interrumpió al recibir la respuesta del servidor.', {
      cause: error,
    });
  }
  let responseData = null;
  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      throw new Error('El servidor devolvió una respuesta no válida.', { cause: error });
    }
  }

  if (!response.ok) {
    if (authenticated && response.status === 401) {
      try {
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } catch (error) {
        console.error('No se pudo limpiar la sesión vencida:', error);
      }
      window.dispatchEvent(new Event('session-expired'));
    }
    const detail = responseData?.detail;
    const message = typeof detail === 'string' ? detail : `Error del servidor (${response.status}).`;
    throw new Error(message);
  }

  return responseData;
}
