import { Download, FileDown, Printer, Upload } from 'lucide-react'

function BackupActions({ onExportJson, onImportJson, onExportCsv, onPrint }) {
  return (
    <div className="backup-actions no-print">
      <button className="button secondary" type="button" onClick={onExportJson}>
        <Download size={17} />
        Exportar backup
      </button>
      <label className="button secondary file-button">
        <Upload size={17} />
        Importar backup
        <input type="file" accept="application/json,.json" onChange={onImportJson} />
      </label>
      <button className="button secondary" type="button" onClick={onExportCsv}>
        <FileDown size={17} />
        Exportar CSV
      </button>
      <button className="button secondary" type="button" onClick={onPrint}>
        <Printer size={17} />
        Imprimir agenda
      </button>
    </div>
  )
}

export default BackupActions
