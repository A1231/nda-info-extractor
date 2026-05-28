import { useState, useRef } from 'react'

const RISK_COLOR = {
  HIGH:   'text-red-600 bg-red-50 border-red-300',
  MEDIUM: 'text-yellow-700 bg-yellow-50 border-yellow-300',
  LOW:    'text-green-700 bg-green-50 border-green-300',
}

function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wide block">{label}</span>
      <span className="text-sm text-gray-900">{String(value)}</span>
    </div>
  )
}

function ListField({ label, items }) {
  if (!items?.length) return null
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">{label}</span>
      <ul className="list-disc list-inside space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-900">{item}</li>
        ))}
      </ul>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">{title}</h2>
      {children}
    </div>
  )
}

export default function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return }
    setFile(f)
    setResult(null)
    setError(null)
  }

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/analyze', { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Server responded with ${res.status}`)
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const risk = result?.validation

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-gray-900 text-white px-6 py-4">
        <h1 className="text-lg font-semibold">NDA Analyzer</h1>
        <p className="text-gray-400 text-sm">Upload an NDA PDF to extract key terms and assess risk</p>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">

        {/* Upload */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer bg-white hover:border-gray-400"
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <svg className="mx-auto mb-2 w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {file
            ? <p className="text-sm font-medium text-gray-800">{file.name} <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span></p>
            : <p className="text-sm text-gray-500">Drag & drop your NDA PDF here, or click to browse</p>
          }
        </div>

        <button
          onClick={analyze}
          disabled={!file || loading}
          className="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Analyze NDA'}
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        {result?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Extraction failed: {result.raw ?? 'invalid response from model'}
          </p>
        )}

        {result && !result.error && (
          <>
            {/* Risk */}
            {risk && (
              <Section title="Risk Assessment">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded border text-sm font-semibold mb-3 ${RISK_COLOR[risk.risk_level]}`}>
                  {risk.risk_level} — Score: {risk.risk_score}
                </div>
                {risk.risk_flags.length > 0
                  ? <ul className="space-y-1">
                      {risk.risk_flags.map((flag, i) => (
                        <li key={i} className="text-sm text-gray-800 flex items-start gap-1.5">
                          <svg className="w-4 h-4 mt-0.5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  : <p className="text-sm text-gray-500">No risk flags detected.</p>
                }
              </Section>
            )}

            {/* NDA Details */}
            <Section title="NDA Details">
              <Field label="NDA Type" value={result.nda_type} />
              <Field label="Disclosing Party" value={result.disclosing_party} />
              <Field label="Receiving Party" value={result.receiving_party} />
              <Field label="Effective Date" value={result.effective_date} />
              <Field label="Governing Law" value={result.governing_law} />
              <Field label="Agreement Term" value={result.agreement_term} />
              <Field label="Confidentiality Survival" value={result.confidentiality_survival} />
              <Field
                label="Return / Destroy Required"
                value={result.return_or_destroy_required === null ? null : result.return_or_destroy_required ? 'Yes' : 'No'}
              />
            </Section>

            {/* Lists */}
            <Section title="Confidential Information & Exceptions">
              <ListField label="Confidential Information Summary" items={result.confidential_information_summary} />
              <ListField label="Exceptions" items={result.exceptions} />
            </Section>

            {/* Recommended action */}
            {result.recommended_action && (
              <Section title="Recommended Action">
                <p className="text-sm text-gray-800">{result.recommended_action}</p>
              </Section>
            )}

            {/* Token usage */}
            {result._usage && (
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap gap-6 text-sm text-gray-600">
                <span><b>Input tokens:</b> {result._usage.input_tokens.toLocaleString()}</span>
                <span><b>Output tokens:</b> {result._usage.output_tokens.toLocaleString()}</span>
                <span><b>Cost:</b> ${result._usage.cost_usd.toFixed(6)}</span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
