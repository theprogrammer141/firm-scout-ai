export default function LoadingSpinner({ message }) {
  return (
    <div className="spinner">
      <div className="spinner__ring" />
      {message && <div className="spinner__message">{message}</div>}
    </div>
  );
}
