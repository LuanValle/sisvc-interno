import { getDateStatusText, getSituation } from './dateUtils.js'
import { validateBackupStructure } from './validationUtils.js'

const downloadFile = (content, fileName, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportJsonBackup = (conferences) => {
  downloadFile(
    JSON.stringify(conferences, null, 2),
    'backup-videoconferencias.json',
    'application/json;charset=utf-8',
  )
}

export const importJsonBackup = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum arquivo selecionado.'))
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)

        if (!validateBackupStructure(parsed)) {
          reject(new Error('Backup JSON inválido ou com estrutura incompatível.'))
          return
        }

        // Normaliza dados antigos de backup para garantir todos os campos usados pela tela.
        resolve(
          parsed.map((item) => ({
            id: item.id || crypto.randomUUID(),
            name: item.name || '',
            platform: item.platform || '',
            physicalLocation: item.physicalLocation || '',
            date: item.date || '',
            endDate: item.endDate || '',
            time: item.time || '',
            priority: item.priority || '',
            responsible: item.responsible || '',
            department: item.department || '',
            link: item.link || '',
            notes: item.notes || '',
            completed: Boolean(item.completed),
            createdAt: item.createdAt || new Date().toISOString(),
          })),
        )
      } catch {
        reject(new Error('Não foi possível ler o arquivo JSON.'))
      }
    }

    reader.onerror = () => reject(new Error('Erro ao importar backup.'))
    reader.readAsText(file)
  })

const escapeCsv = (value) => {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

export const buildCsvContent = (conferences) => {
  const headers = [
    'Nome',
    'Plataforma',
    'Local',
    'Data inicial',
    'Data final',
    'Horário',
    'Prioridade',
    'Responsável',
    'Setor',
    'Link',
    'Status',
    'Situação',
    'Observações',
  ]

  const rows = conferences.map((conference) => [
    conference.name,
    conference.platform,
    conference.physicalLocation,
    conference.date,
    conference.endDate || '',
    conference.time,
    conference.priority,
    conference.responsible,
    conference.department,
    conference.link,
    getDateStatusText(conference),
    getSituation(conference),
    conference.notes,
  ])

  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n')
  return `\uFEFF${csv}`
}

export const exportCsv = (conferences) => {
  downloadFile(buildCsvContent(conferences), 'videoconferencias.csv', 'text/csv;charset=utf-8')
}
