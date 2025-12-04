export default function RequestMethodBadge({ method }: { method: string }) {
  let color = "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white";

  switch (method) {
    case "GET":
      color = "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white";
      break;
    case "POST":
    case "PUT":
      color = "bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-white";
      break;
    case "DELETE":
      color = "bg-red-100 text-red-800 dark:bg-red-600 dark:text-white";
      break;
  }

  return (
    <span className={`rounded px-2 py-1 text-sm font-semibold ${color}`}>
      {method}
    </span>
  );
}
