import { useForm } from "react-hook-form";
import { FormValues } from "./types";
import { parseLocalPdf } from "@/services/parsePDF";
import { detectBankFromText } from "@/utils/detectBank";

type Props = {
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

export default function UploadForm({ onSubmit, isLoading, error }: Props) {
  const { register, handleSubmit, getValues } = useForm<FormValues>();

  // 🔹 New handler for client-side parsing
  const handleClientParse = async () => {
    try {
      const { file, password } = getValues();
      if (!file || file.length === 0) {
        alert("Please select a PDF file first");
        return;
      }

      const result = await parseLocalPdf(file[0], password);
      const bank = detectBankFromText(result?.lines);
      console.log("Client-side parsed result:", { bank, result });

      alert(
        `✅ Parsed locally!\nPages: ${result.pageCount}\nLines extracted: ${result.lines.length}\nBank: ${bank}`
      );
    } catch (err: any) {
      console.error(err);
      alert("❌ Failed to parse locally: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Upload Your Statement
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col space-y-5"
        >
          <div>
            <label className="text-gray-800 font-medium mb-1 block">
              PDF File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="application/pdf"
              {...register("file", { required: true })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800
                         bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                         file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 
                         file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="text-gray-800 font-medium mb-1 block">
              Password (if any)
            </label>
            <input
              type="password"
              placeholder="Enter PDF password"
              {...register("password")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm 
                         text-gray-900 placeholder-gray-400 bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 🔹 Server-side parsing */}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 
                       transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Parsing..." : "Upload & Parse (Server)"}
          </button>

          {/* 🔹 Client-side parsing */}
          <button
            type="button"
            onClick={handleClientParse}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg py-2.5 
                       transition-all"
          >
            Parse Locally (Client)
          </button>
        </form>

        {error && (
          <p className="text-red-600 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
