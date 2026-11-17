/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Vazon REST API, including the version prefix, e.g. http://localhost:3100/api/v1 */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
