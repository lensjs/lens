export default function NoData() {
  return (
    <>
      {" "}
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <svg
          className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-1">
          No Data found
        </h3>
      </div>
    </>
  );
}
