import { Search } from 'lucide-react'

function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <div className="search-bar no-print">
      <Search size={18} aria-hidden="true" />
      <input
        type="search"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Buscar por nome, plataforma, responsável, setor ou observações"
        aria-label="Buscar videoconferências"
      />
    </div>
  )
}

export default SearchBar
