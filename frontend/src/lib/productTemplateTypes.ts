import type { components } from '../generated/api'

export type ProductTemplateField = components['schemas']['ProductTemplateField']
export type ProductTemplateFieldType =
  components['schemas']['ProductTemplateFieldType']

export type ProductTemplateRow = {
  id: string
  client_id: string
  name: string
  fields: ProductTemplateField[]
  created_at: string
  updated_at: string
}
