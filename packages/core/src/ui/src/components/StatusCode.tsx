const getColorClass = (status: number) => {
  if (status >= 200 && status < 300) return "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100";
  if (status >= 300 && status < 400) return "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100";
  if (status >= 400 && status < 500) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100";
  if (status >= 500) return "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100";

  return "bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-200";
};

export const StatusCode = ({ status }: { status: number }) => {
  return (
    <span
      className={`rounded-lg px-2 py-1 text-sm font-semibold ${getColorClass(status)}`}
    >
      {status}
    </span>
  );
};

export default StatusCode;
