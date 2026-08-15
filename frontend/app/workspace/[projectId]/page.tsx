"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Editor from "@monaco-editor/react";
import { useParams } from "next/navigation";

type FileItem = {
  _id?: string;
  name: string;
  path: string;
  language: string;
  content: string;
};

type BrowserFile = File & {
  webkitRelativePath?: string;
};

const API = "http://localhost:5000";

const UPLOAD_BATCH_SIZE = 50;

function getLanguage(filename: string) {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".tsx") || lower.endsWith(".ts"))
    return "typescript";
  if (lower.endsWith(".jsx") || lower.endsWith(".js"))
    return "javascript";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".scss")) return "scss";
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".cpp") || lower.endsWith(".cc"))
    return "cpp";
  if (lower.endsWith(".c")) return "c";
  if (lower.endsWith(".sql")) return "sql";
  if (lower.endsWith(".xml")) return "xml";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml"))
    return "yaml";
  if (lower.endsWith(".sh")) return "shell";

  return "plaintext";
}

function isProbablyTextFile(filename: string) {
  const lower = filename.toLowerCase();

  const textExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".html",
    ".htm",
    ".md",
    ".txt",
    ".xml",
    ".svg",
    ".yaml",
    ".yml",
    ".env",
    ".gitignore",
    ".npmrc",
    ".prettierrc",
    ".eslintrc",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".java",
    ".py",
    ".go",
    ".rs",
    ".php",
    ".rb",
    ".sql",
    ".sh",
    ".bat",
    ".ps1",
  ];

  if (
    lower.endsWith(".gitignore") ||
    lower.endsWith(".env") ||
    lower.endsWith(".npmrc") ||
    lower.endsWith(".prettierrc") ||
    lower.endsWith(".eslintrc")
  ) {
    return true;
  }

  return textExtensions.some((extension) =>
    lower.endsWith(extension)
  );
}

function getFileIcon(name: string) {
  const lower = name.toLowerCase();

  if (
    lower.endsWith(".tsx") ||
    lower.endsWith(".jsx")
  ) {
    return "⚛";
  }

  if (
    lower.endsWith(".ts") ||
    lower.endsWith(".js")
  ) {
    return "◈";
  }

  if (lower.endsWith(".json")) {
    return "{}";
  }

  if (
    lower.endsWith(".css") ||
    lower.endsWith(".scss")
  ) {
    return "#";
  }

  if (lower.endsWith(".md")) {
    return "M";
  }

  if (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".svg")
  ) {
    return "◉";
  }

  return "•";
}

/*
 * Safely read an API response.
 *
 * Your previous code was doing:
 *
 *   const data = await response.json();
 *
 * If Express returns an HTML error page, that crashes with:
 *
 *   Unexpected token '<'
 *
 * This helper prevents that.
 */
async function readApiResponse(response: Response) {
  const contentType =
    response.headers.get("content-type") || "";

  const text = await response.text();

  if (contentType.includes("application/json")) {
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        "Server returned invalid JSON."
      );
    }
  }

  if (text.trim().startsWith("<!DOCTYPE") ||
      text.trim().startsWith("<html")) {
    throw new Error(
      `Server returned an HTML error page (${response.status}). Check that the backend route is running at ${API}.`
    );
  }

  throw new Error(
    text ||
      `Server returned HTTP ${response.status}`
  );
}

