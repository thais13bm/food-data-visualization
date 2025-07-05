type Props = {
  message?: string;
  variant?: string;
};

export function LoadingOverlay({ message, variant }: Props) {
  return (
    <div
      style={{
        backgroundColor: variant === "neutral" ? "white" : "#f3f4f6",
      }}
      className="w-full h-full flex items-center justify-center bg-gray-100"
    >
      <div className="text-center">
        <svg
          className="animate-spin h-24 w-24 text-blue-500 mx-auto mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="#14B8A6"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="#14B8A6"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
        <p className="text-gray-700 font-semibold text-lg">
          {!message ? "Carregando..." : message}
        </p>
      </div>
    </div>
  );
}
