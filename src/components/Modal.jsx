export default function Modal({ onClose, children }) {
  return (
    <div className="overlay">
      <div className="modal" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}