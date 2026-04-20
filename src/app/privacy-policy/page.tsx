"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-base py-10 px-6">
      <div className="max-w-3xl mx-auto bg-surface border border-border shadow-surface rounded-2xl p-8">
        <h1 className="font-display text-2xl font-bold mb-6 text-text-primary">
          Privacy Policy
        </h1>

        <p className="text-text-secondary mb-4">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <p className="text-text-secondary mb-6">
          We take your privacy very seriously. This policy explains exactly what
          happens when you upload a bank statement or interact with our
          application.
        </p>

        <h2 className="font-display text-lg font-semibold text-text-primary mt-8 mb-3">
          1. No Server Storage by Default
        </h2>
        <p className="text-text-secondary mb-4">
          When you upload a PDF statement, it is processed entirely within your
          browser. The file is <strong className="text-text-primary">never uploaded to our servers</strong> by
          default. Parsing, data extraction, and visualization occur locally in
          your browser&apos;s memory using client-side technologies such as
          JavaScript, WebAssembly, and IndexedDB.
        </p>

        <h2 className="font-display text-lg font-semibold text-text-primary mt-8 mb-3">
          2. Local Browser Storage
        </h2>
        <p className="text-text-secondary mb-4">
          After parsing, the extracted data (like transaction details, totals,
          and summaries) is stored only in your browser using{" "}
          <code className="text-accent bg-accent-muted px-1 rounded">IndexedDB</code> via the{" "}
          <code className="text-accent bg-accent-muted px-1 rounded">localforage</code> library. This
          ensures the data stays on your device, even if you refresh or close
          the tab.
        </p>
        <p className="text-text-secondary mb-4">
          You can view, delete, or clear this locally stored data at any time
          from within the app. Clearing browser storage or using &quot;Clear Local
          Data&quot; in the interface will remove all parsed statements permanently.
        </p>

        <h2 className="font-display text-lg font-semibold text-text-primary mt-8 mb-3">
          3. Optional Cloud Storage (User-Initiated)
        </h2>
        <p className="text-text-secondary mb-4">
          We offer an optional feature to &quot;Save to Cloud&quot; for users who wish to
          securely back up their parsed statements or enable deeper financial
          analysis and planning tools. This action is{" "}
          <strong className="text-text-primary">completely optional</strong> and requires explicit user
          consent by clicking the &quot;Save to Cloud&quot; button.
        </p>
        <p className="text-text-secondary mb-4">
          When you choose to save data to the cloud, only the parsed transaction
          data and relevant metadata (e.g., totals, categories, or bank name)
          are transmitted to our secure backend API. The original uploaded PDF
          is <strong className="text-text-primary">never stored</strong> or transmitted.
        </p>

        <h2 className="font-display text-lg font-semibold text-text-primary mt-8 mb-3">
          4. Technical Details of Processing
        </h2>
        <ul className="list-disc pl-6 text-text-secondary space-y-2 mb-4">
          <li>
            PDF files are processed using client-side libraries executed in your
            browser (for example,{" "}
            <code className="text-accent bg-accent-muted px-1 rounded">pdf.js</code> or WebAssembly-based
            parsers).
          </li>
          <li>
            Data persistence uses browser storage technologies like{" "}
            <code className="text-accent bg-accent-muted px-1 rounded">IndexedDB</code>, managed through{" "}
            <code className="text-accent bg-accent-muted px-1 rounded">localforage</code>.
          </li>
          <li>
            No cookies or tracking scripts are used for analytics, profiling, or
            advertising.
          </li>
          <li>
            Network requests are only made when you explicitly perform an action
            such as &quot;Save to Cloud&quot; or &quot;Load Saved Data.&quot;
          </li>
        </ul>

        <h2 className="font-display text-lg font-semibold text-text-primary mt-8 mb-3">
          5. Security and Encryption
        </h2>
        <p className="text-text-secondary mb-4">
          When you choose to save data to the cloud, all communication between
          your browser and our servers is encrypted using HTTPS/TLS. We do not
          store sensitive identifiers like account numbers or passwords unless
          necessary for the features you enable.
        </p>

        <h2 className="font-display text-lg font-semibold text-text-primary mt-8 mb-3">
          6. Your Control
        </h2>
        <p className="text-text-secondary mb-4">
          You have full control over your data:
        </p>
        <ul className="list-disc pl-6 text-text-secondary space-y-2 mb-4">
          <li>Clear all local browser data at any time.</li>
          <li>Choose whether to save to the cloud or keep data private.</li>
          <li>
            Request deletion of any cloud-stored data by contacting our support
            team.
          </li>
        </ul>

        <h2 className="font-display text-lg font-semibold text-text-primary mt-8 mb-3">
          7. Contact Us
        </h2>
        <p className="text-text-secondary mb-2">
          If you have any questions or privacy concerns, contact us at:
        </p>
        <p className="text-accent font-medium font-mono">support@yourdomain.com</p>
      </div>
    </div>
  );
}
