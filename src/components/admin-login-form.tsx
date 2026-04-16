type Props = {
  error?: string;
};

export function AdminLoginForm({ error }: Props) {
  return (
    <form
      action="/admin/login"
      method="post"
      className="mx-auto w-full max-w-md space-y-4 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
    >
      <h1 className="text-2xl font-semibold text-slate-950">Admin dashboard</h1>
      <p className="text-sm text-slate-500">Protected access for response review and per-student downloads.</p>

      <input
        type="text"
        name="username"
        defaultValue="admin"
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-400 focus:bg-white"
      />
      <input
        type="password"
        name="password"
        defaultValue="admin"
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-400 focus:bg-white"
      />

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <button
        type="submit"
        className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Open dashboard
      </button>
    </form>
  );
}
