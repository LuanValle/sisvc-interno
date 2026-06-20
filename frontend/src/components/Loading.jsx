function Loading({ message = 'Carregando...' }) {
  return (
    <div className="state-box" role="status">
      <strong>{message}</strong>
    </div>
  )
}

export default Loading
