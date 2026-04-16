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

These steps assume a fresh **Ubuntu 18.04** droplet and serving the app behind **Apache 2** on port 80 (Next.js listens on `127.0.0.1:3000`). SQLite under `data/` works on the droplet’s disk.

1. **Create the droplet** in the DigitalOcean control panel (Ubuntu 18.04, size to taste), add your SSH key, then connect: `ssh root@YOUR_DROPLET_IP`.

2. **Install Node.js** (18 LTS is a reasonable target on 18.04). Example using NodeSource:

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs build-essential
   ```

   Native modules such as `better-sqlite3` need `build-essential` for `npm install`.

3. **Install Apache and proxy modules**, then enable them:

   ```bash
   sudo apt-get update
   sudo apt-get install -y apache2
   sudo a2enmod proxy proxy_http headers rewrite
   sudo systemctl restart apache2
   ```

4. **Deploy the app** (example path `/var/www/cohort-cbt`; adjust user/permissions as you prefer):

   ```bash
   sudo mkdir -p /var/www/cohort-cbt
   sudo chown "$USER":"$USER" /var/www/cohort-cbt
   cd /var/www/cohort-cbt
   git clone https://github.com/hexxondiv/cohort-cbt.git .
   npm install
   ```

   Create `/var/www/cohort-cbt/.env` (or export variables in the systemd unit below) with at least `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SESSION_SECRET`, then:

   ```bash
   npm run build
   ```

5. **Run Next.js with systemd** so it stays up after logout. Example `/etc/systemd/system/cohort-cbt.service`:

   ```ini
   [Unit]
   Description=Cohort CBT (Next.js)
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/cohort-cbt
   EnvironmentFile=/var/www/cohort-cbt/.env
   ExecStart=/usr/bin/npm start
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

   Ensure `www-data` can read the app directory and write `data/` (for SQLite): e.g. `sudo chown -R www-data:www-data /var/www/cohort-cbt` after build, or keep `data/` owned by `www-data` only. Then:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now cohort-cbt
   ```

6. **Apache virtual host** as reverse proxy. Create `/etc/apache2/sites-available/cohort-cbt.conf`:

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

7. **Firewall** (if `ufw` is enabled): allow SSH, HTTP, and HTTPS, e.g. `sudo ufw allow OpenSSH && sudo ufw allow 'Apache Full' && sudo ufw enable`.

8. **HTTPS (recommended):** install Certbot’s Apache plugin and obtain certificates for `your-domain.com`, or terminate TLS on Apache and keep proxying to `http://127.0.0.1:3000`.

Point your domain’s **A record** at the droplet’s public IP. Replace `your-domain.com` in the vhost with your real hostname.
