type Props = {
  error?: string;
};

export function LoginForm({ error }: Props) {
  return (
    <form
      action="/auth/login"
      method="post"
      className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
    >
      <div className="space-y-2">
        <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="e.g. 0803 883 1882"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
        />
        <p className="text-sm text-slate-500">
          Log in with the phone number you used during cohort registration.
        </p>
      </div>

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <button
        type="submit"
        className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Enter assessment
      </button>
    </form>
  );
}
