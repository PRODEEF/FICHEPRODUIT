import type { components } from '../generated/api'
import { getApiBaseUrl } from './apiBase'

export type RefineTemplateFieldsRequest =
  components['schemas']['RefineTemplateFieldsRequest']
export type RefineTemplateFieldsResponse =
  components['schemas']['RefineTemplateFieldsResponse']

export async function refineTemplateFields(
  body: RefineTemplateFieldsRequest,
  accessToken: string,
): Promise<RefineTemplateFieldsResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/refine-template-fields`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const j = (await res.json()) as { message?: string | string[] }
      if (typeof j.message === 'string') message = j.message
      else if (Array.isArray(j.message) && j.message[0])
        message = String(j.message[0])
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  return res.json() as Promise<RefineTemplateFieldsResponse>
}
