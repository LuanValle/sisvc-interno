import { Ellipsis } from 'lucide-react'
import { useState } from 'react'
import BackupActions from './BackupActions'

function ExportActions(props) {
  const [isOpen, setIsOpen] = useState(false)

  const closeAfter = (handler) => (...args) => {
    handler?.(...args)
    setIsOpen(false)
  }

  return (
    <div className="agenda-options">
      <button
        className="icon-button agenda-options-toggle"
        type="button"
        aria-label="Mais opcoes da agenda"
        aria-expanded={isOpen}
        title="Mais opcoes"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Ellipsis size={20} />
      </button>
      {isOpen && (
        <div className="agenda-options-menu">
          <BackupActions
            {...props}
            onExportJson={closeAfter(props.onExportJson)}
            onImportJson={closeAfter(props.onImportJson)}
            onExportCsv={closeAfter(props.onExportCsv)}
            onPrint={closeAfter(props.onPrint)}
          />
        </div>
      )}
    </div>
  )
}

export default ExportActions
