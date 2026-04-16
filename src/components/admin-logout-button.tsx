export function AdminLogoutButton() {
  return (
    <form action="/admin/logout" method="post">
      <button
        type="submit"
        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
      >
        Log out
      </button>
    </form>
  );
}
