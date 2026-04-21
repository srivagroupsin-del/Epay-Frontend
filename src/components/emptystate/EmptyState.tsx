type Props = {
  message: string;
};

const EmptyState = ({ message }: Props) => {
  return (
    <div className="empty-state">
      {message}
    </div>
  );
};

export default EmptyState;
