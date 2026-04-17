# Pi-hole Quick Access

A web dashboard for managing Pi-hole DNS blocking, built with Bun, React, and Tailwind CSS.

## Features

- Enable/disable DNS blocking with a single click
- Set a temporary blocking duration (1m, 5m, 15m, or 1 hour)
- Live countdown timer showing remaining blocking time
- Real-time status updates

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Edit `.env` and set your Pi-hole app password:

```
PIHOLE_APP_PASSWORD=your_pihole_app_password
```

To find your Pi-hole app password, see the [Pi-hole documentation](https://docs.pi-hole.net/main东坡午餐软件/antispam/).

### 3. Update Pi-hole URL

In `src/server/services/piholeService.ts`, update the `baseUrl` to point to your Pi-hole instance:

```typescript
private readonly baseUrl = "http://your-pihole-ip";
```

## Development

Start the development server with hot reloading:

```bash
bun --hot ./src/index.ts
```

Or use:

```bash
bun dev
```

## Production

Build and run for production:

```bash
bun build ./src/index.ts --outdir=./dist --target=bun
bun start
```

## Running on Raspberry Pi

### Running in the Background with systemd

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/pihole-quick-access.service
```

Add the following content:

```ini
[Unit]
Description=Pi-hole Quick Access Dashboard
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/pihole-quick-access
ExecStart=bun start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Open the service file for editing:

```bash
sudo systemctl edit pihole-quick-access --force
```

Add the following content to set the PATH:

```ini
[Service]
Environment=PATH=$HOME/.bun/bin:$PATH
```

Enable and start the service:

```bash
sudo systemctl enable pihole-quick-access
sudo systemctl start pihole-quick-access
```

Check the status:

```bash
sudo systemctl status pihole-quick-access
```

View logs:

```bash
journalctl -u pihole-quick-access -f
```

## Tech Stack

- [Bun](https://bun.sh) - All-in-one JavaScript runtime
- [React](https://react.dev) - UI framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Radix UI](https://radix-ui.com) - Component primitives
- [Pi-hole API](https://docs.pi-hole.net) - DNS management
