# Educare Re-Entry CBT

Next.js + React + Tailwind + Node.js CBT platform for the cohort-wide re-entry assessment. Responses are stored in SQLite, students are preregistered, phone login is normalized on the backend, and `/admin` is protected with `admin` / `admin` by default.

## Features

- SQLite-backed student roster, attempts, and responses
- Preregistered cohort of 13 students
- Phone-number login with backend normalization
- 3-hour timed assessment
- One-question-at-a-time interface with autosave
- Copy, cut, paste, save, print, and context menu blocking during the test
- Admin dashboard with per-student TXT answer downloads

## Run locally

```bash
npm install
npm run dev:host
```

Open `http://localhost:3000`.

## Admin credentials

- Username: `admin`
- Password: `admin`

Override them if needed:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
SESSION_SECRET=change-me
```

## Host on a DigitalOcean Droplet (Apache 2, Ubuntu 18.04)

These steps assume an **Ubuntu 18.04** droplet that already has **Node.js 16** as the active/default `node` (other apps on the host depend on it) and **Node.js 18** installed as well. Serve the app behind **Apache 2** on port 80 (Next.js listens on `127.0.0.1:3000`). SQLite under `data/` works on the droplet’s disk.

**Which Node for cohort-cbt:** Next.js 16 requires **Node.js ≥ 20.9.0** (see `engines` in `next`). Node **16** and **18** are not enough for `npm run build` / `npm start` on this repo. Keep **16** as the global default for other apps; add **Node.js 20 LTS** alongside and use it **only** for installing, building, and running this project (explicit `PATH` or `ExecStart` in systemd below—do not assume the default `node` is 20).

1. **SSH** to the droplet, e.g. `ssh root@YOUR_DROPLET_IP` (or your deploy user).

2. **Compiler toolchain** for native modules: if missing, install `build-essential` (needed for `better-sqlite3` during `npm install`):

   ```bash
   sudo apt-get update
   sudo apt-get install -y build-essential
   ```

3. **Node.js 20 for this app** (if not already installed). Pick an install layout that lets you point **only** cohort-cbt at Node 20—for example an official binary under `/opt/node-v20`, `n`/`nvm` with a known path, or NodeSource for 20.x. Example using NodeSource (verify with `$(command -v node) -v` that you are invoking 20.x when building and in systemd):

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

   If that changes which `node` is default system-wide and other apps must stay on 16, restore their behavior (e.g. `update-alternatives`, or run those apps with the full path to the Node 16 binary) and keep cohort-cbt’s unit using the Node 20 path.

4. **Install Apache and proxy modules**, then enable them:

   ```bash
   sudo apt-get update
   sudo apt-get install -y apache2
   sudo a2enmod proxy proxy_http headers rewrite
   sudo systemctl restart apache2
   ```

5. **Deploy the app** (example path `/var/www/cohort-cbt`; adjust user/permissions as you prefer). Run `npm install` and `npm run build` with **Node 20** on your `PATH` (not the default Node 16):

   ```bash
   sudo mkdir -p /var/www/cohort-cbt
   sudo chown "$USER":"$USER" /var/www/cohort-cbt
   cd /var/www/cohort-cbt
   git clone https://github.com/hexxondiv/cohort-cbt.git .
   export PATH="/path/to/node20/bin:$PATH"   # e.g. /opt/node-v20/bin — use your real Node 20 prefix
   node -v   # should report v20.x
   npm install
   ```

   Create `/var/www/cohort-cbt/.env` (or export variables in the systemd unit below) with at least `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SESSION_SECRET`, then:

   ```bash
   npm run build
   ```

6. **Run Next.js with systemd** so it stays up after logout. Use the **same Node 20** you used for install/build so `npm start` does not pick up Node 16. Example `/etc/systemd/system/cohort-cbt.service` (adjust `PATH` to your Node 20 `bin` directory):

   ```ini
   [Unit]
   Description=Cohort CBT (Next.js)
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/cohort-cbt
   EnvironmentFile=/var/www/cohort-cbt/.env
   Environment=PATH=/path/to/node20/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
   ExecStart=/path/to/node20/bin/npm start
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

   Ensure `www-data` can read the app directory and write `data/` (for SQLite): e.g. `sudo chown -R www-data:www-data /var/www/cohort-cbt` after build, or keep `data/` owned by `www-data` only. Then:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now cohort-cbt
   ```

7. **Apache virtual host** as reverse proxy. Create `/etc/apache2/sites-available/cohort-cbt.conf`:

   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com

       ProxyPreserveHost On
       ProxyPass / http://127.0.0.1:3000/
       ProxyPassReverse / http://127.0.0.1:3000/

       ErrorLog ${APACHE_LOG_DIR}/cohort-cbt-error.log
       CustomLog ${APACHE_LOG_DIR}/cohort-cbt-access.log combined
   </VirtualHost>
   ```

   Enable the site and reload Apache:

   ```bash
   sudo a2dissite 000-default.conf
   sudo a2ensite cohort-cbt.conf
   sudo apache2ctl configtest
   sudo systemctl reload apache2
   ```

8. **Firewall** (if `ufw` is enabled): allow SSH, HTTP, and HTTPS, e.g. `sudo ufw allow OpenSSH && sudo ufw allow 'Apache Full' && sudo ufw enable`.

9. **HTTPS (recommended):** install Certbot’s Apache plugin and obtain certificates for `your-domain.com`, or terminate TLS on Apache and keep proxying to `http://127.0.0.1:3000`.

Point your domain’s **A record** at the droplet’s public IP. Replace `your-domain.com` in the vhost with your real hostname.