export default function WorkspacePage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState("");

  const [loadingFiles, setLoadingFiles] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [terminalOpen, setTerminalOpen] =
    useState(true);

  const [aiOpen, setAiOpen] =
    useState(true);

  const [aiMessage, setAiMessage] =
    useState("");

  const [aiResponse, setAiResponse] =
    useState(
      "Ask me to explain code, find bugs, generate features, or modify your project."
    );

  const folderInputRef =
    useRef<HTMLInputElement>(null);

  const [terminalLines, setTerminalLines] =
    useState<string[]>([
      "$ npm run dev",
      "",
      "> devsync-project@1.0.0 dev",
      "> next dev",
      "",
      "DevSync development server started...",
      "Ready on http://localhost:3000",
    ]);

  // =========================
  // LOAD FILES
  // =========================

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token =
          localStorage.getItem(
            "devsync_token"
          );

        if (!token || !projectId) {
          setLoadingFiles(false);
          return;
        }

        const response = await fetch(
          `${API}/api/files/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data =
          await readApiResponse(response);

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load files"
          );
        }

        setFiles(data.files || []);

        if (
          data.files &&
          data.files.length > 0
        ) {
          setActiveFile(
            data.files[0].path
          );
        }
      } catch (error) {
        console.error(
          "Failed to fetch files:",
          error
        );

        setTerminalLines((current) => [
          ...current,
          `✗ Failed to load project files`,
        ]);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchFiles();
  }, [projectId]);

  const currentFile = useMemo(
    () =>
      files.find(
        (file) =>
          file.path === activeFile
      ),
    [files, activeFile]
  );

  // =========================
  // UPDATE EDITOR
  // =========================

  function updateFileContent(
    value?: string
  ) {
    setFiles((current) =>
      current.map((file) =>
        file.path === activeFile
          ? {
              ...file,
              content: value ?? "",
            }
          : file
      )
    );
  }

  // =========================
  // SAVE FILE
  // =========================

  async function saveCurrentFile() {
    if (!currentFile?._id) {
      return;
    }

    try {
      const token =
        localStorage.getItem(
          "devsync_token"
        );

      if (!token) return;

      setSaving(true);

      const response = await fetch(
        `${API}/api/files/${projectId}/${currentFile._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: currentFile.name,
            path: currentFile.path,
            language:
              currentFile.language,
            content:
              currentFile.content,
          }),
        }
      );

      const data =
        await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save file"
        );
      }

      setFiles((current) =>
        current.map((file) =>
          file._id === data.file._id
            ? data.file
            : file
        )
      );

      setTerminalLines((current) => [
        ...current,
        `✓ Saved ${currentFile.path}`,
      ]);
    } catch (error) {
      console.error(
        "Failed to save file:",
        error
      );

      setTerminalLines((current) => [
        ...current,
        `✗ Failed to save ${currentFile.path}`,
      ]);
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // CREATE FILE
  // =========================

  async function createFile() {
    const name = window.prompt(
      "Enter file name\n\nExample: src/components/Button.tsx"
    );

    if (!name || !name.trim()) {
      return;
    }

    const cleanName = name.trim();

    const path = cleanName.includes("/")
      ? cleanName
      : `src/${cleanName}`;

    const fileName =
      path.split("/").pop() ||
      cleanName;

    const language =
      getLanguage(fileName);

    try {
      const token =
        localStorage.getItem(
          "devsync_token"
        );

      if (!token) return;

      const response = await fetch(
        `${API}/api/files/${projectId}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: fileName,
            path,
            language,
            content: "",
          }),
        }
      );

      const data =
        await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create file"
        );
      }

      setFiles((current) => [
        ...current,
        data.file,
      ]);

      setActiveFile(
        data.file.path
      );

      setTerminalLines((current) => [
        ...current,
        `✓ Created ${data.file.path}`,
      ]);
    } catch (error) {
      console.error(
        "Failed to create file:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to create file";

      window.alert(message);
    }
  }

  // =========================
  // OPEN FOLDER PICKER
  // =========================

  function openFolderPicker() {
    if (uploading) return;

    folderInputRef.current?.click();
  }

  // =========================
  // UPLOAD PROJECT
  // =========================

  async function handleFolderUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles =
      Array.from(
        event.target.files || []
      ) as BrowserFile[];

    // Allow selecting the same folder again
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const token =
      localStorage.getItem(
        "devsync_token"
      );

    if (!token) {
      window.alert(
        "Please login again."
      );
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      setTerminalLines((current) => [
        ...current,
        "",
        `$ Found ${selectedFiles.length} files`,
        "$ Preparing project skeleton...",
      ]);

      /*
       * Browser folder uploads usually contain:
       *
       * project/
       *   src/
       *   public/
       *   package.json
       *   node_modules/
       *
       * We DON'T want the outer "project" directory
       * in every database path.
       *
       * So:
       *
       * project/src/app/page.tsx
       *
       * becomes:
       *
       * src/app/page.tsx
       */

      let rootFolder = "";

      const firstPath =
        selectedFiles[0]
          .webkitRelativePath ||
        selectedFiles[0].name;

      const firstParts =
        firstPath.split("/");

      if (firstParts.length > 1) {
        rootFolder = firstParts[0];
      }

      const filesToUpload: {
        name: string;
        path: string;
        language: string;
        content: string;
      }[] = [];

      /*
       * Read files one by one.
       *
       * This avoids trying to read everything
       * simultaneously and killing the browser
       * on large projects.
       */

      for (
        let index = 0;
        index < selectedFiles.length;
        index++
      ) {
        const browserFile =
          selectedFiles[index];

        const relativePath =
          browserFile.webkitRelativePath ||
          browserFile.name;

        const normalizedPath =
          relativePath.replace(
            /\\/g,
            "/"
          );

        const parts =
          normalizedPath.split("/");

        /*
         * Ignore dependency/build folders.
         *
         * These are NOT part of the project
         * source skeleton and can contain thousands
         * of files.
         */
        if (
          parts.includes(
            "node_modules"
          ) ||
          parts.includes(".git") ||
          parts.includes(".next") ||
          parts.includes(
            "dist"
          ) ||
          parts.includes(
            "build"
          ) ||
          parts.includes(
            "coverage"
          )
        ) {
          continue;
        }

        let projectPath =
          normalizedPath;

        if (
          rootFolder &&
          projectPath.startsWith(
            `${rootFolder}/`
          )
        ) {
          projectPath =
            projectPath.slice(
              rootFolder.length + 1
            );
        }

        /*
         * Ignore empty paths.
         */
        if (!projectPath) {
          continue;
        }

        let content = "";

        /*
         * Text files get their actual source.
         *
         * Binary files remain in the skeleton
         * but don't store binary data in MongoDB.
         */
        if (
          isProbablyTextFile(
            browserFile.name
          )
        ) {
          try {
            content =
              await browserFile.text();
          } catch {
            content = "";
          }
        }

        filesToUpload.push({
          name: browserFile.name,
          path: projectPath,
          language:
            getLanguage(
              browserFile.name
            ),
          content,
        });

        /*
         * Update preparation progress.
         */
        if (
          index % 10 === 0 ||
          index ===
            selectedFiles.length - 1
        ) {
          const progress = Math.round(
            ((index + 1) /
              selectedFiles.length) *
              30
          );

          setUploadProgress(
            progress
          );
        }
      }

      if (
        filesToUpload.length === 0
      ) {
        throw new Error(
          "No usable files were found. The folder may only contain node_modules, .git or build files."
        );
      }

      setTerminalLines((current) => [
        ...current,
        `✓ Prepared ${filesToUpload.length} project files`,
        `$ Uploading in batches of ${UPLOAD_BATCH_SIZE}...`,
      ]);

      /*
       * Upload in small batches.
       *
       * This is important for big projects because
       * one gigantic JSON request can exceed Express/
       * Node/browser request limits.
       */

      const allUploadedFiles: FileItem[] =
        [];

      const totalBatches =
        Math.ceil(
          filesToUpload.length /
            UPLOAD_BATCH_SIZE
        );

      for (
        let batchIndex = 0;
        batchIndex < totalBatches;
        batchIndex++
      ) {
        const start =
          batchIndex *
          UPLOAD_BATCH_SIZE;

        const batch =
          filesToUpload.slice(
            start,
            start +
              UPLOAD_BATCH_SIZE
          );

        setTerminalLines((current) => [
          ...current,
          `→ Uploading batch ${
            batchIndex + 1
          }/${totalBatches} (${batch.length} files)`,
        ]);

        const response =
          await fetch(
            `${API}/api/files/${projectId}/upload`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                files: batch,
              }),
            }
          );

        const data =
          await readApiResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Upload failed on batch ${
                batchIndex + 1
              }/${totalBatches}`
          );
        }

        /*
         * Backend should return:
         *
         * {
         *   files: [...],
         *   count: ...
         * }
         */
        if (
          Array.isArray(data.files)
        ) {
          allUploadedFiles.push(
            ...data.files
          );

          /*
           * Show files immediately in
           * the explorer as batches finish.
           */
          setFiles((current) => {
            const map =
              new Map(
                current.map(
                  (file) => [
                    file.path,
                    file,
                  ]
                )
              );

            for (const file of data.files) {
              map.set(
                file.path,
                file
              );
            }

            return Array.from(
              map.values()
            );
          });
        }

        const progress =
          30 +
          Math.round(
            ((batchIndex + 1) /
              totalBatches) *
              70
          );

        setUploadProgress(
          progress
        );
      }

      /*
       * Select the first uploaded file.
       */
      if (
        allUploadedFiles.length > 0
      ) {
        setActiveFile(
          allUploadedFiles[0].path
        );
      }

      setUploadProgress(100);

      setTerminalLines((current) => [
        ...current,
        `✓ Uploaded ${filesToUpload.length} files`,
        "✓ Project structure imported successfully",
        "✓ node_modules / .git / .next excluded",
      ]);
    } catch (error) {
      console.error(
        "Project upload failed:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload project";

      setTerminalLines((current) => [
        ...current,
        `✗ ${message}`,
      ]);

      window.alert(message);
    } finally {
      setUploading(false);

      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    }
  }

  // =========================
  // RUN
  // =========================

  function handleRun() {
    setTerminalOpen(true);

    setTerminalLines((current) => [
      ...current,
      "",
      "$ npm run dev",
      "> Starting DevSync project...",
      "✓ Compiled successfully",
      "✓ Local: http://localhost:3000",
    ]);
  }

  // =========================
  // AI
  // =========================

  function handleAiSubmit() {
    if (!aiMessage.trim()) {
      return;
    }

    const message =
      aiMessage.trim();

    setAiResponse(
      `I received: "${message}"\n\nI can work with ${
        currentFile?.name ??
        "your project"
      } once the DevSync AI backend is connected.`
    );

    setAiMessage("");
  }

  // =========================
  // LOADING
  // =========================

  if (loadingFiles) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#050505] text-sm text-zinc-500">
        Loading workspace...
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#050505] text-white">
      {/* TOP BAR */}

      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-[#080808] px-4">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="flex items-center gap-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-xs font-bold text-black">
              D
            </div>

            <span className="text-sm font-semibold">
              DevSync
            </span>
          </a>

          <span className="text-zinc-700">
            /
          </span>

          <span className="text-sm text-zinc-400">
            Workspace
          </span>

          <span className="text-zinc-700">
            /
          </span>

          <span className="max-w-[180px] truncate text-sm text-zinc-500">
            {projectId}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            1 online
          </div>

          <button
            onClick={() =>
              setAiOpen(
                (value) => !value
              )
            }
            className={`rounded-md border px-3 py-1.5 text-xs transition ${
              aiOpen
                ? "border-purple-500/40 bg-purple-500/10 text-purple-300"
                : "border-zinc-800 text-zinc-500 hover:text-white"
            }`}
          >
            AI ✨
          </button>

          <button
            onClick={handleRun}
            className="rounded-md bg-white px-4 py-1.5 text-xs font-medium text-black transition hover:bg-zinc-200"
          >
            ▶ Run
          </button>
        </div>
      </header>

      {/* WORKSPACE */}

      <div className="flex min-h-0 flex-1">
        {/* EXPLORER */}

        <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-[#080808] md:block">
          <div className="flex h-10 items-center justify-between border-b border-zinc-800 px-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Explorer
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={
                  openFolderPicker
                }
                disabled={uploading}
                className="rounded px-2 py-1 text-[10px] text-zinc-500 hover:bg-zinc-900 hover:text-white disabled:opacity-40"
                title="Upload project folder"
              >
                {uploading
                  ? "..."
                  : "↑"}
              </button>

              <button
                onClick={createFile}
                className="text-zinc-600 hover:text-white"
                title="Create file"
              >
                +
              </button>
            </div>

            <input
              ref={folderInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={
                handleFolderUpload
              }
              {...({
                webkitdirectory: "",
                directory: "",
              } as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          </div>

          {/* UPLOAD BUTTON */}

          <div className="border-b border-zinc-900 px-3 py-2">
            <button
              onClick={
                openFolderPicker
              }
              disabled={uploading}
              className="w-full rounded-md border border-zinc-800 px-3 py-2 text-left text-xs text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white disabled:opacity-50"
            >
              {uploading
                ? `Uploading... ${uploadProgress}%`
                : "↑ Upload project folder"}
            </button>

            {uploading && (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* FILE EXPLORER */}

          <div className="h-[calc(100%-82px)] overflow-y-auto p-2">
            {files.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-zinc-700">
                No files yet.
                <br />
                Upload a project or
                create one.
              </div>
            ) : (
              <div className="space-y-0.5">
                {files.map(
                  (file) => {
                    const depth =
                      file.path.split(
                        "/"
                      ).length - 1;

                    return (
                      <button
                        key={
                          file._id ||
                          file.path
                        }
                        onClick={() =>
                          setActiveFile(
                            file.path
                          )
                        }
                        title={
                          file.path
                        }
                        className={`flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-xs transition ${
                          activeFile ===
                          file.path
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                        }`}
                        style={{
                          paddingLeft: `${
                            8 +
                            depth *
                              14
                          }px`,
                        }}
                      >
                        <span className="w-4 shrink-0 text-[10px] text-zinc-600">
                          {getFileIcon(
                            file.name
                          )}
                        </span>

                        <span className="truncate">
                          {file.name}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER */}

        <section className="flex min-w-0 flex-1 flex-col">
          {/* TABS */}

          <div className="flex h-10 shrink-0 overflow-x-auto border-b border-zinc-800 bg-[#080808]">
            {currentFile && (
              <div
                key={
                  currentFile.path
                }
                className="flex min-w-[130px] items-center gap-2 border-r border-zinc-800 border-t-2 border-t-white bg-[#101010] px-4 text-xs text-zinc-300"
              >
                <span>
                  {getFileIcon(
                    currentFile.name
                  )}
                </span>

                {currentFile.name}

                <span className="ml-auto text-zinc-600">
                  ×
                </span>
              </div>
            )}
          </div>

          {/* EDITOR */}

          <div className="min-h-0 flex-1">
            {currentFile ? (
              <Editor
                height="100%"
                language={
                  currentFile.language
                }
                value={
                  currentFile.content
                }
                onChange={
                  updateFileContent
                }
                theme="vs-dark"
                onMount={(
                  editor
                ) => {
                  editor.addCommand(
                    2048 | 49,
                    () => {
                      saveCurrentFile();
                    }
                  );
                }}
                options={{
                  minimap: {
                    enabled: true,
                  },
                  fontSize: 14,
                  padding: {
                    top: 16,
                  },
                  automaticLayout:
                    true,
                  smoothScrolling:
                    true,
                  cursorBlinking:
                    "smooth",
                  tabSize: 2,
                  wordWrap: "on",
                  scrollBeyondLastLine:
                    false,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-600">
                {files.length ===
                0
                  ? "Upload a project to start coding"
                  : "Select a file"}
              </div>
            )}
          </div>

          {/* SAVE BAR */}

          {currentFile && (
            <div className="flex h-9 shrink-0 items-center justify-between border-t border-zinc-800 bg-[#080808] px-4">
              <span className="text-[10px] text-zinc-600">
                {saving
                  ? "Saving..."
                  : "Changes are local"}
              </span>

              <button
                onClick={
                  saveCurrentFile
                }
                disabled={saving}
                className="rounded-md border border-zinc-800 px-3 py-1 text-[10px] text-zinc-400 hover:bg-zinc-900 hover:text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          )}

          {/* TERMINAL */}

          {terminalOpen && (
            <div className="h-48 shrink-0 border-t border-zinc-800 bg-[#050505]">
              <div className="flex h-9 items-center justify-between border-b border-zinc-800 px-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Terminal
                </span>

                <button
                  onClick={() =>
                    setTerminalOpen(
                      false
                    )
                  }
                  className="text-zinc-600 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="h-[calc(100%-36px)] overflow-y-auto p-4 font-mono text-xs leading-6 text-zinc-500">
                {terminalLines.map(
                  (
                    line,
                    index
                  ) => (
                    <div
                      key={`${line}-${index}`}
                      className={
                        line.includes(
                          "✓"
                        )
                          ? "text-emerald-500"
                          : line.startsWith(
                              "$"
                            )
                          ? "text-zinc-300"
                          : line.includes(
                              "✗"
                            )
                          ? "text-red-400"
                          : ""
                      }
                    >
                      {line ||
                        "\u00A0"}
                    </div>
                  )
                )}

                <div className="mt-1 flex">
                  <span className="mr-2 text-emerald-500">
                    $
                  </span>

                  <span className="animate-pulse">
                    ▌
                  </span>
                </div>
              </div>
            </div>
          )}

          {!terminalOpen && (
            <button
              onClick={() =>
                setTerminalOpen(
                  true
                )
              }
              className="h-8 shrink-0 border-t border-zinc-800 bg-[#080808] text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white"
            >
              Open Terminal
            </button>
          )}
        </section>

        {/* AI PANEL */}

        {aiOpen && (
          <aside className="hidden w-80 shrink-0 flex-col border-l border-zinc-800 bg-[#080808] xl:flex">
            <div className="flex h-10 items-center gap-2 border-b border-zinc-800 px-4">
              <span className="text-purple-400">
                ✦
              </span>

              <span className="text-xs font-semibold">
                DevSync AI
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                <p className="text-sm font-medium text-purple-200">
                  AI assistant for your
                  project
                </p>

                <p className="mt-2 whitespace-pre-line text-xs leading-5 text-zinc-500">
                  {aiResponse}
                </p>
              </div>

              {currentFile && (
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-700">
                    Current file
                  </p>

                  <div className="mt-2 rounded-lg border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-zinc-400">
                    {
                      currentFile.path
                    }
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-2">
                {[
                  "Explain this code",
                  "Find bugs",
                  "Improve this code",
                  "Generate a feature",
                ].map(
                  (suggestion) => (
                    <button
                      key={
                        suggestion
                      }
                      onClick={() =>
                        setAiMessage(
                          suggestion
                        )
                      }
                      className="w-full rounded-lg border border-zinc-800 px-3 py-2.5 text-left text-xs text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                    >
                      {
                        suggestion
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800 p-4">
              <div className="rounded-xl border border-zinc-800 bg-black p-2">
                <textarea
                  value={aiMessage}
                  onChange={(e) =>
                    setAiMessage(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                        "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();
                      handleAiSubmit();
                    }
                  }}
                  placeholder="Ask DevSync AI..."
                  rows={3}
                  className="w-full resize-none bg-transparent px-2 py-1 text-xs text-white outline-none placeholder:text-zinc-700"
                />

                <div className="flex justify-end">
                  <button
                    onClick={
                      handleAiSubmit
                    }
                    className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* STATUS BAR */}

      <footer className="flex h-6 shrink-0 items-center justify-between border-t border-zinc-800 bg-[#080808] px-3 text-[10px] text-zinc-600">
        <div className="flex items-center gap-4">
          <span>main</span>

          <span>✓</span>

          <span>
            {currentFile?.language ??
              "Plain Text"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>
            Spaces: 2
          </span>

          <span>
            UTF-8
          </span>

          <span>
            DevSync
          </span>
        </div>
      </footer>
    </main>
  );
}