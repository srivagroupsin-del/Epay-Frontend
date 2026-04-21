type Props = {
  message: string;
};

const Alert = ({ message }: Props) => {
  if (!message) return null;

  return (
    <div className="alert alert-error">
      ⚠ {message}
    </div>
  );
};

export default Alert;
